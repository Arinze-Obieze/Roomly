import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch, getCachedInt } from '@/core/utils/redis';
import { getPeopleDiscoveryState } from '@/core/services/matching/presentation/people-discovery-state';
import { getMatchConfidenceState } from '@/core/services/matching/presentation/match-confidence';
import { buildPeopleMatchReasons } from '@/core/services/matching/presentation/match-explanations';
import { comparePeopleDiscoveryRanking } from '@/core/services/matching/ranking/shared-order';
import { computeReciprocalAcceptanceSignal } from '@/core/services/matching/scoring/reciprocal-signal';
import { getSeekerFindLandlordsShortlistPage } from '@/core/services/matching/precompute/find-people-shortlist';
import { propertyMatchConfidence } from '@/lib/matching/propertyMatchScore';

const MAX_LIMIT = 60;
const DEFAULT_PAGE = 1;

function toProfileCompletionState(featureRow) {
  return featureRow?.profile_completion_state || 'missing';
}

function isMissingPeopleInterestsRelation(error) {
  const code = error?.code || '';
  const message = String(error?.message || '').toLowerCase();
  return code === '42P01' || message.includes('people_interests');
}

const generateCacheKey = ({ userId, minMatch, limit, page, globalDiscoveryVersion, discoveryVersion, interestsVersion }) => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ userId, minMatch, limit, page, globalDiscoveryVersion, discoveryVersion, interestsVersion }))
    .digest('hex');
  return `seeker:find_landlords:${hash}`;
};

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minMatch = Math.min(100, Math.max(0, Number(searchParams.get('minMatch') || 70)));
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit') || 24)));
    const page = Math.max(DEFAULT_PAGE, Number(searchParams.get('page') || DEFAULT_PAGE));
    const [globalDiscoveryVersion, discoveryVersion, interestsVersion] = await Promise.all([
      getCachedInt('v:find_people:global'),
      getCachedInt(`v:find_people:seeker:${user.id}`),
      getCachedInt(`v:interests:user:${user.id}`),
    ]);

    const cacheKey = generateCacheKey({
      userId: user.id,
      minMatch,
      limit,
      page,
      globalDiscoveryVersion,
      discoveryVersion,
      interestsVersion,
    });
    const data = await cachedFetch(cacheKey, 300, async () => {
      return fetchMatchedLandlords({ seekerId: user.id, minMatch, limit, page });
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Seeker Find Landlords GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matched landlords' }, { status: 500 });
  }
}

async function fetchMatchedLandlords({ seekerId, minMatch, limit, page }) {
  const adminSupabase = createAdminClient();
  const [{ data: seekerLifestyle }, { data: seekerPrefs }, { data: seekerMeta }] = await Promise.all([
    adminSupabase.from('user_lifestyles').select('*').eq('user_id', seekerId).maybeSingle(),
    adminSupabase.from('match_preferences').select('*').eq('user_id', seekerId).maybeSingle(),
    adminSupabase.from('users').select('id, gender, date_of_birth').eq('id', seekerId).maybeSingle(),
  ]);

  const precomputed = await fetchPrecomputedMatchedLandlords({
    adminSupabase,
    seekerId,
    seekerLifestyle,
    seekerPrefs,
    seekerMeta,
    minMatch,
    limit,
    page,
  });
  if (precomputed) return precomputed;

  // 1) Get seeker's compatibility scores for ALL properties
  const { data: scoreRows, error: scoreError } = await adminSupabase
    .from('compatibility_scores')
    .select('property_id, score')
    .eq('seeker_id', seekerId)
    .gte('score', minMatch)
    .order('score', { ascending: false })
    .limit(500);

  if (scoreError) throw scoreError;

  if (!scoreRows || scoreRows.length === 0) {
    return {
      canUseFeature: true,
      minMatch,
      data: [],
      pagination: buildPagination({ page, limit, total: 0 }),
    };
  }

  const propertyIds = scoreRows.map(row => row.property_id);
  const scoreByPropertyId = new Map(scoreRows.map(row => [row.property_id, row.score]));

  // 2) Get property details and who listed them
  const { data: properties, error: propertiesError } = await adminSupabase
    .from('properties')
    .select('id, title, listed_by_user_id, offering_type, is_active, approval_status')
    .in('id', propertyIds)
    .eq('is_active', true)
    .eq('approval_status', 'approved');

  if (propertiesError) throw propertiesError;

  const approvedPropertyIds = (properties || []).map((property) => property.id).filter(Boolean);
  const { data: acceptedInterestRows, error: acceptedInterestsError } = approvedPropertyIds.length > 0
    ? await adminSupabase
      .from('property_interests')
      .select('property_id')
      .eq('seeker_id', seekerId)
      .eq('status', 'accepted')
      .in('property_id', approvedPropertyIds)
    : { data: [], error: null };

  if (acceptedInterestsError) throw acceptedInterestsError;

  const acceptedPropertyIds = new Set((acceptedInterestRows || []).map((row) => row.property_id).filter(Boolean));

  // Group properties by landlord to find the "best" one per landlord
  const landlordsMap = new Map();
  for (const property of properties) {
    const score = scoreByPropertyId.get(property.id);
    const existing = landlordsMap.get(property.listed_by_user_id);
    if (!existing || score > existing.score) {
      landlordsMap.set(property.listed_by_user_id, {
        property_id: property.id,
        property_title: property.title,
        property_offering_type: property.offering_type || null,
        score,
        isMutualInterest: acceptedPropertyIds.has(property.id),
      });
    }
  }

  const landlordIds = Array.from(landlordsMap.keys());
  if (landlordIds.length === 0) {
    return {
      canUseFeature: true,
      minMatch,
      data: [],
      pagination: buildPagination({ page, limit, total: 0 }),
    };
  }

  let acceptedPeopleInterestRows = [];
  if (landlordIds.length > 0) {
    const { data, error: acceptedPeopleInterestError } = await adminSupabase
      .from('people_interests')
      .select('initiator_user_id, target_user_id, context_property_id')
      .eq('status', 'accepted')
      .or(
        [
          `and(initiator_user_id.eq.${seekerId},target_user_id.in.(${landlordIds.join(',')}))`,
          `and(target_user_id.eq.${seekerId},initiator_user_id.in.(${landlordIds.join(',')}))`,
        ].join(',')
      )
      .limit(1000);

    if (acceptedPeopleInterestError && !isMissingPeopleInterestsRelation(acceptedPeopleInterestError)) {
      throw acceptedPeopleInterestError;
    }

    acceptedPeopleInterestRows = data || [];
  }

  const acceptedPeopleRevealKeys = new Set(
    acceptedPeopleInterestRows.flatMap((row) => {
      const initiatorId = row?.initiator_user_id;
      const targetId = row?.target_user_id;
      if (!initiatorId || !targetId) return [];
      return [
        `${initiatorId}:${targetId}`,
        `${targetId}:${initiatorId}`,
      ];
    })
  );

  // 3) Get landlord profiles
  const { data: hosts, error: hostsError } = await adminSupabase
    .from('users')
    .select('id, full_name, profile_picture, bio, is_verified, privacy_setting, profile_visibility, gender, date_of_birth')
    .in('id', landlordIds);

  if (hostsError) throw hostsError;

  // 4) Get host lifestyles for interests/city
  const { data: lifestyles, error: lifestylesError } = await adminSupabase
    .from('user_lifestyles')
    .select('user_id, current_city, interests, cleanliness_level, overnight_guests, occupation, smoking_status, pets')
    .in('user_id', landlordIds);

  if (lifestylesError) throw lifestylesError;

  const { data: featureRows, error: featureError } = await adminSupabase
    .from('matching_user_features')
    .select('user_id, profile_completion_state, has_preferences')
    .in('user_id', landlordIds);

  if (featureError) throw featureError;

  const lifestyleByUserId = new Map((lifestyles || []).map((l) => [l.user_id, l]));
  const featureByUserId = new Map((featureRows || []).map((row) => [row.user_id, row]));

  const data = hosts.map(host => {
    const matchInfo = landlordsMap.get(host.id);
    const lifestyle = lifestyleByUserId.get(host.id);
    const featureRow = featureByUserId.get(host.id) || null;
    const hasAcceptedPeopleReveal = acceptedPeopleRevealKeys.has(`${seekerId}:${host.id}`);
    const discoveryState = getPeopleDiscoveryState({
      subject: host,
      matchScore: matchInfo?.score ?? null,
      minMatch,
      hasMutualReveal: !!matchInfo?.isMutualInterest || hasAcceptedPeopleReveal,
    });

    if (!discoveryState.isVisible) return null;

    const isBlurry = discoveryState.shouldBlurProfile;
    
    let displayName = host.full_name || 'Host';
    let bio = host.bio || null;

    if (isBlurry) {
      const nameParts = displayName.split(' ');
      displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
      bio = null;
    }

    const matchConfidence = propertyMatchConfidence(
      {
        offering_type: matchInfo.property_offering_type,
      },
      seekerLifestyle || null,
      seekerPrefs || null,
      seekerMeta || {},
      lifestyle || null,
      host || {}
    );
    const confidenceState = getMatchConfidenceState(matchConfidence);
    const reciprocalSignal = computeReciprocalAcceptanceSignal({
      hasAcceptedPropertyInterest: !!matchInfo?.isMutualInterest,
      hasAcceptedPeopleInterest: hasAcceptedPeopleReveal,
    });
    const roundedMatchScore = Math.round(matchInfo.score);

    return {
      user_id: host.id,
      full_name: displayName,
      profile_picture: host.profile_picture || null,
      bio,
      isBlurry,
      is_verified: !!host.is_verified,
      current_city: lifestyle?.current_city || null,
      interests: Array.isArray(lifestyle?.interests) ? lifestyle.interests.slice(0, 6) : [],
      profile_completion_state: toProfileCompletionState(featureRow),
      match_score: roundedMatchScore,
      compatibility_score: roundedMatchScore,
      matched_property: {
        id: matchInfo.property_id,
        title: matchInfo.property_title,
        offering_type: matchInfo.property_offering_type,
      },
      role: 'host',
      is_private_profile: discoveryState.isPrivateProfile,
      can_contact_directly: discoveryState.isRevealed,
      reveal_source: hasAcceptedPeopleReveal ? 'people_interest' : (matchInfo?.isMutualInterest ? 'property_interest' : null),
      reciprocal_signal: reciprocalSignal,
      match_confidence: matchConfidence,
      confidence_score: matchConfidence,
      match_confidence_state: confidenceState.state,
      match_confidence_label: confidenceState.label,
      match_reasons: buildPeopleMatchReasons({
        actorLifestyle: seekerLifestyle || null,
        counterpartLifestyle: lifestyle || null,
        property: {
          title: matchInfo.property_title,
        },
      }),
      cta_state: discoveryState.ctaState,
      cta_label: discoveryState.ctaLabel,
    };
  })
  .filter(Boolean)
  .sort((a, b) => comparePeopleDiscoveryRanking(a, b));

  const currentPage = data.length > 0
    ? Math.min(page, Math.ceil(data.length / limit))
    : DEFAULT_PAGE;
  const offset = (currentPage - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);

  return {
    canUseFeature: true,
    minMatch,
    data: paginatedData,
    pagination: buildPagination({ page: currentPage, limit, total: data.length }),
  };
}

async function fetchPrecomputedMatchedLandlords({
  adminSupabase,
  seekerId,
  seekerLifestyle,
  seekerPrefs,
  seekerMeta,
  minMatch,
  limit,
  page,
}) {
  const shortlist = await getSeekerFindLandlordsShortlistPage(seekerId, page, limit);
  if (!shortlist.entries.length) return null;

  const propertyIds = [...new Set(shortlist.entries.map((entry) => entry.propertyId).filter(Boolean))];
  const landlordIds = [...new Set(shortlist.entries.map((entry) => entry.primaryId).filter(Boolean))];
  if (!propertyIds.length || !landlordIds.length) return null;

  const [propertiesRes, hostsRes, lifestylesRes, featuresRes, acceptedPeopleRes] = await Promise.all([
    adminSupabase
      .from('properties')
      .select('id, title, listed_by_user_id, offering_type, is_active, approval_status')
      .in('id', propertyIds)
      .eq('is_active', true)
      .eq('approval_status', 'approved'),
    adminSupabase
      .from('users')
      .select('id, full_name, profile_picture, bio, is_verified, privacy_setting, profile_visibility, gender, date_of_birth')
      .in('id', landlordIds),
    adminSupabase
      .from('user_lifestyles')
      .select('user_id, current_city, interests, cleanliness_level, overnight_guests, occupation, smoking_status, pets')
      .in('user_id', landlordIds),
    adminSupabase
      .from('matching_user_features')
      .select('user_id, profile_completion_state, has_preferences')
      .in('user_id', landlordIds),
    adminSupabase
      .from('people_interests')
      .select('initiator_user_id, target_user_id, context_property_id')
      .eq('status', 'accepted')
      .or(
        [
          `and(initiator_user_id.eq.${seekerId},target_user_id.in.(${landlordIds.join(',')}))`,
          `and(target_user_id.eq.${seekerId},initiator_user_id.in.(${landlordIds.join(',')}))`,
        ].join(',')
      )
      .limit(1000),
  ]);

  if (propertiesRes.error) throw propertiesRes.error;
  if (hostsRes.error) throw hostsRes.error;
  if (lifestylesRes.error) throw lifestylesRes.error;
  if (featuresRes.error) throw featuresRes.error;
  if (acceptedPeopleRes.error && !isMissingPeopleInterestsRelation(acceptedPeopleRes.error)) {
    throw acceptedPeopleRes.error;
  }

  const propertyById = new Map((propertiesRes.data || []).map((property) => [property.id, property]));
  const hostById = new Map((hostsRes.data || []).map((host) => [host.id, host]));
  const lifestyleByUserId = new Map((lifestylesRes.data || []).map((row) => [row.user_id, row]));
  const featureByUserId = new Map((featuresRes.data || []).map((row) => [row.user_id, row]));
  const acceptedPeopleRevealKeys = new Set(
    (acceptedPeopleRes.data || []).flatMap((row) => {
      const initiatorId = row?.initiator_user_id;
      const targetId = row?.target_user_id;
      if (!initiatorId || !targetId) return [];
      return [`${initiatorId}:${targetId}`, `${targetId}:${initiatorId}`];
    })
  );

  const data = shortlist.entries
    .map((entry) => {
      const host = hostById.get(entry.primaryId);
      const property = propertyById.get(entry.propertyId);
      const featureRow = featureByUserId.get(entry.primaryId) || null;
      if (!host || !property || property.listed_by_user_id !== entry.primaryId) return null;

      const lifestyle = lifestyleByUserId.get(host.id);
      const hasAcceptedPeopleReveal = acceptedPeopleRevealKeys.has(`${seekerId}:${host.id}`);
      const discoveryState = getPeopleDiscoveryState({
        subject: host,
        matchScore: entry.score,
        minMatch,
        hasMutualReveal: entry.accepted || hasAcceptedPeopleReveal,
      });

      if (!discoveryState.isVisible) return null;
      if (entry.score < minMatch && !entry.accepted) return null;

      let displayName = host.full_name || 'Host';
      let bio = host.bio || null;
      if (discoveryState.shouldBlurProfile) {
        const nameParts = displayName.split(' ');
        displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
        bio = null;
      }

      const matchConfidence = propertyMatchConfidence(
        { offering_type: property.offering_type },
        seekerLifestyle || null,
        seekerPrefs || null,
        seekerMeta || {},
        lifestyle || null,
        host || {}
      );
      const confidenceState = getMatchConfidenceState(matchConfidence);
      const reciprocalSignal = computeReciprocalAcceptanceSignal({
        hasAcceptedPropertyInterest: entry.accepted,
        hasAcceptedPeopleInterest: hasAcceptedPeopleReveal,
      });
      const roundedMatchScore = Math.round(entry.score);

      return {
        user_id: host.id,
        full_name: displayName,
        profile_picture: host.profile_picture || null,
        bio,
        isBlurry: discoveryState.shouldBlurProfile,
        is_verified: !!host.is_verified,
        current_city: lifestyle?.current_city || null,
        interests: Array.isArray(lifestyle?.interests) ? lifestyle.interests.slice(0, 6) : [],
        profile_completion_state: toProfileCompletionState(featureRow),
        match_score: roundedMatchScore,
        compatibility_score: roundedMatchScore,
        matched_property: {
          id: property.id,
          title: property.title,
          offering_type: property.offering_type || null,
        },
        role: 'host',
        is_private_profile: discoveryState.isPrivateProfile,
        can_contact_directly: discoveryState.isRevealed,
        reveal_source: hasAcceptedPeopleReveal ? 'people_interest' : (entry.accepted ? 'property_interest' : null),
        reciprocal_signal: reciprocalSignal,
        match_confidence: matchConfidence,
        confidence_score: matchConfidence,
        match_confidence_state: confidenceState.state,
        match_confidence_label: confidenceState.label,
        match_reasons: buildPeopleMatchReasons({
          actorLifestyle: seekerLifestyle || null,
          counterpartLifestyle: lifestyle || null,
          property: { title: property.title },
        }),
        cta_state: discoveryState.ctaState,
        cta_label: discoveryState.ctaLabel,
      };
    })
    .filter(Boolean)
    .sort((a, b) => comparePeopleDiscoveryRanking(a, b));

  return {
    canUseFeature: true,
    minMatch,
    data,
    pagination: buildPagination({ page, limit, total: shortlist.total || data.length }),
  };
}

function buildPagination({ page, limit, total }) {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  return {
    page,
    pageSize: limit,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}
