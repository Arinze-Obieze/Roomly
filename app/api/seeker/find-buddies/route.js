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
  return `seeker:find_buddies:${hash}`;
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
      return fetchMatchedBuddies({ seekerId: user.id, minMatch, limit });
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Seeker Find Buddies GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matched buddies' }, { status: 500 });
  }
}

async function fetchMatchedBuddies({ seekerId, minMatch, limit }) {
  const adminSupabase = createAdminClient();

  // 1. For a seeker to find buddies, they are matched against OTHER seekers based on lifestyle similarity.
  // We can approximate this by finding seekers who match highly with the SAME properties this seeker matches with,
  // OR we can do a direct lifestyle comparison. For now, we will return other seekers with similar budgets/cities.
  
  // Since we don't have a direct seeker-to-seeker matching score yet, we'll fetch other seekers in the same city 
  // and manually score them based on matching interests, schedule, and cleanliness.
  
  const { data: myLifestyle } = await adminSupabase
    .from('user_lifestyles')
    .select('*')
    .eq('user_id', seekerId)
    .single();

  if (!myLifestyle) {
    return {
      canUseFeature: false,
      message: 'You need to complete your lifestyle profile to find buddies.',
      data: [],
      listingCount: 0,
    };
  }

  // Fetch potential buddies
  let query = adminSupabase
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
      updated_at,
      users:user_id (
        id,
        full_name,
        profile_picture,
        bio,
        is_verified,
        profile_visibility
      )
    `)
    .neq('user_id', seekerId); // Don't fetch myself
    // Removed strict primary_role filter and moved city filter to scoring to improve discovery
    
  const { data: seekers, error: seekersError } = await query
    .order('updated_at', { ascending: false })
    .limit(400); // Increased limit as we'll filter/score in memory

  if (seekersError) throw seekersError;

  const scoredBuddies = (seekers || []).map((candidate) => {
    // Basic similarity scoring (0-100)
    let score = 20; // Lower baseline
    
    // Weight city match (30pts) - use fuzzy-ish match
    const myCity = myLifestyle.current_city?.toLowerCase().trim();
    const theirCity = candidate.current_city?.toLowerCase().trim();
    
    if (myCity && theirCity) {
      if (myCity === theirCity) {
        score += 30;
      } else if (myCity.includes(theirCity) || theirCity.includes(myCity)) {
        score += 20;
      }
    } else {
      score += 15; // Partial credit if one or both are missing (discovery)
    }
    
    if (candidate.schedule_type === myLifestyle.schedule_type) score += 15;
    if (candidate.cleanliness_level === myLifestyle.cleanliness_level) score += 15;
    if (candidate.noise_tolerance === myLifestyle.noise_tolerance) score += 10;
    
    // Interest overlap (max 10pts)
    const myInterests = Array.isArray(myLifestyle.interests) ? myLifestyle.interests : [];
    const theirInterests = Array.isArray(candidate.interests) ? candidate.interests : [];
    const commonInterests = myInterests.filter(i => theirInterests.includes(i));
    if (commonInterests.length > 0) {
        score += Math.min(10, commonInterests.length * 2);
    }

    // ── 70% PRIVACY THRESHOLD ──
    const isPrivate = candidate.users?.profile_visibility === 'private';
    
    // Enforce threshold consistently across private and public profiles.
    if (score < minMatch) return null;

    let displayName = candidate.users?.full_name || 'Seeker';
    let bio = candidate.users?.bio || null;
    let isBlurry = false;

    if (isPrivate) {
      const nameParts = displayName.split(' ');
      displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
      isBlurry = true;
      bio = null;
    }

    return {
      user_id: candidate.user_id,
      full_name: displayName,
      profile_picture: candidate.users?.profile_picture || null,
      bio,
      isBlurry,
      is_verified: !!candidate.users?.is_verified,
      current_city: candidate.current_city || null,
      schedule_type: candidate.schedule_type || null,
      interests: theirInterests.slice(0, 6),
      match_score: score,
      matched_property: null, // Buddies don't have a matched property in this context
    };
  });

  const filtered = scoredBuddies
    .filter(Boolean)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return {
    canUseFeature: true,
    minMatch,
    listingCount: 0,
    data: filtered,
  };
}
