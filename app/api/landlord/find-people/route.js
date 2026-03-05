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
    .eq('listed_by_user_id', landlordId);

  if (listingsError) throw listingsError;

  if (!listings || listings.length === 0) {
    return {
      canUseFeature: false,
      message: 'You need at least one active listing to source matched seekers.',
      data: [],
      listingCount: 0,
    };
  }

  const listingIds = new Set(listings.map((l) => l.id));
  const listingById = new Map(listings.map((l) => [l.id, l]));

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
    .neq('user_id', landlordId)
    .or('primary_role.eq.seeker,primary_role.is.null')
    .limit(120);

  if (seekersError) throw seekersError;

  const scoredCandidates = await Promise.all(
    (seekers || []).map(async (candidate) => {
      const seekerId = candidate.user_id;
      const { data: matchRows, error: matchError } = await adminSupabase.rpc('get_property_matches', {
        seeker_id: seekerId,
      });

      if (matchError || !Array.isArray(matchRows)) return null;

      const relevantMatches = matchRows
        .map((row) => ({
          property_id: row?.property_id,
          match_score: Number(row?.match_score),
        }))
        .filter((row) => row?.property_id && listingIds.has(row.property_id) && Number.isFinite(row.match_score));

      if (relevantMatches.length === 0) return null;

      let best = relevantMatches[0];
      for (const row of relevantMatches) {
        if (row.match_score > best.match_score) best = row;
      }

      // Check for mutual interest first
      const { data: interest } = await adminSupabase
        .from('property_interests')
        .select('status')
        .eq('seeker_id', seekerId)
        .eq('property_id', best.property_id)
        .single();
        
      const isMutualInterest = interest?.status === 'accepted';
      const isPrivate = candidate.users?.profile_visibility === 'private';
      const shouldMask = isPrivate && !isMutualInterest;

      // Drop candidates below the minMatch threshold, UNLESS they already have mutual interest
      if (best.match_score < minMatch && !isMutualInterest) return null;

      let displayName = candidate.users?.full_name || 'Seeker';
      let bio = candidate.users?.bio || null;
      let isBlurry = false;

      if (shouldMask) {
        // Mask the name: "Arinze O." -> "A."
        const nameParts = displayName.split(' ');
        displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
        isBlurry = true;
        bio = null; // Hide bio for privacy
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
    })
  );

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
