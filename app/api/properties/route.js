import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch, getCachedInt } from '@/core/utils/redis';
import { handleCreateProperty } from '@/core/services/properties/create-property.service';
import crypto from 'crypto';

export const runtime       = 'nodejs';
export const bodySizeLimit = '20mb';

// ── Cache key generation ───────────────────────────────────────────────────
// Per-user, per-query (includes page so each paginated slice is cached)
const generateCacheKey = (searchParams, userId, versions = {}) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ params, userId: userId || 'anon', versions }))
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

    const versions = {
      global: await getCachedInt('v:properties:global', 1),
      user: user?.id ? await getCachedInt(`v:properties:user:${user.id}`, 1) : 0,
    };
    const cacheKey = generateCacheKey(searchParams, user?.id, versions);

    // 5-min TTL; skip entirely on refresh
    const data = skipCache
      ? await fetchPropertiesFromDB(searchParams, user)
      : await cachedFetch(cacheKey, 300, () => fetchPropertiesFromDB(searchParams, user));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Properties GET] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch properties' }, { status: 500 });
  }
}

// ── Core DB fetch ──────────────────────────────────────────────────────────
// Cursor encoding: base64(JSON({ createdAt, id })) for newest
//                  base64(JSON({ price, id }))     for price sorts
function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
function decodeCursor(str) {
  try { return JSON.parse(Buffer.from(str, 'base64url').toString('utf8')); } catch { return null; }
}

async function fetchPropertiesFromDB(searchParams, user) {
  const page      = Math.max(1, parseInt(searchParams.get('page')     || '1'));
  const pageSize  = Math.min(50, parseInt(searchParams.get('pageSize')|| '12')); // cap at 50
  const sortBy    = searchParams.get('sortBy');
  const cursorRaw = searchParams.get('cursor');

  const supabase = await createClient();
  const adminSb  = createAdminClient();

  // ── Pre-fetch user context (bounded, no O(N) scans) ─────────────────────
  let missingProfile = false;
  let allowedPrivateIds = [];
  let acceptedPrivateIds = [];

  if (user) {
    const [lifestyleCheck, prefsCheck, acceptedInterests, privateScoreIds] = await Promise.all([
      supabase.from('user_lifestyles').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('match_preferences').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('property_interests')
        .select('property_id')
        .eq('seeker_id', user.id)
        .eq('status', 'accepted')
        .limit(2000),
      supabase
        .from('compatibility_scores')
        .select('property_id')
        .eq('seeker_id', user.id)
        .gte('score', 70)
        .order('score', { ascending: false })
        .limit(500),
    ]);

    missingProfile = !lifestyleCheck.data && !prefsCheck.data;

    acceptedPrivateIds = (acceptedInterests.data || []).map(r => r.property_id);
    const scorePrivateIds = (privateScoreIds.data || []).map(r => r.property_id);
    allowedPrivateIds = Array.from(new Set([...acceptedPrivateIds, ...scorePrivateIds]));
  }

  // ── Match / Recommended: score-driven ranking (avoids loading all scores) ──
  if ((sortBy === 'match' || sortBy === 'recommended') && user && !missingProfile) {
    try {
      return await fetchScoreDrivenPage({
        searchParams,
        user,
        supabase,
        adminSb,
        page,
        pageSize,
        sortBy,
        acceptedPrivateIds,
      });
    } catch (e) {
      console.error('[Properties] score-driven fetch failed, falling back to standard sort:', e?.message || e);
      // Fall through to standard query (newest/price) so the UI stays usable.
    }
  }

  // ── Standard query (all sort modes, including match/recommended) ──────────
  // Privacy is enforced at the DB level here. The match/recommended post-sort
  // runs below after fetch. This is the single source of truth for what a user
  // is allowed to see.
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

  // Privacy gate for non-score sorts:
  // - anon: never show private
  // - authed: show public + own private + a bounded set of eligible private IDs (score>=70 or accepted interest)
  if (user) {
    const baseOr = `privacy_setting.neq.private,listed_by_user_id.eq.${user.id}`;
    if (allowedPrivateIds.length > 0) {
      // Keep this bounded to avoid PostgREST URL length issues with UUID lists
      const safeIds = allowedPrivateIds.slice(0, 120).join(',');
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

  // ── Sort + Keyset pagination ──────────────────────────────────────────────
  // For standard sorts we use cursor-based keyset pagination to avoid
  // O(offset) work and prevent duplicate/missing rows across pages.
  // Fallback: if no cursor is supplied, use offset for backward-compat.
  const cursor = cursorRaw ? decodeCursor(cursorRaw) : null;

  switch (sortBy) {
    case 'price_low': {
      query = query
        .order('price_per_month', { ascending: true })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (cursor?.price != null && cursor?.id) {
        // After (price DESC, id DESC): price > cursor OR (price = cursor AND id < cursor.id)
        query = query.or(
          `price_per_month.gt.${cursor.price},and(price_per_month.eq.${cursor.price},id.lt.${cursor.id})`
        );
      } else {
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }
      break;
    }
    case 'price_high': {
      query = query
        .order('price_per_month', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (cursor?.price != null && cursor?.id) {
        query = query.or(
          `price_per_month.lt.${cursor.price},and(price_per_month.eq.${cursor.price},id.lt.${cursor.id})`
        );
      } else {
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }
      break;
    }
    default: {
      // newest (default)
      query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
      if (cursor?.createdAt && cursor?.id) {
        query = query.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        );
      } else {
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }
    }
  }

  // Fetch one extra row so we know whether there's a next page
  const isKeyset = !!cursor;
  if (isKeyset) query = query.limit(pageSize + 1);

  const { data, error, count } = await query;
  if (error) { console.error('[DB] Error:', error); throw error; }

  const rows = data || [];
  const hasMore = isKeyset ? rows.length > pageSize : ((page - 1) * pageSize + pageSize) < (count || 0);
  const pageRows = isKeyset ? rows.slice(0, pageSize) : rows;

  // Build next cursor from the last row in the current page
  let nextCursor = null;
  if (hasMore && pageRows.length > 0) {
    const last = pageRows[pageRows.length - 1];
    if (sortBy === 'price_low' || sortBy === 'price_high') {
      nextCursor = encodeCursor({ price: last.price_per_month, id: last.id });
    } else {
      nextCursor = encodeCursor({ createdAt: last.created_at, id: last.id });
    }
  }

  const ids = pageRows.map(p => p.id);
  const { interests, scoreMap } = await fetchPerPageUserContext(supabase, user, ids);

  const transformed = pageRows.map(p =>
    transformProperty(p, interests, scoreMap, user, missingProfile, supabase)
  );

  return {
    data: transformed,
    pagination: {
      page,
      pageSize,
      total:      isKeyset ? null : count,
      hasMore,
      nextCursor,
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

  const visibility = isPrivate ? 'private' : 'public';
  const contactGate =
    missingProfile || matchScore === null
      ? 'profile_required'
      : (visibility === 'private' || matchScore <= 50)
        ? 'interest_required'
        : 'direct';
  const contactAllowed =
    isOwner || contactGate === 'direct' || interest?.status === 'accepted';

  if (maskHost) {
    const parts      = hostName.split(' ');
    const maskedName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : hostName;
    return {
      ...base,
      visibility,
      isOwner,
      title:       `Room in ${property.city}`,
      location:    `${property.city}, ${property.state}`,
      priceRange:  `€${Math.floor(property.price_per_month / 100) * 100}–${Math.ceil(property.price_per_month / 100) * 100}`,
      image,
      isBlurry:    true,
      contactGate,
      contactAllowed,
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
    visibility,
    isOwner,
    title:       property.title,
    location:    `${property.city}, ${property.state}`,
    image,
    images,
    contactGate,
    contactAllowed,
    amenities:   (property.amenities || []).map(a => ({ icon: 'FaWifi', label: a })),
    verified:    !!(property.users?.is_verified),
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

async function fetchPerPageUserContext(supabase, user, propertyIds) {
  if (!user || !propertyIds?.length) return { interests: [], scoreMap: {} };

  const [interestData, scoreData] = await Promise.all([
    supabase
      .from('property_interests')
      .select('property_id, status')
      .eq('seeker_id', user.id)
      .in('property_id', propertyIds),
    supabase
      .from('compatibility_scores')
      .select('property_id, score')
      .eq('seeker_id', user.id)
      .in('property_id', propertyIds),
  ]);

  const interests = interestData.data || [];
  const scores = scoreData.data || [];
  const scoreMap = {};
  scores.forEach(s => { scoreMap[s.property_id] = s.score; });

  return { interests, scoreMap };
}

async function fetchScoreDrivenPage({ searchParams, user, supabase, adminSb, page, pageSize, sortBy, acceptedPrivateIds }) {
  const offset = (page - 1) * pageSize;
  const needed = offset + pageSize;

  // Pull compatibility scores in descending order, then fetch properties in batches and apply filters.
  // Keep batches small: UUID `in(...)` lists can exceed PostgREST URL limits.
  const BATCH = 120;
  const MAX_SCORE_SCAN = 5000;
  let scoreOffset = 0;
  let collected = [];
  let hasMoreScores = true;

  // Pre-parse filters once
  const filters = parsePropertyFilters(searchParams);

  while (collected.length < needed && hasMoreScores && scoreOffset < MAX_SCORE_SCAN) {
    const { data: scoreRows, error } = await supabase
      .from('compatibility_scores')
      .select('property_id, score')
      .eq('seeker_id', user.id)
      .order('score', { ascending: false })
      .range(scoreOffset, scoreOffset + BATCH - 1);

    if (error) throw error;
    if (!scoreRows || scoreRows.length === 0) {
      hasMoreScores = false;
      break;
    }

    const ids = scoreRows.map(r => r.property_id);
    let query = adminSb
      .from('properties')
      .select(`
        *,
        property_media (id, url, media_type, display_order, is_primary),
        users!listed_by_user_id (id, full_name, profile_picture)
      `)
      .in('id', ids)
      .eq('is_active', true)
      .eq('approval_status', 'approved');

    query = applyPropertyFilters(query, filters);

    const { data: props, error: pErr } = await query;
    if (pErr) throw pErr;

    // Map for fast lookup
    const propMap = new Map((props || []).map(p => [p.id, p]));

    // Interest statuses only for returned IDs
    const { interests, scoreMap } = await fetchPerPageUserContext(supabase, user, ids);

    for (const row of scoreRows) {
      const prop = propMap.get(row.property_id);
      if (!prop) continue;

      // Private eligibility: accept if score>=70 OR accepted interest OR owner
      const isPrivate = prop.privacy_setting === 'private';
      const isOwner = prop.listed_by_user_id === user.id;
      const isAccepted = acceptedPrivateIds.includes(prop.id) || interests.some(i => i.property_id === prop.id && i.status === 'accepted');
      if (isPrivate && !isOwner && !isAccepted && (typeof row.score !== 'number' || row.score < 70)) {
        continue;
      }

      // Record score for transformer
      scoreMap[prop.id] = row.score;

      collected.push(transformProperty(prop, interests, scoreMap, user, false, supabase));
      if (collected.length >= needed) break;
    }

    scoreOffset += BATCH;
    if (scoreRows.length < BATCH) hasMoreScores = false;
  }

  // If we hit the scan cap, don't claim there are more pages (prevents infinite empty paging).
  if (scoreOffset >= MAX_SCORE_SCAN) hasMoreScores = false;

  // Re-rank for recommended by blending freshness + quality into the collected window.
  // Formula (locked): recommended = 0.70*match + 0.20*freshness + 0.10*quality
  //   freshness: linear decay over ~30 days (strong boost first 7d, near-zero at 30d)
  //   quality:   0–100 bounded; photos present (+50) + verified host (+50)
  if (sortBy === 'recommended') {
    const now = new Date();
    collected = collected
      .map(item => {
        const ageHours = Math.max(0, (now - new Date(item.createdAt)) / 36e5);
        // 100 at 0h → ~0 at 720h (30 days), steeper first 7d
        const freshness = Math.max(0, 100 - ageHours / 7.2);
        const match   = typeof item.matchScore === 'number' ? item.matchScore : 0;
        // Quality: bounded so it can't overpower match
        const hasPhotos = Array.isArray(item.images) && item.images.length > 0;
        const quality  = (hasPhotos ? 50 : 0) + (item.verified ? 50 : 0); // 0 | 50 | 100
        const recScore = (match * 0.70) + (freshness * 0.20) + (quality * 0.10);
        return { ...item, _recScore: recScore };
      })
      .sort((a, b) => (b._recScore - a._recScore) || (b.matchScore - a.matchScore));
  }

  const pageItems = collected.slice(offset, offset + pageSize).map(({ _recScore, ...rest }) => rest);

  return {
    data: pageItems,
    pagination: {
      page,
      pageSize,
      total: null,
      // If we couldn't fill this page, there is no next page of results for this query.
      hasMore: pageItems.length === pageSize && hasMoreScores,
    },
  };
}

function parsePropertyFilters(searchParams) {
  return {
    priceRange: searchParams.get('priceRange'),
    minPrice: parseInt(searchParams.get('minPrice') || ''),
    maxPrice: parseInt(searchParams.get('maxPrice') || ''),
    bedrooms: searchParams.get('bedrooms')?.split(',').map(Number).filter(Boolean),
    propertyType: searchParams.get('propertyType'),
    propertyTypes: searchParams.get('propertyTypes')?.split(',').map(v => v.trim()).filter(Boolean),
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean),
    minBedrooms: parseInt(searchParams.get('minBedrooms')),
    minBathrooms: parseInt(searchParams.get('minBathrooms')),
    location: searchParams.get('location'),
    search: searchParams.get('search'),
    moveInDate: searchParams.get('moveInDate'),
    roomType: searchParams.get('roomType'),
    houseRules: searchParams.get('houseRules')?.split(',').filter(Boolean),
    billsIncluded: searchParams.get('billsIncluded') === 'true',
  };
}

function applyPropertyFilters(query, f) {
  // Price filters
  if (!Number.isNaN(f.minPrice)) query = query.gte('price_per_month', f.minPrice);
  if (!Number.isNaN(f.maxPrice)) query = query.lte('price_per_month', f.maxPrice);
  if (f.priceRange && f.priceRange !== 'all') {
    const ranges = { budget: [0, 800], mid: [800, 1500], premium: [1500, 999999] };
    const r = ranges[f.priceRange];
    if (r) query = query.gte('price_per_month', r[0]).lte('price_per_month', r[1]);
  }

  // Bedroom / bathroom filters
  if (f.bedrooms?.length > 0) query = query.in('bedrooms', f.bedrooms);
  if (f.minBedrooms) query = query.gte('bedrooms', f.minBedrooms);
  if (f.minBathrooms) query = query.gte('bathrooms', f.minBathrooms);

  // Property type
  if (f.propertyTypes?.length > 0) query = query.in('property_type', f.propertyTypes);
  else if (f.propertyType && f.propertyType !== 'any') query = query.eq('property_type', f.propertyType);

  // Text search
  if (f.location) query = query.or(`city.ilike.*${f.location}*,state.ilike.*${f.location}*,street.ilike.*${f.location}*`);
  if (f.search) query = query.or(`title.ilike.*${f.search}*,description.ilike.*${f.search}*,city.ilike.*${f.search}*,state.ilike.*${f.search}*,street.ilike.*${f.search}*`);

  // Advanced filters
  if (f.amenities?.length > 0) query = query.contains('amenities', f.amenities);
  if (f.roomType) query = query.eq('room_type', f.roomType);
  if (f.billsIncluded) query = query.or('bills_included.eq.true,bills_option.eq.all');
  if (f.houseRules?.length > 0) query = query.contains('house_rules', f.houseRules);

  // Move-in date
  if (f.moveInDate && f.moveInDate !== 'any') {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (f.moveInDate === 'immediately') {
      query = query.lte('available_from', today);
    } else if (f.moveInDate === 'this_month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      query = query.lte('available_from', endOfMonth.toISOString().split('T')[0]);
    } else if (f.moveInDate === 'next_month') {
      const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      query = query
        .gte('available_from', start.toISOString().split('T')[0])
        .lte('available_from', end.toISOString().split('T')[0]);
    }
  }

  return query;
}
