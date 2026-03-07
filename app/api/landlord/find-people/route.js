import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch } from '@/core/utils/redis';

const MAX_LIMIT = 60;

const generateCacheKey = ({ userId, minMatch, limit }) => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ userId, minMatch, limit }))
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

    const cacheKey = generateCacheKey({ userId: user.id, minMatch, limit });
    const data = await cachedFetch(cacheKey, 300, async () => {
      return fetchMatchedSeekers({ landlordId: user.id, minMatch, limit });
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Landlord Find People GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matched seekers' }, { status: 500 });
  }
}

async function fetchMatchedSeekers({ landlordId, minMatch, limit }) {
  const adminSupabase = createAdminClient();

  const { data: listings, error: listingsError } = await adminSupabase
    .from('properties')
    .select('id, title')
    .eq('listed_by_user_id', landlordId)
    .eq('is_active', true);

  if (listingsError) throw listingsError;

  if (!listings || listings.length === 0) {
    return {
      canUseFeature: false,
      message: 'You need at least one active listing to source matched seekers.',
      data: [],
      listingCount: 0,
    };
  }

  const listingIds = listings.map((l) => l.id);
  const listingIdSet = new Set(listingIds);
  const listingById = new Map(listings.map((l) => [l.id, l]));

  // 1) Cached compatibility scores for this landlord's active listings
  const { data: scoreRows, error: scoreError } = await adminSupabase
    .from('compatibility_scores')
    .select('seeker_id, property_id, score')
    .in('property_id', listingIds)
    .order('score', { ascending: false })
    .limit(1000); // Increased limit to ensure we see high matches

  if (scoreError) throw scoreError;

  // 2) Accepted interests should still be visible even when below threshold
  const { data: acceptedInterestRows, error: acceptedError } = await adminSupabase
    .from('property_interests')
    .select('seeker_id, property_id, status')
    .in('property_id', listingIds)
    .eq('status', 'accepted')
    .limit(500); // Safety limit for interests per landlord

  if (acceptedError) throw acceptedError;

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
    if (!seekerId || !propertyId || !Number.isFinite(score) || !listingIdSet.has(propertyId)) continue;

    const key = `${seekerId}:${propertyId}`;
    const isMutualInterest = acceptedKeys.has(key);
    const current = bestBySeeker.get(seekerId);
    if (!current || score > current.match_score) {
      bestBySeeker.set(seekerId, { property_id: propertyId, match_score: score, isMutualInterest });
    }
  }

  // Keep accepted interests in feed even when score cache is missing
  for (const row of acceptedInterestRows || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    if (!seekerId || !propertyId) continue;
    const current = bestBySeeker.get(seekerId);
    if (!current) {
      bestBySeeker.set(seekerId, { property_id: propertyId, match_score: 0, isMutualInterest: true });
    }
  }

  const candidateIds = [...bestBySeeker.keys()];
  if (candidateIds.length === 0) {
    return {
      canUseFeature: true,
      minMatch,
      listingCount: listings.length,
      data: [],
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
    .neq('user_id', landlordId)
    .limit(limit * 2); // Fetch slightly more to account for masking/filtering

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
      matched_property: listingById.get(best.property_id) || null,
    };
  });

  const filtered = scoredCandidates
    .filter(Boolean)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return {
    canUseFeature: true,
    minMatch,
    listingCount: listings.length,
    data: filtered,
  };
}
