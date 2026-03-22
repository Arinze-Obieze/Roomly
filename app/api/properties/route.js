import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch } from '@/core/utils/redis';
import { handleCreateProperty } from '@/core/services/properties/create-property.service';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

// Generate consistent, per-user cache key from query parameters
// IMPORTANT: scores and interests are user-specific — must be keyed per user.
const generateCacheKey = (searchParams, userId) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ params, userId: userId || 'anon' }))
    .digest('hex');
  return `properties:list:${hash}`;
};

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);

    const cacheKey = generateCacheKey(searchParams, user?.id);

    // 5 min TTL — personalised per user so scores/interests are always correct
    const cachedData = await cachedFetch(cacheKey, 300, async () => {
      return await fetchPropertiesFromDB(searchParams, user);
    });

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error('[Properties GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

// Extract database fetch logic
async function fetchPropertiesFromDB(searchParams, user) {
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '12');
  const priceRange = searchParams.get('priceRange');
  const minPrice = parseInt(searchParams.get('minPrice') || '');
  const maxPrice = parseInt(searchParams.get('maxPrice') || '');
  const bedrooms = searchParams.get('bedrooms')?.split(',').map(Number).filter(Boolean);
  const propertyType = searchParams.get('propertyType');
  const propertyTypes = searchParams.get('propertyTypes')?.split(',').map(v => v.trim()).filter(Boolean);
  const amenities = searchParams.get('amenities')?.split(',').filter(Boolean);
  const minBedrooms = parseInt(searchParams.get('minBedrooms'));
  const minBathrooms = parseInt(searchParams.get('minBathrooms'));
  const location = searchParams.get('location');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy');
  // ── New filter params ──────────────────────────────────────────────────────
  const moveInDate = searchParams.get('moveInDate');
  const roomType = searchParams.get('roomType');
  const houseRules = searchParams.get('houseRules')?.split(',').filter(Boolean);
  const billsIncluded = searchParams.get('billsIncluded') === 'true';

  const supabase = await createClient(); // user-scoped reads (interests/scores)
  const adminSb = createAdminClient();   // avoids recursive users RLS on host joins

  let query = adminSb
    .from('properties')
    .select(`
      *,
      property_media (
        id,
        url,
        media_type,
        display_order,
        is_primary
      ),
      users!listed_by_user_id (
        id,
        full_name,
        profile_picture
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('approval_status', 'approved');

  if (!Number.isNaN(minPrice)) {
    query = query.gte('price_per_month', minPrice);
  }

  if (!Number.isNaN(maxPrice)) {
    query = query.lte('price_per_month', maxPrice);
  }

  if (priceRange && priceRange !== 'all') {
    const priceRanges = {
      budget: { min: 0, max: 800 },
      mid: { min: 800, max: 1500 },
      premium: { min: 1500, max: 999999 }
    };
    const range = priceRanges[priceRange];
    if (range) {
      query = query.gte('price_per_month', range.min).lte('price_per_month', range.max);
    }
  }

  if (bedrooms && bedrooms.length > 0) {
    query = query.in('bedrooms', bedrooms);
  }
  
  if (minBedrooms) {
    query = query.gte('bedrooms', minBedrooms);
  }
  
  if (minBathrooms) {
    query = query.gte('bathrooms', minBathrooms);
  }

  if (propertyTypes && propertyTypes.length > 0) {
    query = query.in('property_type', propertyTypes);
  } else if (propertyType && propertyType !== 'any') {
    query = query.eq('property_type', propertyType);
  }

  if (location) {
    query = query.or(`city.ilike.*${location}*,state.ilike.*${location}*,street.ilike.*${location}*`);
  }

  if (search) {
    query = query.or(`title.ilike.*${search}*,description.ilike.*${search}*,city.ilike.*${search}*,state.ilike.*${search}*,street.ilike.*${search}*`);
  }

  if (amenities && amenities.length > 0) {
    query = query.contains('amenities', amenities);
  }

  // ── New advanced filters ───────────────────────────────────────────────────
  // Note: room_type and house_rules require db_migration_filter_columns.sql.
  // bills_included falls back to bills_option for safety.
  if (roomType) {
    // Try room_type column; if it doesn't exist the query will return a DB error
    // that is caught above — safe to add now that migration is available.
    query = query.eq('room_type', roomType);
  }

  if (billsIncluded) {
    // Prefer the generated column if available, fall back to bills_option string match
    query = query.or('bills_included.eq.true,bills_option.eq.all');
  }

  if (houseRules && houseRules.length > 0) {
    query = query.contains('house_rules', houseRules);
  }

  if (moveInDate && moveInDate !== 'any') {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (moveInDate === 'immediately') {
      // available_from is today or earlier (already available)
      query = query.lte('available_from', todayStr);
    } else if (moveInDate === 'this_month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      query = query.lte('available_from', endOfMonth.toISOString().split('T')[0]);
    } else if (moveInDate === 'next_month') {
      const startOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNext = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      query = query
        .gte('available_from', startOfNext.toISOString().split('T')[0])
        .lte('available_from', endOfNext.toISOString().split('T')[0]);
    }
    // 'flexible' = no date filter, just no restriction
  }

  switch (sortBy) {
    case 'price_low':
      query = query.order('price_per_month', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'price_high':
      query = query.order('price_per_month', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'new':
    case 'recommended':
    case 'match':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const applyDbPagination = !((sortBy === 'match' || sortBy === 'recommended') && user);
  if (applyDbPagination) {
    query = query.range(from, to);
  }

  const queryStart = Date.now();
  const { data, error, count } = await query;


  if (error) {
    console.error('[DB] Error:', error);
    throw error;
  }

  // user is passed in from GET to avoid a redundant getUser() call
  // interests and scores are fetched per-user from Supabase (bypasses Redis)

  // Fetch interests for the current user
  let interests = [];
  let scoreMap = {}; // { [property_id]: score }
  let missingProfile = false;

  if (user) {
    const interestStart = Date.now();
    
    // We also need to check if the user has actually filled out their profile
    // If they haven't, we should tell the frontend so it prompts them.
    const [interestData, scoreData, profileCheck] = await Promise.all([
      supabase
        .from('property_interests')
        .select('property_id, status')
        .eq('seeker_id', user.id),
      supabase
        .from('compatibility_scores')
        .select('property_id, score')
        .eq('seeker_id', user.id),
      supabase
        .from('user_lifestyles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
    ]);
    
    interests = interestData.data || [];
    for (const row of (scoreData.data || [])) {
      scoreMap[row.property_id] = row.score;
    }

    // If no row exists in user_lifestyles, they haven't started the profile wizard
    if (profileCheck.error && profileCheck.error.code === 'PGRST116') {
        missingProfile = true;
    }


  }

  const transformedData = data.map(property => {
    const interest = interests.find(i => i.property_id === property.id);
    const isMutualInterest = interest?.status === 'accepted';
    const isPrivate = property.privacy_setting === 'private';
    const isOwner = user && property.listed_by_user_id === user.id;
    const shouldMask = isPrivate && !isMutualInterest && !isOwner;
    const matchScore = scoreMap[property.id] ?? null;

    // ── 70% PRIVACY THRESHOLD ──
    // If it's private and we don't have mutual interest/ownership,
    // completely hide it unless the seeker is a >= 70% match.
    if (shouldMask) {
      if (!user || matchScore === null || matchScore < 70) {
        return null;
      }
    }

    let hostName = property.users?.full_name || 'Unknown';
    
    if (!user && hostName !== 'Unknown') {
      hostName = hostName.split(' ')[0];
    }

    if (shouldMask) {
      const nameParts = hostName.split(' ');
      const maskedName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[1][0]}.` 
        : hostName;

      return {
        id: property.id,
        title: `Room in ${property.city}`,
        location: `${property.city}, ${property.state}`,
        price: property.price_per_month,
        priceRange: `€${Math.floor(property.price_per_month / 100) * 100}-${Math.ceil(property.price_per_month / 100) * 100}`,
        period: 'month',
        image: (() => {
          const primary = property.property_media?.find(m => m.is_primary);
          if (primary?.url) {
            return primary.url.startsWith('http') 
              ? primary.url 
              : supabase.storage.from('property-media').getPublicUrl(primary.url).data.publicUrl;
          }
          const first = property.property_media?.[0];
          if (first?.url) {
            return first.url.startsWith('http')
              ? first.url
              : supabase.storage.from('property-media').getPublicUrl(first.url).data.publicUrl;
          }
          return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
        })(),
        isBlurry: true,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        bills_option: property.bills_option,
        couples_allowed: property.couples_allowed,
        propertyType: property.property_type,
        amenities: (property.amenities || []).slice(0, 3).map(a => ({ icon: 'FaWifi', label: a })),
        verified: false,
        isPrivate: true,
        matchScore: scoreMap[property.id] ?? null, // Match score always visible on private listings
        missingProfile,
        interestStatus: interest?.status || null,
        host: {
          name: maskedName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(maskedName)}&background=FF6B6B&color=fff`,
          id: property.listed_by_user_id
        },
        description: property.description?.substring(0, 100) + '...',
        availableFrom: property.available_from,
        createdAt: property.created_at
      };
    }

    return {
      id: property.id,
      title: property.title,
      location: `${property.city}, ${property.state}`,
      price: property.price_per_month,
      period: 'month',
      image: (() => {
        const primary = property.property_media?.find(m => m.is_primary);
        if (primary?.url) {
          return primary.url.startsWith('http') 
            ? primary.url 
            : supabase.storage.from('property-media').getPublicUrl(primary.url).data.publicUrl;
        }
        const first = property.property_media?.[0];
        if (first?.url) {
          return first.url.startsWith('http')
            ? first.url
            : supabase.storage.from('property-media').getPublicUrl(first.url).data.publicUrl;
        }
        return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
      })(),
      images: property.property_media?.sort((a, b) => a.display_order - b.display_order).map(m => 
        m.url.startsWith('http') 
          ? m.url 
          : supabase.storage.from('property-media').getPublicUrl(m.url).data.publicUrl
      ) || [],
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      bills_option: property.bills_option,
      couples_allowed: property.couples_allowed,
      propertyType: property.property_type,
      amenities: (property.amenities || []).map(a => ({ icon: 'FaWifi', label: a })),
      verified: false,
      isPrivate: isPrivate,
      matchScore: scoreMap[property.id] ?? null,
      missingProfile,
      interestStatus: interest?.status || null,
      host: {
        name: hostName,
        avatar: property.users?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostName)}&background=FF6B6B&color=fff`,
        id: property.listed_by_user_id
      },
      description: property.description,
      availableFrom: property.available_from,
      createdAt: property.created_at
    };
  }).filter(Boolean); // Filter out the nulls from the privacy threshold

  let finalData = transformedData;
  if ((sortBy === 'match' || sortBy === 'recommended') && user) {
    const now = new Date();
    finalData = [...transformedData].sort((a, b) => {
      const aMatch = typeof a.matchScore === 'number' ? a.matchScore : 50;
      const bMatch = typeof b.matchScore === 'number' ? b.matchScore : 50;

      // Recency Score: Linear decay over 28 days (672 hours)
      const aAgeHours = Math.max(0, (now - new Date(a.createdAt)) / 36e5);
      const bAgeHours = Math.max(0, (now - new Date(b.createdAt)) / 36e5);
      const aRecency = Math.max(0, 100 - (aAgeHours / 6.72));
      const bRecency = Math.max(0, 100 - (bAgeHours / 6.72));

      // Blended Discovery Score (70% Compatibility, 30% Freshness)
      const aDiscovery = (aMatch * 0.7) + (aRecency * 0.3);
      const bDiscovery = (bMatch * 0.7) + (bRecency * 0.3);

      if (bDiscovery !== aDiscovery) return bDiscovery - aDiscovery;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  return {
    data: finalData,
    pagination: {
      page,
      pageSize,
      total: count,
      hasMore: to < (count || 0) - 1
    }
  };
}

export async function POST(req) {
  return handleCreateProperty(req);
}
