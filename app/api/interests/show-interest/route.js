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

    // Seekers cannot show interest in their own listings
    if (property.listed_by_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot show interest in your own listing' }, { status: 400 });
    }

    if (!property.is_active) {
      return NextResponse.json({ error: 'This listing is no longer active' }, { status: 400 });
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

    // 3. Product rule:
    //    - Missing lifestyle → browse-only (must complete profile before interest/contact)
    //    - No score but lifestyle exists → allow pending interest so public listings remain reachable
    //    - PRIVATE listings → pending (host review)
    //    - PUBLIC listings:
    //        score <= 50 → pending (host review required to unlock chat)
    //        score >= 51 → accepted (direct contact allowed anyway; accepted for audit/history)
    if (!lifestyleRow) {
      return NextResponse.json(
        { error: 'Complete your lifestyle in Profile to show interest.' },
        { status: 400 }
      );
    }

    const isPrivateListing = property.privacy_setting === 'private' || property.is_public === false;
    const initialStatus = (scoreRow?.score == null || isPrivateListing)
      ? 'pending'
      : (scoreRow.score <= 50 ? 'pending' : 'accepted');

    // 4. Upsert the interest record (prevent duplicates via unique index)
    const { data: interest, error: insertError } = await supabase
      .from('property_interests')
      .upsert(
        {
          seeker_id: user.id,
          property_id: propertyId,
          status: initialStatus,
          compatibility_score: scoreRow?.score ?? null,
          message: message || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'seeker_id,property_id',
          ignoreDuplicates: true, // Don't re-open rejected/accepted interests
        }
      )
      .select()
      .single();

    if (insertError) {
      // Unique constraint violation = already showed interest
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          message: 'You have already shown interest in this listing.',
        });
      }
      throw insertError;
    }

    // 5. Bump relevant cache versions (no Redis KEYS scans)
    await bumpCacheVersion(`v:interests:seeker:${user.id}`);
    await bumpCacheVersion(`v:interests:landlord:${property.listed_by_user_id}`);
    await bumpCacheVersion(`v:properties:user:${user.id}`); // interest affects blur/unlock state

    // 6. Notify Landlord
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
