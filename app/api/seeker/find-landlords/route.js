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
import { fetchAllPages, fetchBatchesByIds } from '@/core/services/matching/discovery/query-utils';
import { getSeekerFindLandlordsShortlistWindow } from '@/core/services/matching/precompute/find-people-shortlist';
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
  const scoreRows = await fetchAllPages((offset, pageSize) =>
    adminSupabase
      .from('compatibility_scores')
      .select('property_id, score')
      .eq('seeker_id', seekerId)
      .gte('score', minMatch)
      .order('score', { ascending: false })
      .range(offset, offset + pageSize - 1)
  );

  if (!scoreRows || scoreRows.length === 0) {
    const acceptedOnly = await fetchAcceptedLandlordRows({ adminSupabase, seekerId });
    if (!acceptedOnly.length) {
      return {
        canUseFeature: true,
        minMatch,
        data: [],
        pagination: buildPagination({ page, limit, total: 0 }),
      };
    }
  }

  const propertyIds = scoreRows.map(row => row.property_id);
  const scoreByPropertyId = new Map(scoreRows.map(row => [row.property_id, row.score]));

  // 2) Get property details and who listed them
  const acceptedInterestRows = await fetchAcceptedLandlordRows({ adminSupabase, seekerId });
  const acceptedPropertyIds = new Set((acceptedInterestRows || []).map((row) => row.property_id).filter(Boolean));
  const acceptedPropertyRows = acceptedInterestRows
    .map((row) => Array.isArray(row?.property) ? row.property[0] : row?.property)
    .filter((property) => property?.id && property?.approval_status === 'approved' && property?.is_active);
  const allPropertyIds = [...new Set([
    ...propertyIds,
    ...acceptedPropertyRows.map((property) => property.id),
  ])];

  const properties = await fetchBatchesByIds(
    allPropertyIds,
    (batch) =>
      adminSupabase
        .from('properties')
        .select('id, title, listed_by_user_id, offering_type, is_active, approval_status')
        .in('id', batch)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
  );

  // Group properties by landlord to find the "best" one per landlord
  const landlordsMap = new Map();
  for (const property of properties) {
    const score = scoreByPropertyId.get(property.id);
    const existing = landlordsMap.get(property.listed_by_user_id);
    if (!existing || Number(score) > Number(existing.score)) {
      landlordsMap.set(property.listed_by_user_id, {
        property_id: property.id,
        property_title: property.title,
        property_offering_type: property.offering_type || null,
        score: Number.isFinite(Number(score)) ? Number(score) : 0,
        isMutualInterest: acceptedPropertyIds.has(property.id),
      });
    }
  }

  for (const property of acceptedPropertyRows) {
    const existing = landlordsMap.get(property.listed_by_user_id);
    if (!existing) {
      landlordsMap.set(property.listed_by_user_id, {
        property_id: property.id,
        property_title: property.title,
        property_offering_type: property.offering_type || null,
        score: 0,
        isMutualInterest: true,
      });
    } else {
      existing.isMutualInterest = true;
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
    const [initiatedRows, receivedRows] = await Promise.all([
      fetchAllPages((offset, pageSize) =>
        adminSupabase
          .from('people_interests')
          .select('initiator_user_id, target_user_id, context_property_id')
          .eq('status', 'accepted')
          .eq('initiator_user_id', seekerId)
          .range(offset, offset + pageSize - 1)
      ).catch((error) => {
        if (isMissingPeopleInterestsRelation(error)) return [];
        throw error;
      }),
      fetchAllPages((offset, pageSize) =>
        adminSupabase
          .from('people_interests')
          .select('initiator_user_id, target_user_id, context_property_id')
          .eq('status', 'accepted')
          .eq('target_user_id', seekerId)
          .range(offset, offset + pageSize - 1)
      ).catch((error) => {
        if (isMissingPeopleInterestsRelation(error)) return [];
        throw error;
      }),
    ]);

    const landlordIdSet = new Set(landlordIds);
    acceptedPeopleInterestRows = [...initiatedRows, ...receivedRows]
      .filter((row) => landlordIdSet.has(row?.initiator_user_id) || landlordIdSet.has(row?.target_user_id));
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
  const hosts = await fetchBatchesByIds(
    landlordIds,
    (batch) =>
      adminSupabase
        .from('users')
        .select('id, full_name, profile_picture, bio, is_verified, privacy_setting, profile_visibility, gender, date_of_birth')
        .in('id', batch)
  );

  // 4) Get host lifestyles for interests/city
  const lifestyles = await fetchBatchesByIds(
    landlordIds,
    (batch) =>
      adminSupabase
        .from('user_lifestyles')
        .select('user_id, current_city, interests, cleanliness_level, overnight_guests, occupation, smoking_status, pets')
        .in('user_id', batch)
  );

  const featureRows = await fetchBatchesByIds(
    landlordIds,
    (batch) =>
      adminSupabase
        .from('matching_user_features')
        .select('user_id, profile_completion_state, has_preferences')
        .in('user_id', batch)
  );

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
  const shortlistEntries = [];
  const shortlistBatchSize = Math.max(limit * 3, 24);
  let shortlistOffset = 0;

  while (true) {
    const shortlistWindow = await getSeekerFindLandlordsShortlistWindow(seekerId, shortlistOffset, shortlistBatchSize);
    if (!shortlistWindow.entries.length) break;
    shortlistEntries.push(...shortlistWindow.entries);
    shortlistOffset += shortlistWindow.entries.length;
    if (shortlistWindow.entries.length < shortlistBatchSize) break;
  }

  if (!shortlistEntries.length) return null;

  const propertyIds = [...new Set(shortlistEntries.map((entry) => entry.propertyId).filter(Boolean))];
  const landlordIds = [...new Set(shortlistEntries.map((entry) => entry.primaryId).filter(Boolean))];
  if (!propertyIds.length || !landlordIds.length) return null;

  let acceptedPeopleRows = [];
  let acceptedInterestRows = [];
  if (landlordIds.length > 0) {
    const [acceptedPropertyRows, initiatedRows, receivedRows] = await Promise.all([
      fetchAcceptedLandlordRows({ adminSupabase, seekerId }),
      fetchAllPages((offset, pageSize) =>
        adminSupabase
          .from('people_interests')
          .select('initiator_user_id, target_user_id, context_property_id')
          .eq('status', 'accepted')
          .eq('initiator_user_id', seekerId)
          .range(offset, offset + pageSize - 1)
      ).catch((error) => {
        if (isMissingPeopleInterestsRelation(error)) return [];
        throw error;
      }),
      fetchAllPages((offset, pageSize) =>
        adminSupabase
          .from('people_interests')
          .select('initiator_user_id, target_user_id, context_property_id')
          .eq('status', 'accepted')
          .eq('target_user_id', seekerId)
          .range(offset, offset + pageSize - 1)
      ).catch((error) => {
        if (isMissingPeopleInterestsRelation(error)) return [];
        throw error;
      }),
    ]);

    const landlordIdSet = new Set(landlordIds);
    acceptedInterestRows = acceptedPropertyRows
      .map((row) => Array.isArray(row?.property) ? row.property[0] : row?.property)
      .filter((property) => property?.id && property?.approval_status === 'approved' && property?.is_active && landlordIdSet.has(property?.listed_by_user_id));
    acceptedPeopleRows = [...initiatedRows, ...receivedRows]
      .filter((row) => landlordIdSet.has(row?.initiator_user_id) || landlordIdSet.has(row?.target_user_id));
  }

  const [properties, hosts, lifestyles, featureRows] = await Promise.all([
    fetchBatchesByIds(
      propertyIds,
      (batch) =>
        adminSupabase
          .from('properties')
          .select('id, title, listed_by_user_id, offering_type, is_active, approval_status')
          .in('id', batch)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
    ),
    fetchBatchesByIds(
      landlordIds,
      (batch) =>
        adminSupabase
          .from('users')
          .select('id, full_name, profile_picture, bio, is_verified, privacy_setting, profile_visibility, gender, date_of_birth')
          .in('id', batch)
    ),
    fetchBatchesByIds(
      landlordIds,
      (batch) =>
        adminSupabase
          .from('user_lifestyles')
          .select('user_id, current_city, interests, cleanliness_level, overnight_guests, occupation, smoking_status, pets')
          .in('user_id', batch)
    ),
    fetchBatchesByIds(
      landlordIds,
      (batch) =>
        adminSupabase
          .from('matching_user_features')
          .select('user_id, profile_completion_state, has_preferences')
          .in('user_id', batch)
    ),
  ]);

  const propertyById = new Map((properties || []).map((property) => [property.id, property]));
  const hostById = new Map((hosts || []).map((host) => [host.id, host]));
  const lifestyleByUserId = new Map((lifestyles || []).map((row) => [row.user_id, row]));
  const featureByUserId = new Map((featureRows || []).map((row) => [row.user_id, row]));
  const acceptedLandlordIds = new Set(
    (acceptedInterestRows || []).map((property) => property?.listed_by_user_id).filter(Boolean)
  );
  const acceptedPeopleRevealKeys = new Set(
    acceptedPeopleRows.flatMap((row) => {
      const initiatorId = row?.initiator_user_id;
      const targetId = row?.target_user_id;
      if (!initiatorId || !targetId) return [];
      return [`${initiatorId}:${targetId}`, `${targetId}:${initiatorId}`];
    })
  );

  const data = shortlistEntries
    .map((entry) => {
      const host = hostById.get(entry.primaryId);
      const property = propertyById.get(entry.propertyId);
      const featureRow = featureByUserId.get(entry.primaryId) || null;
      if (!host || !property || property.listed_by_user_id !== entry.primaryId) return null;

      const lifestyle = lifestyleByUserId.get(host.id);
      const hasAcceptedPeopleReveal = acceptedPeopleRevealKeys.has(`${seekerId}:${host.id}`);
      const isMutualInterest = entry.accepted || acceptedLandlordIds.has(entry.primaryId);
      const discoveryState = getPeopleDiscoveryState({
        subject: host,
        matchScore: entry.score,
        minMatch,
        hasMutualReveal: isMutualInterest || hasAcceptedPeopleReveal,
      });

      if (!discoveryState.isVisible) return null;
      if (entry.score < minMatch && !isMutualInterest) return null;

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
        hasAcceptedPropertyInterest: isMutualInterest,
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
        reveal_source: hasAcceptedPeopleReveal ? 'people_interest' : (isMutualInterest ? 'property_interest' : null),
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

async function fetchAcceptedLandlordRows({ adminSupabase, seekerId }) {
  return fetchAllPages((offset, pageSize) =>
    adminSupabase
      .from('property_interests')
      .select(`
        property_id,
        property:properties!inner(id, title, listed_by_user_id, offering_type, is_active, approval_status)
      `)
      .eq('seeker_id', seekerId)
      .eq('status', 'accepted')
      .range(offset, offset + pageSize - 1)
  );
}
