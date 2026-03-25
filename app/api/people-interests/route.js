import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { bumpCacheVersion } from '@/core/utils/redis';
import { Notifier } from '@/core/services/notifications/notifier';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';
import { buildMatchAnalyticsMetadata } from '@/core/services/matching/presentation/match-analytics';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      targetUserId,
      contextPropertyId,
      interestKind = 'host_to_seeker',
      compatibilityScore = null,
      message = null,
    } = body || {};

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'You cannot show interest in your own profile' }, { status: 400 });
    }

    if (!['host_to_seeker', 'seeker_to_host', 'buddy'].includes(interestKind)) {
      return NextResponse.json({ error: 'Invalid interestKind' }, { status: 400 });
    }

    if (interestKind === 'host_to_seeker' && !contextPropertyId) {
      return NextResponse.json({ error: 'contextPropertyId is required for host-to-seeker interest' }, { status: 400 });
    }

    let property = null;
    if (contextPropertyId) {
      const { data: propertyRow, error: propertyError } = await supabase
        .from('properties')
        .select('id, title, listed_by_user_id, is_active, approval_status')
        .eq('id', contextPropertyId)
        .maybeSingle();

      if (propertyError) throw propertyError;
      if (!propertyRow) {
        return NextResponse.json({ error: 'Context property not found' }, { status: 404 });
      }

      property = propertyRow;
      if (interestKind === 'host_to_seeker') {
        if (property.listed_by_user_id !== user.id) {
          return NextResponse.json({ error: 'You can only use your own approved active listing here' }, { status: 403 });
        }

        if (!property.is_active || property.approval_status !== 'approved') {
          return NextResponse.json({ error: 'Only approved active listings can be used for people interests' }, { status: 400 });
        }
      }
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const existingQuery = supabase
      .from('people_interests')
      .select('id, status, reveal_state, created_at, updated_at')
      .eq('interest_kind', interestKind)
      .eq('initiator_user_id', user.id)
      .eq('target_user_id', targetUserId);

    const { data: existingInterest, error: existingError } = contextPropertyId
      ? await existingQuery.eq('context_property_id', contextPropertyId).maybeSingle()
      : await existingQuery.is('context_property_id', null).maybeSingle();

    if (existingError) throw existingError;

    if (existingInterest) {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        interest: existingInterest,
        message: existingInterest.status === 'accepted'
          ? 'Interest already accepted. You can contact this match.'
          : 'You have already shown interest in this person.',
      });
    }

    const { data: interest, error: insertError } = await supabase
      .from('people_interests')
      .insert({
        interest_kind: interestKind,
        initiator_user_id: user.id,
        target_user_id: targetUserId,
        context_property_id: contextPropertyId || null,
        compatibility_score: Number.isFinite(Number(compatibilityScore))
          ? Math.max(0, Math.min(100, Number(compatibilityScore)))
          : null,
        message: message || null,
        source_surface: 'find_people',
        reveal_state: 'blurred',
      })
      .select('id, status, reveal_state, created_at, updated_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          message: 'You have already shown interest in this person.',
        });
      }
      throw insertError;
    }

    await Promise.all([
      bumpCacheVersion(`v:interests:user:${user.id}`),
      bumpCacheVersion(`v:interests:user:${targetUserId}`),
      bumpCacheVersion(`v:find_people:host:${user.id}`),
      bumpCacheVersion(`v:find_people:seeker:${targetUserId}`),
    ]);

    try {
      const propertyLabel = property?.title ? ` about "${property.title}"` : '';
      await Notifier.send({
        userId: targetUserId,
        type: 'inquiry',
        title: 'New Profile Interest',
        message: `${user.full_name || 'Someone'} showed interest in your profile${propertyLabel}.`,
        link: '/interests',
        data: {
          interestType: 'person',
          interestId: interest.id,
          initiatorUserId: user.id,
          targetUserId,
          contextPropertyId: contextPropertyId || null,
          interestKind,
        },
        channels: ['in-app', 'email'],
      });
    } catch (notificationError) {
      console.error('[People Interests POST] Notification error:', notificationError);
    }

    logFeatureEvent({
      userId: user.id,
      featureName: 'matching',
      action: 'show_people_interest',
      metadata: buildMatchAnalyticsMetadata({
        matchScore: compatibilityScore,
        threshold: 70,
        surface: 'find_people',
        entityType: 'person',
        userId: user.id,
        blurred: true,
        revealState: 'blurred',
        privacyState: 'private',
        extra: {
          target_user_id: targetUserId,
          property_id: contextPropertyId || null,
          interest_kind: interestKind,
        },
      }),
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      interest,
      message: 'Interest sent. They will see it in their interests dashboard.',
    });
  } catch (error) {
    console.error('[People Interests POST] Error:', error);
    return NextResponse.json({ error: 'Failed to submit person interest' }, { status: 500 });
  }
}
