import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch } from '@/core/utils/redis';
import { recomputeForProperty } from '@/core/services/matching/recompute-compatibility.service';

const MAX_LIMIT = 60;
const DEFAULT_PAGE = 1;

const generateCacheKey = ({ userId, minMatch, limit, page }) => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ userId, minMatch, limit, page }))
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

    const cacheKey = generateCacheKey({ userId: user.id, minMatch, limit, page });
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
  const approvedListingsQuery = () =>
    adminSupabase
      .from('properties')
      .select('id, title')
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
        property:properties!inner(id, title, listed_by_user_id, is_active, approval_status)
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
        property:properties!inner(id, listed_by_user_id, approval_status)
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
      pagination: buildPagination({ page, limit, total: 0 }),
    };
  }

  const { data: approvedListings, error: approvedListingsError } = await approvedListingsQuery();
  if (approvedListingsError) throw approvedListingsError;

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
    if (!seekerId || !propertyId || !Number.isFinite(score) || !property) continue;

    const key = `${seekerId}:${propertyId}`;
    const isMutualInterest = acceptedKeys.has(key);
    const current = bestBySeeker.get(seekerId);
    if (!current || score > current.match_score) {
      bestBySeeker.set(seekerId, {
        property_id: propertyId,
        match_score: score,
        isMutualInterest,
        matched_property: { id: property.id, title: property.title }
      });
    }
  }

  // Keep accepted interests in feed even when score cache is missing
  for (const row of acceptedInterestRows || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    if (!seekerId || !propertyId) continue;
    const current = bestBySeeker.get(seekerId);
    if (!current) {
      bestBySeeker.set(seekerId, { property_id: propertyId, match_score: 0, isMutualInterest: true, matched_property: { id: propertyId, title: 'Listing' } });
    }
  }

  const candidateIds = [...bestBySeeker.keys()];
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
      pagination: buildPagination({ page, limit, total: 0 }),
    };
  }

  const { data: seekers, error: seekersError } = await adminSupabase
    .from('user_lifestyles')
    .select(`
      user_id,
      primary_role,
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
        profile_visibility
      )
    `)
    .in('user_id', candidateIds)
    .neq('user_id', landlordId);

  if (seekersError) throw seekersError;

  const candidateById = new Map((seekers || []).map((candidate) => [candidate.user_id, candidate]));

  const scoredCandidates = candidateIds.map((seekerId) => {
    const candidate = candidateById.get(seekerId);
    if (!candidate) return null;

    const best = bestBySeeker.get(seekerId);
    if (!best) return null;

    const isMutualInterest = best.isMutualInterest || acceptedSeekerIds.has(seekerId);
    if (best.match_score < minMatch && !isMutualInterest) return null;

    const isPrivate = candidate.users?.profile_visibility === 'private';
    const shouldMask = isPrivate && !isMutualInterest;

    let displayName = candidate.users?.full_name || 'Seeker';
    let bio = candidate.users?.bio || null;
    let isBlurry = false;

    if (shouldMask) {
      const nameParts = displayName.split(' ');
      displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
      isBlurry = true;
      bio = null;
    }

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
      match_score: Math.round(best.match_score),
      matched_property: best.matched_property || null,
    };
  });

  const filteredCandidates = scoredCandidates
    .filter(Boolean)
    .sort((a, b) => b.match_score - a.match_score);

  const totalCandidatesScored = filteredCandidates.length;
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
    pagination: buildPagination({ page: currentPage, limit, total: totalCandidatesScored }),
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
