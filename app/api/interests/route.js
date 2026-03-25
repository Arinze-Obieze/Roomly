import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { bumpCacheVersion, cachedFetch, getCachedInt } from '@/core/utils/redis';
import { Notifier } from '@/core/services/notifications/notifier';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';
import {
  buildPeopleMatchReasons,
  buildPropertyMatchReasons,
} from '@/core/services/matching/presentation/match-explanations';
import { buildMatchAnalyticsMetadata } from '@/core/services/matching/presentation/match-analytics';
import crypto from 'crypto';

function generateCacheKey({ userId, limit, interestsVersion }) {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ userId, limit, interestsVersion }))
    .digest('hex');
  return `interests:user:${hash}`;
}

function withLifestyleOccupation(counterpart, lifestyle) {
  if (!counterpart) return null;
  return {
    ...counterpart,
    occupation: lifestyle?.occupation || counterpart.occupation || null,
  };
}

function normalizePropertySentInterest(item, { currentLifestyle, currentPrefs, hostLifestyleById }) {
  return {
    ...item,
    interest_category: 'property',
    counterpart: null,
    context_label: 'Property',
    match_reasons: buildPropertyMatchReasons({
      property: item.property || {},
      seekerLifestyle: currentLifestyle || null,
      seekerPrefs: currentPrefs || null,
      hostLifestyle: hostLifestyleById.get(item.property?.listed_by_user_id) || null,
    }),
  };
}

function normalizePropertyReceivedInterest(item, { currentLifestyle, userLifestyleById }) {
  const counterpartLifestyle = userLifestyleById.get(item.seeker?.id) || null;
  return {
    ...item,
    interest_category: 'property',
    counterpart: withLifestyleOccupation(item.seeker, counterpartLifestyle),
    context_label: 'Property',
    match_reasons: buildPeopleMatchReasons({
      actorLifestyle: currentLifestyle || null,
      counterpartLifestyle,
      property: item.property || null,
    }),
  };
}

function normalizePeopleSentInterest(item, { currentLifestyle, userLifestyleById }) {
  const counterpartLifestyle = userLifestyleById.get(item.target?.id) || null;
  return {
    id: item.id,
    status: item.status,
    compatibility_score: item.compatibility_score,
    message: item.message,
    created_at: item.created_at,
    updated_at: item.updated_at,
    interest_category: 'person',
    person_interest_kind: item.interest_kind,
    reveal_state: item.reveal_state,
    counterpart: withLifestyleOccupation(item.target, counterpartLifestyle),
    property: item.context_property || null,
    context_label: item.context_property ? 'Matched listing' : 'Profile',
    match_reasons: buildPeopleMatchReasons({
      actorLifestyle: currentLifestyle || null,
      counterpartLifestyle,
      property: item.context_property || null,
    }),
  };
}

function normalizePeopleReceivedInterest(item, { currentLifestyle, userLifestyleById }) {
  const counterpartLifestyle = userLifestyleById.get(item.initiator?.id) || null;
  return {
    id: item.id,
    status: item.status,
    compatibility_score: item.compatibility_score,
    message: item.message,
    created_at: item.created_at,
    updated_at: item.updated_at,
    interest_category: 'person',
    person_interest_kind: item.interest_kind,
    reveal_state: item.reveal_state,
    counterpart: withLifestyleOccupation(item.initiator, counterpartLifestyle),
    property: item.context_property || null,
    context_label: item.context_property ? 'Matched listing' : 'Profile',
    match_reasons: buildPeopleMatchReasons({
      actorLifestyle: currentLifestyle || null,
      counterpartLifestyle,
      property: item.context_property || null,
    }),
  };
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 200)));
    const interestsVersion = await getCachedInt(`v:interests:user:${user.id}`);
    const cacheKey = generateCacheKey({ userId: user.id, limit, interestsVersion });

    const data = await cachedFetch(cacheKey, 180, async () => {
      // Since PostgREST doesn't support a single query for both perspectives easily with inner joins 
      // without knowing if the user is a host or seeker, we do two parallel queries:
      // 1. Interests sent BY the user (Seeker view)
      // 2. Interests received FOR the user's properties (Host view)

      const [sentRes, receivedRes, peopleSentRes, peopleReceivedRes, currentLifestyleRes, currentPrefsRes] = await Promise.all([
      // Sent Interests
        supabase
        .from('property_interests')
        .select(`
          id,
          status,
          compatibility_score,
          message,
          created_at,
          updated_at,
          property:properties!property_interests_property_id_fkey(
            id,
            title,
            city,
            state,
            price_per_month,
            offering_type,
            listed_by_user_id,
            is_active,
            privacy_setting,
            is_public
          )
        `)
        .eq('seeker_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, limit - 1),

      // Received Interests
      // This query finds properties owned by the user, and nests the incoming interests.
      // Easiest is to select interests where property.listed_by_user_id = user.id
        supabase
        .from('property_interests')
        .select(`
          id,
          status,
          compatibility_score,
          message,
          created_at,
          updated_at,
          property_id,
          seeker:users!property_interests_seeker_id_fkey(
            id,
            full_name,
            profile_picture,
            gender
          ),
          property:properties!inner(
            id,
            title,
            city,
            state,
            price_per_month,
            offering_type,
            listed_by_user_id
          )
        `)
        // In Supabase, you can filter on joined tables:
        .eq('property.listed_by_user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, limit - 1),
        supabase
        .from('people_interests')
        .select(`
          id,
          status,
          compatibility_score,
          message,
          reveal_state,
          interest_kind,
          created_at,
          updated_at,
          target:users!people_interests_target_user_id_fkey(
            id,
            full_name,
            profile_picture,
            gender
          ),
          context_property:properties!people_interests_context_property_id_fkey(
            id,
            title,
            city,
            state,
            price_per_month,
            offering_type,
            listed_by_user_id
          )
        `)
        .eq('initiator_user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, limit - 1),
        supabase
        .from('people_interests')
        .select(`
          id,
          status,
          compatibility_score,
          message,
          reveal_state,
          interest_kind,
          created_at,
          updated_at,
          initiator:users!people_interests_initiator_user_id_fkey(
            id,
            full_name,
            profile_picture,
            gender
          ),
          context_property:properties!people_interests_context_property_id_fkey(
            id,
            title,
            city,
            state,
            price_per_month,
            offering_type,
            listed_by_user_id
          )
        `)
        .eq('target_user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, limit - 1),
        supabase
          .from('user_lifestyles')
          .select('user_id, schedule_type, cleanliness_level, social_level, noise_tolerance, interests, overnight_guests, occupation, current_city')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('match_preferences')
          .select('user_id, budget_min, budget_max, location_areas')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const currentLifestyle = currentLifestyleRes.data || null;
      const currentPrefs = currentPrefsRes.data || null;
      const counterpartUserIds = new Set();
      const hostUserIds = new Set();

      for (const item of receivedRes.data || []) {
        if (item.seeker?.id) counterpartUserIds.add(item.seeker.id);
      }
      for (const item of peopleSentRes.data || []) {
        if (item.target?.id) counterpartUserIds.add(item.target.id);
      }
      for (const item of peopleReceivedRes.data || []) {
        if (item.initiator?.id) counterpartUserIds.add(item.initiator.id);
      }
      for (const item of sentRes.data || []) {
        if (item.property?.listed_by_user_id) hostUserIds.add(item.property.listed_by_user_id);
      }

      const lifestyleIds = Array.from(new Set([
        ...counterpartUserIds,
        ...hostUserIds,
      ]));

      const { data: lifestyleRows } = lifestyleIds.length > 0
        ? await supabase
          .from('user_lifestyles')
          .select('user_id, schedule_type, cleanliness_level, social_level, noise_tolerance, interests, overnight_guests, occupation, current_city')
          .in('user_id', lifestyleIds)
        : { data: [] };

      const userLifestyleById = new Map((lifestyleRows || []).map((row) => [row.user_id, row]));
      const hostLifestyleById = userLifestyleById;
      const explanationContext = {
        currentLifestyle,
        currentPrefs,
        userLifestyleById,
        hostLifestyleById,
      };

      const sent = [
        ...(sentRes.data || []).map((item) => normalizePropertySentInterest(item, explanationContext)),
        ...(peopleSentRes.data || []).map((item) => normalizePeopleSentInterest(item, explanationContext)),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const received = [
        ...(receivedRes.data || []).map((item) => normalizePropertyReceivedInterest(item, explanationContext)),
        ...(peopleReceivedRes.data || []).map((item) => normalizePeopleReceivedInterest(item, explanationContext)),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return {
        sent,
        received,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET Interests] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interestId, status, interestType = 'property' } = await request.json();

    if (!interestId || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (interestType === 'person') {
      const { data: interestData, error: fetchError } = await supabase
        .from('people_interests')
        .select(`
          id,
          initiator_user_id,
          target_user_id,
          context_property_id,
          compatibility_score,
          status,
          interest_kind,
          reveal_state,
          initiator:users!people_interests_initiator_user_id_fkey(
            id,
            full_name
          ),
          context_property:properties!people_interests_context_property_id_fkey(
            id,
            title
          )
        `)
        .eq('id', interestId)
        .single();

      if (fetchError || !interestData) {
        return NextResponse.json({ error: 'Interest not found' }, { status: 404 });
      }

      if (interestData.target_user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized to modify this interest' }, { status: 403 });
      }

      if (interestData.status === status) {
        return NextResponse.json({ success: true, interest: interestData });
      }

      const patch = {
        status,
        acted_at: new Date().toISOString(),
        acted_by_user_id: user.id,
      };

      if (status === 'accepted') {
        patch.reveal_state = 'revealed';
      }

      const { data: updatedInterest, error: updateError } = await supabase
        .from('people_interests')
        .update(patch)
        .eq('id', interestId)
        .select()
        .single();

      if (updateError) throw updateError;

      await Promise.all([
        bumpCacheVersion(`v:interests:user:${interestData.initiator_user_id}`),
        bumpCacheVersion(`v:interests:user:${interestData.target_user_id}`),
        bumpCacheVersion(`v:find_people:host:${interestData.initiator_user_id}`),
        bumpCacheVersion(`v:find_people:seeker:${interestData.target_user_id}`),
      ]);

      try {
        const accepted = status === 'accepted';
        const label = interestData.context_property?.title
          ? ` for "${interestData.context_property.title}"`
          : '';
        await Notifier.send({
          userId: interestData.initiator_user_id,
          type: 'system',
          title: accepted ? 'Profile Interest Accepted' : 'Profile Interest Update',
          message: accepted
            ? `${user.full_name || 'Your match'} accepted your profile interest${label}. You can now reach out.`
            : `${user.full_name || 'Your match'} declined your profile interest${label}.`,
          link: accepted ? '/find-people' : '/interests',
          data: {
            interestType: 'person',
            interestId,
            status,
            targetUserId: interestData.target_user_id,
            propertyId: interestData.context_property_id,
          },
          channels: ['in-app', 'email'],
        });
      } catch (nErr) {
        console.error('[PATCH People Interests] Notify Error:', nErr);
      }

      if (status === 'accepted') {
        logFeatureEvent({
          userId: user.id,
          featureName: 'matching',
          action: 'interest_accepted',
          metadata: buildMatchAnalyticsMetadata({
            matchScore: interestData.compatibility_score ?? null,
            threshold: 70,
            surface: 'find_people',
            entityType: 'person',
            userId: user.id,
            blurred: false,
            revealState: 'revealed',
            privacyState: 'private',
            extra: {
              target_user_id: interestData.initiator_user_id,
              property_id: interestData.context_property_id || null,
              interest_type: 'person',
              interest_kind: interestData.interest_kind || null,
            },
          }),
        }).catch(console.error);
      }

      return NextResponse.json({ success: true, interest: updatedInterest });
    }

    // 1. Verify the user owns the property this interest is for
    const { data: interestData, error: fetchError } = await supabase
      .from('property_interests')
      .select(`
        id,
        seeker_id,
        property_id,
        compatibility_score,
        status,
        property:properties!property_interests_property_id_fkey(
          id,
          title,
          listed_by_user_id
        )
      `)
      .eq('id', interestId)
      .single();

    if (fetchError || !interestData) {
      return NextResponse.json({ error: 'Interest not found' }, { status: 404 });
    }

    if (interestData.property?.listed_by_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this interest' }, { status: 403 });
    }

    if (interestData.status === status) {
      return NextResponse.json({ success: true, interest: interestData });
    }

    // 2. Perform the update
    const { data: updatedInterest, error: updateError } = await supabase
      .from('property_interests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', interestId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 3. Cache bumps
    await Promise.all([
      bumpCacheVersion(`v:interests:seeker:${interestData.seeker_id}`),
      bumpCacheVersion(`v:interests:landlord:${user.id}`),
      bumpCacheVersion(`v:interests:user:${interestData.seeker_id}`),
      bumpCacheVersion(`v:interests:user:${user.id}`),
      bumpCacheVersion(`v:properties:user:${interestData.seeker_id}`),
    ]);

    // 4. Send notification to the seeker
    if (status === 'accepted' || status === 'rejected') {
      try {
        const accepted = status === 'accepted';
        await Notifier.send({
          userId: interestData.seeker_id,
          type: 'system',
          title: accepted ? 'Interest Accepted!' : 'Interest Update',
          message: accepted
            ? `The host accepted your interest for "${interestData.property.title}". You can now chat!`
            : `The host declined your interest for "${interestData.property.title}".`,
          link: accepted
            ? `/messages?user=${user.id}&propertyId=${interestData.property_id}`
            : '/interests',
          data: { propertyId: interestData.property_id, hostId: user.id, status },
          channels: ['in-app', 'email']
        });
      } catch (nErr) {
        console.error('[Interest Patch Notify Error]', nErr);
      }
    }

    if (status === 'accepted') {
      logFeatureEvent({
        userId: user.id,
        featureName: 'matching',
        action: 'interest_accepted',
        metadata: buildMatchAnalyticsMetadata({
          matchScore: interestData.compatibility_score ?? null,
          threshold: 51,
          surface: 'property_interest_review',
          entityType: 'property',
          userId: user.id,
          blurred: false,
          revealState: 'revealed',
          privacyState: null,
          extra: {
            target_user_id: interestData.seeker_id,
            property_id: interestData.property_id,
            interest_type: 'property',
          },
        }),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, interest: updatedInterest });

  } catch (error) {
    console.error('[PATCH Interests] Error:', error);
    return NextResponse.json({ error: 'Failed to update interest status' }, { status: 500 });
  }
}
