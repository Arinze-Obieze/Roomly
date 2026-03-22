import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch } from '@/core/utils/redis';
import { handleCreateProperty } from '@/core/services/properties/create-property.service';
import crypto from 'crypto';

export const runtime       = 'nodejs';
export const bodySizeLimit = '20mb';

// ── Cache key generation ───────────────────────────────────────────────────
// Per-user, per-query (includes page so each paginated slice is cached)
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

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);

    // noStore=1 is set by the client when it calls refresh() to bypass Redis
    const skipCache = searchParams.get('noStore') === '1';

    const cacheKey = generateCacheKey(searchParams, user?.id);

    // 5-min TTL; skip entirely on refresh
    const data = skipCache
      ? await fetchPropertiesFromDB(searchParams, user)
      : await cachedFetch(cacheKey, 300, () => fetchPropertiesFromDB(searchParams, user));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Properties GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// ── Core DB fetch ──────────────────────────────────────────────────────────
async function fetchPropertiesFromDB(searchParams, user) {
  const page      = Math.max(1, parseInt(searchParams.get('page')     || '1'));
  const pageSize  = Math.min(50, parseInt(searchParams.get('pageSize')|| '12')); // cap at 50
  const sortBy    = searchParams.get('sortBy');
  const isRanked  = (sortBy === 'match' || sortBy === 'recommended') && user;

  const supabase = await createClient();
  const adminSb  = createAdminClient();

  // ── Pre-fetch user context ─────────────────────────────────────────────
  let interests                = [];
  let scoreMap                 = {};
  let allowedPrivateIds        = [];
  let missingProfile           = false;
  let globalRankedIds          = null; // only set for ranked queries

  if (user) {
    const [interestData, scoreData, profileCheck] = await Promise.all([
      supabase.from('property_interests').select('property_id, status').eq('seeker_id', user.id),
      supabase.from('compatibility_scores').select('property_id, score').eq('seeker_id', user.id),
      supabase.from('user_lifestyles').select('user_id').eq('user_id', user.id).single(),
    ]);

    interests = interestData.data || [];
    const scores = scoreData.data || [];

    scores.forEach(s => {
      scoreMap[s.property_id] = s.score;
      if (s.score >= 70) allowedPrivateIds.push(s.property_id);
    });

    interests.forEach(i => {
      if (i.status === 'accepted') allowedPrivateIds.push(i.property_id);
    });

    if (profileCheck.error?.code === 'PGRST116') missingProfile = true;

    // ── Global rank for match/recommended sort ─────────────────────────
    // Sort ALL scored property IDs globally by blended score (compatibility +
    // recency), then paginate by slicing. This avoids the "per-page sort" bug
    // where page 2 could contain higher-scored items than page 1.
    if (isRanked && scores.length > 0) {
      const now = Date.now();
      const ranked = scores
        .map(s => {
          const ageHours = Math.max(0, (now - new Date(s.created_at ?? 0).getTime()) / 36e5);
          const recency  = Math.max(0, 100 - (ageHours / 6.72));
          return {
            id:    s.property_id,
            score: (s.score * 0.7) + (recency * 0.3),
          };
        })
        .sort((a, b) => b.score - a.score);

      globalRankedIds = ranked.map(r => r.id);
    }
  }

  // ── Branch: globally-ranked query ─────────────────────────────────────
  if (isRanked && globalRankedIds) {
    const from  = (page - 1) * pageSize;
    const slice = globalRankedIds.slice(from, from + pageSize);
    const total = globalRankedIds.length;

    if (slice.length === 0) {
      return {
        data: [],
        pagination: { page, pageSize, total, hasMore: false },
      };
    }

    const { data, error } = await adminSb
      .from('properties')
      .select(`
        *,
        property_media (id, url, media_type, display_order, is_primary),
        users!listed_by_user_id (id, full_name, profile_picture)
      `)
      .in('id', slice)
      .eq('is_active', true)
      .eq('approval_status', 'approved');

    if (error) throw error;

    // Re-sort to honour the pre-computed rank order (DB IN doesn't guarantee order)
    const orderMap = new Map(slice.map((id, idx) => [id, idx]));
    const sorted   = (data || []).sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));

    return {
      data: sorted.map(p => transformProperty(p, interests, scoreMap, user, missingProfile, supabase)),
      pagination: {
        page,
        pageSize,
        total,
        hasMore: from + pageSize < total,
      },
    };
  }

  // ── Standard (non-ranked) query ────────────────────────────────────────
  const priceRange    = searchParams.get('priceRange');
  const minPrice      = parseInt(searchParams.get('minPrice')  || '');
  const maxPrice      = parseInt(searchParams.get('maxPrice')  || '');
  const bedrooms      = searchParams.get('bedrooms')?.split(',').map(Number).filter(Boolean);
  const propertyType  = searchParams.get('propertyType');
  const propertyTypes = searchParams.get('propertyTypes')?.split(',').map(v => v.trim()).filter(Boolean);
  const amenities     = searchParams.get('amenities')?.split(',').filter(Boolean);
  const minBedrooms   = parseInt(searchParams.get('minBedrooms'));
  const minBathrooms  = parseInt(searchParams.get('minBathrooms'));
  const location      = searchParams.get('location');
  const search        = searchParams.get('search');
  const moveInDate    = searchParams.get('moveInDate');
  const roomType      = searchParams.get('roomType');
  const houseRules    = searchParams.get('houseRules')?.split(',').filter(Boolean);
  const billsIncluded = searchParams.get('billsIncluded') === 'true';

  let query = adminSb
    .from('properties')
    .select(`
      *,
      property_media (id, url, media_type, display_order, is_primary),
      users!listed_by_user_id (id, full_name, profile_picture)
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('approval_status', 'approved');

  // Privacy masking
  if (user) {
    const baseOr = `privacy_setting.neq.private,listed_by_user_id.eq.${user.id}`;
    if (allowedPrivateIds.length > 0) {
      const safeIds = allowedPrivateIds.slice(0, 80).join(',');
      query = query.or(`${baseOr},id.in.(${safeIds})`);
    } else {
      query = query.or(baseOr);
    }
  } else {
    query = query.neq('privacy_setting', 'private');
  }

  // Price filters
  if (!Number.isNaN(minPrice)) query = query.gte('price_per_month', minPrice);
  if (!Number.isNaN(maxPrice)) query = query.lte('price_per_month', maxPrice);
  if (priceRange && priceRange !== 'all') {
    const ranges = { budget: [0, 800], mid: [800, 1500], premium: [1500, 999999] };
    const r = ranges[priceRange];
    if (r) query = query.gte('price_per_month', r[0]).lte('price_per_month', r[1]);
  }

  // Bedroom / bathroom filters
  if (bedrooms?.length > 0)   query = query.in('bedrooms', bedrooms);
  if (minBedrooms)             query = query.gte('bedrooms', minBedrooms);
  if (minBathrooms)            query = query.gte('bathrooms', minBathrooms);

  // Property type
  if (propertyTypes?.length > 0)              query = query.in('property_type', propertyTypes);
  else if (propertyType && propertyType !== 'any') query = query.eq('property_type', propertyType);

  // Text search
  if (location) query = query.or(`city.ilike.*${location}*,state.ilike.*${location}*,street.ilike.*${location}*`);
  if (search)   query = query.or(`title.ilike.*${search}*,description.ilike.*${search}*,city.ilike.*${search}*,state.ilike.*${search}*,street.ilike.*${search}*`);

  // Advanced filters
  if (amenities?.length > 0)   query = query.contains('amenities', amenities);
  if (roomType)                 query = query.eq('room_type', roomType);
  if (billsIncluded)            query = query.or('bills_included.eq.true,bills_option.eq.all');
  if (houseRules?.length > 0)  query = query.contains('house_rules', houseRules);

  // Move-in date
  if (moveInDate && moveInDate !== 'any') {
    const now     = new Date();
    const today   = now.toISOString().split('T')[0];
    if (moveInDate === 'immediately') {
      query = query.lte('available_from', today);
    } else if (moveInDate === 'this_month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      query = query.lte('available_from', endOfMonth.toISOString().split('T')[0]);
    } else if (moveInDate === 'next_month') {
      const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      query = query
        .gte('available_from', start.toISOString().split('T')[0])
        .lte('available_from', end.toISOString().split('T')[0]);
    }
  }

  // Sort
  switch (sortBy) {
    case 'price_low':
      query = query.order('price_per_month', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'price_high':
      query = query.order('price_per_month', { ascending: false }).order('created_at', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) { console.error('[DB] Error:', error); throw error; }

  return {
    data: (data || []).map(p => transformProperty(p, interests, scoreMap, user, missingProfile, supabase)),
    pagination: {
      page,
      pageSize,
      total:   count,
      hasMore: to < (count || 0) - 1,
    },
  };
}

// ── Property transformer ───────────────────────────────────────────────────
function transformProperty(property, interests, scoreMap, user, missingProfile, supabase) {
  const interest  = interests.find(i => i.property_id === property.id);
  const matchScore = scoreMap[property.id] ?? null;

  const resolveUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http')
      ? url
      : supabase.storage.from('property-media').getPublicUrl(url).data.publicUrl;
  };

  const primaryMedia = property.property_media?.find(m => m.is_primary) || property.property_media?.[0];
  const image        = resolveUrl(primaryMedia?.url) || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  const images       = property.property_media
    ?.sort((a, b) => a.display_order - b.display_order)
    .map(m => resolveUrl(m.url))
    .filter(Boolean) || [];

  let hostName     = property.users?.full_name || 'Unknown';
  const isPrivate  = property.privacy_setting === 'private';
  const isOwner    = user && property.listed_by_user_id === user.id;
  const isMutual   = interest?.status === 'accepted';
  const maskHost   = isPrivate && !isMutual && !isOwner;

  if (!user && hostName !== 'Unknown') {
    hostName = hostName.split(' ')[0];
  }

  const base = {
    id:               property.id,
    price:            property.price_per_month,
    period:           'month',
    bedrooms:         property.bedrooms,
    bathrooms:        property.bathrooms,
    bills_option:     property.bills_option,
    couples_allowed:  property.couples_allowed,
    propertyType:     property.property_type,
    isPrivate,
    matchScore,
    missingProfile,
    interestStatus:   interest?.status || null,
    availableFrom:    property.available_from,
    createdAt:        property.created_at,
  };

  if (maskHost) {
    const parts      = hostName.split(' ');
    const maskedName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : hostName;
    return {
      ...base,
      title:       `Room in ${property.city}`,
      location:    `${property.city}, ${property.state}`,
      priceRange:  `€${Math.floor(property.price_per_month / 100) * 100}–${Math.ceil(property.price_per_month / 100) * 100}`,
      image,
      isBlurry:    true,
      amenities:   (property.amenities || []).slice(0, 3).map(a => ({ icon: 'FaWifi', label: a })),
      verified:    false,
      host: {
        name:   maskedName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(maskedName)}&background=FF6B6B&color=fff`,
        id:     property.listed_by_user_id,
      },
      description: property.description?.substring(0, 100) + '…',
    };
  }

  return {
    ...base,
    title:       property.title,
    location:    `${property.city}, ${property.state}`,
    image,
    images,
    amenities:   (property.amenities || []).map(a => ({ icon: 'FaWifi', label: a })),
    verified:    false,
    host: {
      name:   hostName,
      avatar: property.users?.profile_picture
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostName)}&background=FF6B6B&color=fff`,
      id:     property.listed_by_user_id,
    },
    description: property.description,
  };
}

// ── POST (create listing) ──────────────────────────────────────────────────
export async function POST(req) {
  return handleCreateProperty(req);
}
