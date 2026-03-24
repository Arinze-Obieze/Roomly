import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch } from '@/core/utils/redis';

const MAX_LIMIT = 60;
const DEFAULT_PAGE = 1;

const generateCacheKey = ({ userId, minMatch, limit, page }) => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ userId, minMatch, limit, page }))
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

    const cacheKey = generateCacheKey({ userId: user.id, minMatch, limit, page });
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
    .select('id, title, listed_by_user_id, is_active')
    .in('id', propertyIds)
    .eq('is_active', true);

  if (propertiesError) throw propertiesError;

  // Group properties by landlord to find the "best" one per landlord
  const landlordsMap = new Map();
  for (const property of properties) {
    const score = scoreByPropertyId.get(property.id);
    const existing = landlordsMap.get(property.listed_by_user_id);
    if (!existing || score > existing.score) {
      landlordsMap.set(property.listed_by_user_id, {
        property_id: property.id,
        property_title: property.title,
        score: score
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

  // 3) Get landlord profiles
  const { data: hosts, error: hostsError } = await adminSupabase
    .from('users')
    .select('id, full_name, profile_picture, bio, is_verified, profile_visibility')
    .in('id', landlordIds);

  if (hostsError) throw hostsError;

  // 4) Get host lifestyles for interests/city
  const { data: lifestyles, error: lifestylesError } = await adminSupabase
    .from('user_lifestyles')
    .select('user_id, current_city, interests')
    .in('user_id', landlordIds);

  if (lifestylesError) throw lifestylesError;

  const lifestyleByUserId = new Map(lifestyles.map(l => [l.user_id, l]));

  const data = hosts.map(host => {
    const matchInfo = landlordsMap.get(host.id);
    const lifestyle = lifestyleByUserId.get(host.id);
    const isPrivate = host.profile_visibility === 'private';
    
    // Privacy Logic: For high-match discovery, landlords usually WANT to be seen, 
    // but we honor profile_visibility same as seekers.
    const isBlurry = isPrivate;
    
    let displayName = host.full_name || 'Host';
    let bio = host.bio || null;

    if (isBlurry) {
      const nameParts = displayName.split(' ');
      displayName = nameParts[0] ? `${nameParts[0][0]}.` : '?';
      bio = null;
    }

    return {
      user_id: host.id,
      full_name: displayName,
      profile_picture: host.profile_picture || null,
      bio,
      isBlurry,
      is_verified: !!host.is_verified,
      current_city: lifestyle?.current_city || null,
      interests: Array.isArray(lifestyle?.interests) ? lifestyle.interests.slice(0, 6) : [],
      match_score: Math.round(matchInfo.score),
      matched_property: {
        id: matchInfo.property_id,
        title: matchInfo.property_title
      },
      role: 'host'
    };
  })
  .sort((a, b) => b.match_score - a.match_score);

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
