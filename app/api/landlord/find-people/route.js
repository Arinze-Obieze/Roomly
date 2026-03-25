import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch, getCachedInt } from '@/core/utils/redis';
import { recomputeForProperty } from '@/core/services/matching/recompute-compatibility.service';
import { getPeopleDiscoveryState } from '@/core/services/matching/presentation/people-discovery-state';
import { getMatchConfidenceState } from '@/core/services/matching/presentation/match-confidence';
import { buildPeopleMatchReasons } from '@/core/services/matching/presentation/match-explanations';
import { comparePeopleDiscoveryRanking } from '@/core/services/matching/ranking/shared-order';
import { computeReciprocalAcceptanceSignal } from '@/core/services/matching/scoring/reciprocal-signal';
import { getHostFindPeopleShortlistPage } from '@/core/services/matching/precompute/find-people-shortlist';
import { propertyMatchConfidence } from '@/lib/matching/propertyMatchScore';

const MAX_LIMIT = 60;
const DEFAULT_PAGE = 1;

function isMissingPeopleInterestsRelation(error) {
  const code = error?.code || '';
  const message = String(error?.message || '').toLowerCase();
  return code === '42P01' || message.includes('people_interests');
}

const buildMatchedProperty = (property) => {
  if (!property?.id) return null;

  return {
    id: property.id,
    title: property.title || 'Listing',
    city: property.city || null,
    state: property.state || null,
    price_per_month: property.price_per_month ?? null,
    offering_type: property.offering_type || null,
    available_from: property.available_from || null,
  };
};

const DEV_DIAGNOSTICS_ENABLED = process.env.NODE_ENV !== 'production';

function toProfileCompletionState(featureRow, fallbackHasPreferences = false) {
  if (featureRow?.profile_completion_state) return featureRow.profile_completion_state;
  return fallbackHasPreferences ? 'partial' : 'missing';
}

const generateCacheKey = ({ userId, minMatch, limit, page, globalDiscoveryVersion, discoveryVersion, interestsVersion }) => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ userId, minMatch, limit, page, globalDiscoveryVersion, discoveryVersion, interestsVersion }))
    .digest('hex');
  return `landlord:find_people:${hash}`;
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
      getCachedInt(`v:find_people:host:${user.id}`),
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
      return fetchMatchedSeekers({ landlordId: user.id, minMatch, limit, page });
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Landlord Find People GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matched seekers' }, { status: 500 });
  }
}

async function fetchMatchedSeekers({ landlordId, minMatch, limit, page }) {
  const adminSupabase = createAdminClient();
  const [{ data: landlordMeta }, { data: landlordLifestyle }] = await Promise.all([
    adminSupabase.from('users').select('id, gender, date_of_birth').eq('id', landlordId).maybeSingle(),
    adminSupabase.from('user_lifestyles').select('*').eq('user_id', landlordId).maybeSingle(),
  ]);
  const approvedListingsQuery = () =>
    adminSupabase
      .from('properties')
      .select('id, title, city, state, price_per_month, offering_type, available_from')
      .eq('listed_by_user_id', landlordId)
      .eq('is_active', true)
      .eq('approval_status', 'approved');

  const scoreRowsQuery = () =>
    adminSupabase
      .from('compatibility_scores')
      .select(`
        seeker_id,
        property_id,
        score,
        property:properties!inner(id, title, city, state, price_per_month, offering_type, available_from, listed_by_user_id, is_active, approval_status)
      `)
      .eq('property.listed_by_user_id', landlordId)
      .eq('property.is_active', true)
      .eq('property.approval_status', 'approved')
      .order('score', { ascending: false })
      .limit(1000);

  const acceptedInterestRowsQuery = () =>
    adminSupabase
      .from('property_interests')
      .select(`
        seeker_id,
        property_id,
        status,
        property:properties!inner(id, title, city, state, price_per_month, offering_type, available_from, listed_by_user_id, approval_status)
      `)
      .eq('property.listed_by_user_id', landlordId)
      .eq('property.approval_status', 'approved')
      .eq('status', 'accepted')
      .limit(500);

  const [
    { count: approvedListingCount, error: approvedListingCountError },
    { count: pendingListingCount, error: pendingListingCountError },
  ] = await Promise.all([
    adminSupabase
      .from('properties')
      .select('id', { count: 'estimated', head: true })
      .eq('listed_by_user_id', landlordId)
      .eq('is_active', true)
      .eq('approval_status', 'approved'),
    adminSupabase
      .from('properties')
      .select('id', { count: 'estimated', head: true })
      .eq('listed_by_user_id', landlordId)
      .eq('approval_status', 'pending'),
  ]);

  if (approvedListingCountError) throw approvedListingCountError;
  if (pendingListingCountError) throw pendingListingCountError;

  let diagnostics = null;
  if (DEV_DIAGNOSTICS_ENABLED) {
    const [
      totalUsersRes,
      lifestyleUsersRes,
      preferenceUsersRes,
    ] = await Promise.all([
      adminSupabase.from('users').select('id', { count: 'estimated', head: true }),
      adminSupabase.from('user_lifestyles').select('user_id', { count: 'estimated', head: true }),
      adminSupabase.from('match_preferences').select('user_id', { count: 'estimated', head: true }),
    ]);

    diagnostics = {
      total_users: totalUsersRes.count || 0,
      users_with_lifestyle: lifestyleUsersRes.count || 0,
      users_with_preferences: preferenceUsersRes.count || 0,
      approved_listings: approvedListingCount || 0,
      pending_listings: pendingListingCount || 0,
      min_match: minMatch,
    };
  }

  if (!approvedListingCount || approvedListingCount === 0) {
    return {
      canUseFeature: false,
      reason: pendingListingCount > 0 ? 'pending_approval' : 'no_approved_listing',
      message: pendingListingCount > 0
        ? 'You will start seeing matched tenants once your property is approved.'
        : 'You need at least one approved active listing to source matched seekers.',
      data: [],
      listingCount: 0,
      approvedListingCount: 0,
      pendingListingCount: pendingListingCount || 0,
      diagnostics,
      pagination: buildPagination({ page, limit, total: 0 }),
    };
  }

  const { data: approvedListings, error: approvedListingsError } = await approvedListingsQuery();
  if (approvedListingsError) throw approvedListingsError;

  const precomputed = await fetchPrecomputedMatchedSeekers({
    adminSupabase,
    landlordId,
    landlordMeta,
    landlordLifestyle,
    minMatch,
    limit,
    page,
    approvedListingCount,
    pendingListingCount: pendingListingCount || 0,
    diagnostics,
  });
  if (precomputed) return precomputed;

  // 1) Compatibility scores for this landlord's approved active listings
  let { data: scoreRows, error: scoreError } = await scoreRowsQuery();

  if (scoreError) throw scoreError;

  // 2) Accepted interests should still be visible even when below threshold
  let { data: acceptedInterestRows, error: acceptedError } = await acceptedInterestRowsQuery();

  if (acceptedError) throw acceptedError;

  // Self-heal old listings that were approved after creation and never recomputed.
  if ((scoreRows?.length || 0) === 0 && (acceptedInterestRows?.length || 0) === 0 && (approvedListings?.length || 0) > 0) {
    await Promise.all(
      approvedListings.map((property) => recomputeForProperty(adminSupabase, property.id))
    );

    ({ data: scoreRows, error: scoreError } = await scoreRowsQuery());
    ({ data: acceptedInterestRows, error: acceptedError } = await acceptedInterestRowsQuery());

    if (scoreError) throw scoreError;
    if (acceptedError) throw acceptedError;
  }

  const acceptedKeys = new Set(
    (acceptedInterestRows || []).map((row) => `${row.seeker_id}:${row.property_id}`)
  );
  const acceptedSeekerIds = new Set(
    (acceptedInterestRows || []).map((row) => row.seeker_id).filter(Boolean)
  );
  const bestBySeeker = new Map();

  for (const row of scoreRows || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    const score = Number(row?.score);
    const property = row?.property || null;
    if (!seekerId || seekerId === landlordId || !propertyId || !Number.isFinite(score) || !property) continue;

    const key = `${seekerId}:${propertyId}`;
    const isMutualInterest = acceptedKeys.has(key);
    const current = bestBySeeker.get(seekerId);
    if (!current || score > current.match_score) {
      bestBySeeker.set(seekerId, {
        property_id: propertyId,
        match_score: score,
        isMutualInterest,
        matched_property: buildMatchedProperty(property),
      });
    }
  }

  // Keep accepted interests in feed even when score cache is missing
  for (const row of acceptedInterestRows || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    if (!seekerId || seekerId === landlordId || !propertyId) continue;
    const current = bestBySeeker.get(seekerId);
    if (!current) {
      bestBySeeker.set(seekerId, {
        property_id: propertyId,
        match_score: 0,
        isMutualInterest: true,
        matched_property: buildMatchedProperty(row?.property) || { id: propertyId, title: 'Listing' },
      });
    }
  }

  const candidateIds = [...bestBySeeker.keys()].filter((candidateId) => candidateId && candidateId !== landlordId);
  if (candidateIds.length === 0) {
    return {
      canUseFeature: true,
      minMatch,
      listingCount: approvedListingCount,
      approvedListingCount,
      pendingListingCount: pendingListingCount || 0,
      topMatchBelowThreshold: null,
      totalCandidatesScored: 0,
      data: [],
      diagnostics: diagnostics
        ? {
            ...diagnostics,
            compatibility_rows_fetched: scoreRows?.length || 0,
            accepted_interest_rows: acceptedInterestRows?.length || 0,
            unique_candidates_before_threshold: 0,
            candidates_loaded_for_display: 0,
            visible_matches: 0,
            hidden_below_threshold: 0,
          }
        : null,
      pagination: buildPagination({ page, limit, total: 0 }),
    };
  }

  let acceptedPeopleInterestRows = [];
  if (candidateIds.length > 0) {
    const { data, error: acceptedPeopleInterestError } = await adminSupabase
      .from('people_interests')
      .select('initiator_user_id, target_user_id, context_property_id')
      .eq('status', 'accepted')
      .or(
        [
          `and(initiator_user_id.eq.${landlordId},target_user_id.in.(${candidateIds.join(',')}))`,
          `and(target_user_id.eq.${landlordId},initiator_user_id.in.(${candidateIds.join(',')}))`,
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

  const { data: seekers, error: seekersError } = await adminSupabase
    .from('user_lifestyles')
    .select(`
      user_id,
      current_city,
      schedule_type,
      cleanliness_level,
      social_level,
      noise_tolerance,
      interests,
      users:user_id (
        id,
        full_name,
        profile_picture,
        bio,
        is_verified,
        privacy_setting,
        profile_visibility,
        gender,
        date_of_birth
      )
    `)
    .in('user_id', candidateIds)
    .neq('user_id', landlordId);

  if (seekersError) throw seekersError;

  const candidateById = new Map((seekers || []).map((candidate) => [candidate.user_id, candidate]));
  const { data: featureRows, error: featureError } = await adminSupabase
    .from('matching_user_features')
    .select('user_id, profile_completion_state, has_preferences')
    .in('user_id', candidateIds);

  if (featureError) throw featureError;

  const featureByUserId = new Map((featureRows || []).map((row) => [row.user_id, row]));

  const scoredCandidates = candidateIds.map((seekerId) => {
    const candidate = candidateById.get(seekerId);
    if (!candidate) return null;

    const best = bestBySeeker.get(seekerId);
    if (!best) return null;

    const isMutualInterest = best.isMutualInterest || acceptedSeekerIds.has(seekerId);
    const hasAcceptedPeopleReveal = acceptedPeopleRevealKeys.has(`${landlordId}:${seekerId}`);
    const featureRow = featureByUserId.get(seekerId) || null;
    if (best.match_score < minMatch && !isMutualInterest) return null;

    const discoveryState = getPeopleDiscoveryState({
      subject: candidate.users,
      matchScore: best.match_score,
      minMatch,
      hasMutualReveal: isMutualInterest || hasAcceptedPeopleReveal,
    });

    if (!discoveryState.isVisible) return null;

    const shouldMask = discoveryState.shouldBlurProfile;

    let displayName = candidate.users?.full_name || 'Seeker';
    let bio = candidate.users?.bio || null;
    let isBlurry = false;

    if (shouldMask) {
      const nameParts = displayName.split(' ');
      displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
      isBlurry = true;
      bio = null;
    }

    const matchConfidence = propertyMatchConfidence(
      best.matched_property || {},
      candidate,
      featureRow?.has_preferences ? { user_id: seekerId } : null,
      candidate.users || {},
      landlordLifestyle || null,
      landlordMeta || {}
    );
    const confidenceState = getMatchConfidenceState(matchConfidence);
    const reciprocalSignal = computeReciprocalAcceptanceSignal({
      hasAcceptedPropertyInterest: isMutualInterest,
      hasAcceptedPeopleInterest: hasAcceptedPeopleReveal,
    });
    const roundedMatchScore = Math.round(best.match_score);

    return {
      user_id: seekerId,
      full_name: displayName,
      profile_picture: candidate.users?.profile_picture || null,
      bio,
      isBlurry,
      is_verified: !!candidate.users?.is_verified,
      current_city: candidate.current_city || null,
      schedule_type: candidate.schedule_type || null,
      interests: Array.isArray(candidate.interests) ? candidate.interests.slice(0, 6) : [],
      has_match_preferences: !!featureRow?.has_preferences,
      profile_completion_state: toProfileCompletionState(featureRow, !!featureRow?.has_preferences),
      match_score: roundedMatchScore,
      compatibility_score: roundedMatchScore,
      matched_property: best.matched_property || null,
      is_private_profile: discoveryState.isPrivateProfile,
      can_contact_directly: discoveryState.isRevealed,
      reveal_source: hasAcceptedPeopleReveal ? 'people_interest' : (isMutualInterest ? 'property_interest' : null),
      reciprocal_signal: reciprocalSignal,
      match_confidence: matchConfidence,
      confidence_score: matchConfidence,
      match_confidence_state: confidenceState.state,
      match_confidence_label: confidenceState.label,
      match_reasons: buildPeopleMatchReasons({
        actorLifestyle: landlordLifestyle || null,
        counterpartLifestyle: candidate,
        property: best.matched_property || null,
      }),
      cta_state: discoveryState.ctaState,
      cta_label: discoveryState.ctaLabel,
    };
  });

  const filteredCandidates = scoredCandidates
    .filter(Boolean)
    .sort((a, b) => comparePeopleDiscoveryRanking(a, b, { preferCompleteProfiles: true }));

  const totalCandidatesScored = filteredCandidates.length;
  const hiddenBelowThreshold = Math.max(0, candidateIds.length - totalCandidatesScored);
  const currentPage = totalCandidatesScored > 0
    ? Math.min(page, Math.ceil(totalCandidatesScored / limit))
    : DEFAULT_PAGE;
  const offset = (currentPage - 1) * limit;
  const filtered = filteredCandidates.slice(offset, offset + limit);

  const topMatchBelowThreshold = filteredCandidates
    .reduce((max, candidate) => Math.max(max, candidate.match_score || 0), 0);

  return {
    canUseFeature: true,
    minMatch,
    listingCount: approvedListingCount,
    approvedListingCount,
    pendingListingCount: pendingListingCount || 0,
    topMatchBelowThreshold,
    totalCandidatesScored,
    data: filtered,
    diagnostics: diagnostics
      ? {
          ...diagnostics,
          compatibility_rows_fetched: scoreRows?.length || 0,
          accepted_interest_rows: acceptedInterestRows?.length || 0,
          unique_candidates_before_threshold: candidateIds.length,
          candidates_loaded_for_display: seekers?.length || 0,
          visible_full_profiles: filteredCandidates.filter((candidate) => candidate.profile_completion_state === 'complete').length,
          visible_partial_profiles: filteredCandidates.filter((candidate) => candidate.profile_completion_state !== 'complete').length,
          visible_matches: totalCandidatesScored,
          hidden_below_threshold: hiddenBelowThreshold,
        }
      : null,
    pagination: buildPagination({ page: currentPage, limit, total: totalCandidatesScored }),
  };
}

async function fetchPrecomputedMatchedSeekers({
  adminSupabase,
  landlordId,
  landlordMeta,
  landlordLifestyle,
  minMatch,
  limit,
  page,
  approvedListingCount,
  pendingListingCount,
  diagnostics,
}) {
  const shortlist = await getHostFindPeopleShortlistPage(landlordId, page, limit);
  if (!shortlist.entries.length) return null;

  const candidateIds = [...new Set(shortlist.entries.map((entry) => entry.primaryId).filter(Boolean))];
  const propertyIds = [...new Set(shortlist.entries.map((entry) => entry.propertyId).filter(Boolean))];
  if (!candidateIds.length || !propertyIds.length) return null;

  const [seekersRes, featuresRes, propertiesRes, acceptedPeopleRes] = await Promise.all([
    adminSupabase
      .from('user_lifestyles')
      .select(`
        user_id,
        current_city,
        schedule_type,
        cleanliness_level,
        social_level,
        noise_tolerance,
        interests,
        users:user_id (
          id,
          full_name,
          profile_picture,
          bio,
          is_verified,
          privacy_setting,
          profile_visibility,
          gender,
          date_of_birth
        )
      `)
      .in('user_id', candidateIds)
      .neq('user_id', landlordId),
    adminSupabase
      .from('matching_user_features')
      .select('user_id, profile_completion_state, has_preferences')
      .in('user_id', candidateIds),
    adminSupabase
      .from('properties')
      .select('id, title, city, state, price_per_month, offering_type, available_from, listed_by_user_id, approval_status, is_active')
      .in('id', propertyIds)
      .eq('listed_by_user_id', landlordId)
      .eq('is_active', true)
      .eq('approval_status', 'approved'),
    adminSupabase
      .from('people_interests')
      .select('initiator_user_id, target_user_id, context_property_id')
      .eq('status', 'accepted')
      .or(
        [
          `and(initiator_user_id.eq.${landlordId},target_user_id.in.(${candidateIds.join(',')}))`,
          `and(target_user_id.eq.${landlordId},initiator_user_id.in.(${candidateIds.join(',')}))`,
        ].join(',')
      )
      .limit(1000),
  ]);

  if (seekersRes.error) throw seekersRes.error;
  if (featuresRes.error) throw featuresRes.error;
  if (propertiesRes.error) throw propertiesRes.error;
  if (acceptedPeopleRes.error && !isMissingPeopleInterestsRelation(acceptedPeopleRes.error)) {
    throw acceptedPeopleRes.error;
  }

  const candidateById = new Map((seekersRes.data || []).map((candidate) => [candidate.user_id, candidate]));
  const propertyById = new Map((propertiesRes.data || []).map((property) => [property.id, property]));
  const featureByUserId = new Map((featuresRes.data || []).map((row) => [row.user_id, row]));
  const acceptedPeopleRevealKeys = new Set(
    (acceptedPeopleRes.data || []).flatMap((row) => {
      const initiatorId = row?.initiator_user_id;
      const targetId = row?.target_user_id;
      if (!initiatorId || !targetId) return [];
      return [`${initiatorId}:${targetId}`, `${targetId}:${initiatorId}`];
    })
  );

  const filteredCandidates = shortlist.entries
    .map((entry) => {
      const candidate = candidateById.get(entry.primaryId);
      const property = propertyById.get(entry.propertyId);
      const featureRow = featureByUserId.get(entry.primaryId) || null;
      if (!candidate || !property) return null;

      const hasAcceptedPeopleReveal = acceptedPeopleRevealKeys.has(`${landlordId}:${entry.primaryId}`);
      if (entry.score < minMatch && !entry.accepted) return null;

      const discoveryState = getPeopleDiscoveryState({
        subject: candidate.users,
        matchScore: entry.score,
        minMatch,
        hasMutualReveal: entry.accepted || hasAcceptedPeopleReveal,
      });

      if (!discoveryState.isVisible) return null;

      let displayName = candidate.users?.full_name || 'Seeker';
      let bio = candidate.users?.bio || null;
      if (discoveryState.shouldBlurProfile) {
        const nameParts = displayName.split(' ');
        displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
        bio = null;
      }

      const matchConfidence = propertyMatchConfidence(
        buildMatchedProperty(property) || {},
        candidate,
        featureRow?.has_preferences ? { user_id: entry.primaryId } : null,
        candidate.users || {},
        landlordLifestyle || null,
        landlordMeta || {}
      );
      const confidenceState = getMatchConfidenceState(matchConfidence);
      const reciprocalSignal = computeReciprocalAcceptanceSignal({
        hasAcceptedPropertyInterest: entry.accepted,
        hasAcceptedPeopleInterest: hasAcceptedPeopleReveal,
      });
      const roundedMatchScore = Math.round(entry.score);

      return {
        user_id: entry.primaryId,
        full_name: displayName,
        profile_picture: candidate.users?.profile_picture || null,
        bio,
        isBlurry: discoveryState.shouldBlurProfile,
        is_verified: !!candidate.users?.is_verified,
        current_city: candidate.current_city || null,
        schedule_type: candidate.schedule_type || null,
        interests: Array.isArray(candidate.interests) ? candidate.interests.slice(0, 6) : [],
        has_match_preferences: !!featureRow?.has_preferences,
        profile_completion_state: toProfileCompletionState(featureRow, !!featureRow?.has_preferences),
        match_score: roundedMatchScore,
        compatibility_score: roundedMatchScore,
        matched_property: buildMatchedProperty(property),
        is_private_profile: discoveryState.isPrivateProfile,
        can_contact_directly: discoveryState.isRevealed,
        reveal_source: hasAcceptedPeopleReveal ? 'people_interest' : (entry.accepted ? 'property_interest' : null),
        reciprocal_signal: reciprocalSignal,
        match_confidence: matchConfidence,
        confidence_score: matchConfidence,
        match_confidence_state: confidenceState.state,
        match_confidence_label: confidenceState.label,
        match_reasons: buildPeopleMatchReasons({
          actorLifestyle: landlordLifestyle || null,
          counterpartLifestyle: candidate,
          property: buildMatchedProperty(property) || null,
        }),
        cta_state: discoveryState.ctaState,
        cta_label: discoveryState.ctaLabel,
      };
    })
    .filter(Boolean)
    .sort((a, b) => comparePeopleDiscoveryRanking(a, b, { preferCompleteProfiles: true }));

  const totalCandidatesScored = filteredCandidates.length;
  const hiddenBelowThreshold = Math.max(0, (shortlist.total || candidateIds.length) - totalCandidatesScored);

  return {
    canUseFeature: true,
    minMatch,
    listingCount: approvedListingCount,
    approvedListingCount,
    pendingListingCount,
    topMatchBelowThreshold: filteredCandidates.reduce((max, candidate) => Math.max(max, candidate.match_score || 0), 0),
    totalCandidatesScored,
    data: filteredCandidates,
    diagnostics: diagnostics
      ? {
          ...diagnostics,
          shortlist_candidates_loaded: shortlist.entries.length,
          visible_matches: totalCandidatesScored,
          hidden_below_threshold: hiddenBelowThreshold,
        }
      : null,
    pagination: buildPagination({ page, limit, total: shortlist.total || totalCandidatesScored }),
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
