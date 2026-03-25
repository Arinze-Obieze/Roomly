/**
 * POST /api/interests/show-interest
 * 
 * Called when a seeker clicks "Show Interest" on a listing.
 * Creates a pending property_interest record.
 * If the listing is public, auto-accepts (no landlord review required).
 * 
 * Body: { propertyId: string, message?: string }
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { bumpCacheVersion } from '@/core/utils/redis';
import { Notifier } from '@/core/services/notifications/notifier';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';
import { buildMatchAnalyticsMetadata } from '@/core/services/matching/presentation/match-analytics';
import { resolveShowPropertyInterestDecision } from '@/core/services/interests/show-property-interest';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, message } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    // 1. Fetch the property to verify it exists and get privacy setting
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, listed_by_user_id, is_public, privacy_setting, title, is_active')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // 2. Get the seeker's compatibility score and lifestyle status.
    const [{ data: scoreRow }, { data: lifestyleRow }] = await Promise.all([
      supabase
        .from('compatibility_scores')
        .select('score')
        .eq('seeker_id', user.id)
        .eq('property_id', propertyId)
        .maybeSingle(),
      supabase
        .from('user_lifestyles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const decision = resolveShowPropertyInterestDecision({
      property,
      userId: user.id,
      hasLifestyle: !!lifestyleRow,
      matchScore: scoreRow?.score ?? null,
    });
    if (!decision.ok) {
      return NextResponse.json({ error: decision.error }, { status: decision.status });
    }

    const { isPrivateListing, initialStatus } = decision;

    // 4. Short-circuit if an interest already exists for this seeker/property.
    // This makes the endpoint idempotent and avoids surfacing duplicate clicks as 500s.
    const { data: existingInterest, error: existingInterestError } = await supabase
      .from('property_interests')
      .select('id, status, compatibility_score, message, created_at, updated_at')
      .eq('seeker_id', user.id)
      .eq('property_id', propertyId)
      .maybeSingle();

    if (existingInterestError) {
      throw existingInterestError;
    }

    if (existingInterest) {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        status: existingInterest.status || 'pending',
        interest: existingInterest,
        message: existingInterest.status === 'accepted'
          ? 'Interest already recorded. You can message the landlord.'
          : 'You have already shown interest in this listing.',
      });
    }

    // 5. Insert the interest record
    const { data: interest, error: insertError } = await supabase
      .from('property_interests')
      .insert(
        {
          seeker_id: user.id,
          property_id: propertyId,
          status: initialStatus,
          compatibility_score: scoreRow?.score ?? null,
          message: message || null,
          updated_at: new Date().toISOString(),
        }
      )
      .select()
      .single();

    if (insertError) {
      // Handle race conditions gracefully if another request created the row first.
      if (insertError.code === '23505') {
        const { data: duplicateInterest } = await supabase
          .from('property_interests')
          .select('id, status, compatibility_score, message, created_at, updated_at')
          .eq('seeker_id', user.id)
          .eq('property_id', propertyId)
          .maybeSingle();

        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          status: duplicateInterest?.status || 'pending',
          interest: duplicateInterest || null,
          message: duplicateInterest?.status === 'accepted'
            ? 'Interest already recorded. You can message the landlord.'
            : 'You have already shown interest in this listing.',
        });
      }
      throw insertError;
    }

    // 6. Bump relevant cache versions (no Redis KEYS scans)
    await Promise.all([
      bumpCacheVersion(`v:interests:seeker:${user.id}`),
      bumpCacheVersion(`v:interests:landlord:${property.listed_by_user_id}`),
      bumpCacheVersion(`v:interests:user:${user.id}`),
      bumpCacheVersion(`v:interests:user:${property.listed_by_user_id}`),
      bumpCacheVersion(`v:properties:user:${user.id}`),
    ]);

    // 7. Notify Landlord
    try {
      await Notifier.send({
        userId: property.listed_by_user_id,
        type: 'inquiry',
        title: 'New Interest',
        message: `${user.full_name || 'A seeker'} is interested in your listing "${property.title}"`,
        link: `/dashboard/listings/interests?propertyId=${propertyId}`,
        data: { propertyId },
        channels: ['in-app', 'email', 'push']
      });
    } catch (nError) {
      console.error('[Show Interest Notification Error]:', nError);
    }

    logFeatureEvent({
      userId: user.id,
      featureName: 'matching',
      action: 'show_property_interest',
      metadata: buildMatchAnalyticsMetadata({
        matchScore: scoreRow?.score ?? null,
        threshold: isPrivateListing ? 70 : 51,
        surface: 'property_card',
        entityType: 'property',
        extra: {
          property_id: propertyId,
          listing_visibility: isPrivateListing ? 'private' : 'public',
          resulting_status: initialStatus,
        },
      }),
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      status: initialStatus,
      interest,
      message: initialStatus === 'pending'
        ? 'Interest submitted! The landlord will review your profile.'
        : 'Interest shown! You can now message the landlord.',
    });

  } catch (error) {
    console.error('[Show Interest POST] Error:', error);
    return NextResponse.json({ error: 'Failed to submit interest' }, { status: 500 });
  }
}
