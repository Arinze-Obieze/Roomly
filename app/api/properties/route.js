import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { cachedFetch, getCachedInt } from '@/core/utils/redis';
import { handleCreateProperty } from '@/core/services/properties/create-property.service';
import crypto from 'crypto';
import { sanitizeLength, sanitizeText } from '@/core/utils/sanitizers';
import {
  canSeePrivateListing,
  getPropertyContactState,
  isPrivateListing,
  shouldMaskPrivateListing,
} from '@/core/services/matching/rules/property-visibility';
import { getMatchConfidenceState } from '@/core/services/matching/presentation/match-confidence';
import { buildPropertyMatchReasons } from '@/core/services/matching/presentation/match-explanations';
import { computeRecommendedScore } from '@/core/services/matching/scoring/recommended-score';
import { comparePropertyRanking } from '@/core/services/matching/ranking/shared-order';
import {
  getPropertyListCacheTtl,
  shouldUsePropertyListCache,
} from '@/core/services/matching/property-list-cache-strategy';
import {
  getPrecomputedPropertyIds,
  hasActivePropertyFilters,
} from '@/core/services/matching/precompute/property-feed-shortlist';
import { propertyMatchConfidence } from '@/lib/matching/propertyMatchScore';

export const runtime       = 'nodejs';
export const bodySizeLimit = '20mb';
const MIN_TEXT_FILTER_LENGTH = 2;
const PERSONALIZED_SORTS = new Set(['match', 'recommended']);
const PROPERTY_LIST_SELECT = `
  id,
  title,
  description,
  city,
  state,
  street,
  price_per_month,
  bedrooms,
  bathrooms,
  bills_option,
  couples_allowed,
  property_type,
  offering_type,
  privacy_setting,
  listed_by_user_id,
  available_from,
  created_at,
  amenities,
  property_media (id, url, media_type, display_order, is_primary),
  users!listed_by_user_id (id, full_name, profile_picture, is_verified, gender, date_of_birth)
`;

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
    const sortBy = searchParams.get('sortBy');

    // noStore=1 is set by the client when it calls refresh() to bypass Redis
    const skipCache = searchParams.get('noStore') === '1';

    const versions = {
      global: await getCachedInt('v:properties:global', 1),
      user: user?.id ? await getCachedInt(`v:properties:user:${user.id}`, 1) : 0,
    };
    const cacheKey = generateCacheKey(searchParams, user?.id, versions);

    const shouldUseRedisCache = shouldUsePropertyListCache({
      hasUser: !!user,
      sortBy,
      skipCache,
    });
    const cacheTtlSeconds = getPropertyListCacheTtl({ hasUser: !!user });
    const data = shouldUseRedisCache
      ? await cachedFetch(cacheKey, cacheTtlSeconds, () => fetchPropertiesFromDB(searchParams, user))
      : await fetchPropertiesFromDB(searchParams, user);

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

function isMissingMatchProfile(lifestyle, preferences) {
  return !lifestyle && !preferences;
}

function sanitizeOrTerm(value) {
  if (!value) return '';
  const cleaned = sanitizeLength(sanitizeText(String(value)), 80)
    .replace(/[*(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.replace(/[^a-zA-Z0-9\s.'-]/g, '').trim();
}

function normalizeTextFilter(value) {
  const sanitized = sanitizeOrTerm(value);
  return sanitized.length >= MIN_TEXT_FILTER_LENGTH ? sanitized : '';
}

async function fetchPropertiesFromDB(searchParams, user) {
  const page      = Math.max(1, parseInt(searchParams.get('page')     || '1'));
  const pageSize  = Math.min(50, parseInt(searchParams.get('pageSize')|| '12')); // cap at 50
  const sortBy    = searchParams.get('sortBy');
  const cursorRaw = searchParams.get('cursor');
  const cursor    = cursorRaw ? decodeCursor(cursorRaw) : null;

  const supabase = await createClient();
  const adminSb  = createAdminClient();

  // ── Pre-fetch user context (bounded, no O(N) scans) ─────────────────────
  let missingProfile = false;
  let allowedPrivateIds = [];
  let acceptedPrivateIds = [];
  let seekerContext = {
    lifestyle: null,
    preferences: null,
    userMeta: {},
  };

  if (user) {
    const shouldPrefetchPrivateScoreIds = !['match', 'recommended'].includes(sortBy);
    const [lifestyleCheck, prefsCheck, acceptedInterests, privateScoreIds, userMeta] = await Promise.all([
      supabase.from('user_lifestyles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('match_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('property_interests')
        .select('property_id')
        .eq('seeker_id', user.id)
        .eq('status', 'accepted')
        .limit(2000),
      shouldPrefetchPrivateScoreIds
        ? supabase
          .from('compatibility_scores')
          .select('property_id')
          .eq('seeker_id', user.id)
          .gte('score', 70)
          .order('score', { ascending: false })
          .limit(2000)
        : Promise.resolve({ data: [] }),
      supabase
        .from('users')
        .select('id, gender, date_of_birth')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    seekerContext = {
      lifestyle: lifestyleCheck.data || null,
      preferences: prefsCheck.data || null,
      userMeta: userMeta.data || {},
    };
    missingProfile = isMissingMatchProfile(seekerContext.lifestyle, seekerContext.preferences);

    acceptedPrivateIds = (acceptedInterests.data || []).map(r => r.property_id);
    const scorePrivateIds = (privateScoreIds.data || []).map(r => r.property_id);
    allowedPrivateIds = Array.from(new Set([...acceptedPrivateIds, ...scorePrivateIds]));
  }

  const filters = parsePropertyFilters(searchParams);

  if (user && PERSONALIZED_SORTS.has(sortBy)) {
    return fetchScoreDrivenPage({
      user,
      supabase,
      adminSb,
      page,
      pageSize,
      sortBy,
      cursor,
      filters,
      missingProfile,
      acceptedPrivateIds,
      seekerContext,
    });
  }

  // ── Standard query (all sort modes, including match/recommended) ──────────
  // Privacy is enforced at the DB level here. The match/recommended post-sort
  // runs below after fetch. This is the single source of truth for what a user
  // is allowed to see.
  const shouldCount = page > 1 && !cursor;
  const selectOptions = shouldCount ? { count: 'estimated' } : {};

  let query = buildVisiblePropertiesQuery(adminSb, user, allowedPrivateIds, selectOptions);
  query = applyPropertyFilters(query, filters);

  // ── Sort + Keyset pagination ──────────────────────────────────────────────
  // For standard sorts we use cursor-based keyset pagination to avoid
  // O(offset) work and prevent duplicate/missing rows across pages.
  // Fallback: if no cursor is supplied, use offset for backward-compat.
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
      } else if (page > 1) {
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
      } else if (page > 1) {
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
      } else if (page > 1) {
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }
    }
  }

  // Fetch one extra row so we know whether there's a next page
  const isKeyset = !!cursor || page === 1;
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
    transformProperty(p, interests, scoreMap, user, missingProfile, supabase, seekerContext)
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
function transformProperty(property, interests, scoreMap, user, missingProfile, supabase, seekerContext = {}) {
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
  const isPrivate  = isPrivateListing(property);
  const isOwner    = user && property.listed_by_user_id === user.id;
  const hasAcceptedInterest = interest?.status === 'accepted';
  const maskHost   = shouldMaskPrivateListing({ isPrivate, isOwner, hasAcceptedInterest });

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
    compatibilityScore: matchScore,
    missingProfile,
    interestStatus:   interest?.status || null,
    availableFrom:    property.available_from,
    createdAt:        property.created_at,
  };

  const matchConfidence = user && !isOwner && matchScore != null
    ? propertyMatchConfidence(
      property,
      seekerContext.lifestyle || null,
      seekerContext.preferences || null,
      seekerContext.userMeta || {},
      null,
      property.users || {}
    )
    : null;
  const matchConfidenceState = matchConfidence != null
    ? getMatchConfidenceState(matchConfidence)
    : null;
  const matchReasons = user && !isOwner && matchScore != null
    ? buildPropertyMatchReasons({
      property,
      seekerLifestyle: seekerContext.lifestyle || null,
      seekerPrefs: seekerContext.preferences || null,
    })
    : [];

  const { visibility, contactGate, contactAllowed } = getPropertyContactState({
    property,
    isOwner,
    hasAcceptedInterest,
    matchScore,
    missingProfile,
  });

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
      matchConfidence,
      confidenceScore: matchConfidence,
      matchConfidenceState: matchConfidenceState?.state || null,
      matchConfidenceLabel: matchConfidenceState?.label || null,
      matchReasons,
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
    matchConfidence,
    confidenceScore: matchConfidence,
    matchConfidenceState: matchConfidenceState?.state || null,
    matchConfidenceLabel: matchConfidenceState?.label || null,
    matchReasons,
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

function buildVisiblePropertiesQuery(adminSb, user, allowedPrivateIds = [], selectOptions = {}) {
  let query = adminSb
    .from('properties')
    .select(PROPERTY_LIST_SELECT, selectOptions)
    .eq('is_active', true)
    .eq('approval_status', 'approved');

  // Keep the visibility rule identical across all code paths so "recommended"
  // can change ranking without changing which public listings are discoverable.
  if (user) {
    const baseOr = `privacy_setting.neq.private,listed_by_user_id.eq.${user.id}`;
    if (allowedPrivateIds.length > 0) {
      // Build a single .or() so PostgREST treats it as one OR clause.
      // Chaining multiple .or() calls ANDs them together — which would break
      // public listing visibility. We still guard URL length, but the previous
      // budget was so small that many 70%+ private matches were silently dropped.
      // This higher cap preserves far more eligible private IDs without changing
      // the query semantics.
      const CHAR_BUDGET = 24000;
      const safeIds = [];
      let charCount = 0;
      for (const id of allowedPrivateIds) {
        if (charCount + id.length + 1 > CHAR_BUDGET) break;
        safeIds.push(id);
        charCount += id.length + 1;
      }
      query = query.or(`${baseOr},id.in.(${safeIds.join(',')})`);
    } else {
      query = query.or(baseOr);
    }
  } else {
    query = query.neq('privacy_setting', 'private');
  }

  return query;
}

function rankMatchWindow(items) {
  return [...items].sort((a, b) => {
    const aScore = typeof a.matchScore === 'number' ? a.matchScore : -1;
    const bScore = typeof b.matchScore === 'number' ? b.matchScore : -1;
    return bScore - aScore || (new Date(b.createdAt) - new Date(a.createdAt));
  });
}

function compareRankedItems(a, b, sortBy) {
  return comparePropertyRanking(a, b, sortBy);
}

function buildPersonalizedCursor(item, sortBy) {
  if (!item) return null;
  if (sortBy === 'recommended') {
    return {
      recScore: item._recScore ?? null,
      matchScore: item.matchScore ?? null,
      createdAt: item.createdAt,
      id: item.id,
    };
  }

  return {
    matchScore: item.matchScore ?? null,
    createdAt: item.createdAt,
    id: item.id,
  };
}

function isRankedAfterCursor(item, cursor, sortBy) {
  if (!cursor) return true;
  const cursorItem = {
    id: cursor.id,
    createdAt: cursor.createdAt,
    matchScore: cursor.matchScore ?? null,
    _recScore: cursor.recScore ?? null,
  };
  return compareRankedItems(item, cursorItem, sortBy) > 0;
}

function stripRankingMeta(items) {
  return items.map(({ _recScore, ...rest }) => rest);
}

async function fetchScoreDrivenPage({ user, supabase, adminSb, page, pageSize, sortBy, cursor, filters, missingProfile, acceptedPrivateIds, seekerContext }) {
  if (!cursor && page === 1 && !hasActivePropertyFilters(filters)) {
    const precomputed = await fetchPrecomputedScoreDrivenPage({
      user,
      supabase,
      adminSb,
      pageSize,
      sortBy,
      missingProfile,
      acceptedPrivateIds,
      seekerContext,
    });

    if (precomputed) {
      return precomputed;
    }
  }

  const acceptedPrivateIdSet = new Set(acceptedPrivateIds || []);
  const seenIds = new Set();
  const collected = [];
  const now = new Date();
  const BATCH = 120;
  const MAX_SCORE_SCAN = 2400;
  const targetCandidateCount = Math.min(
    Math.max(pageSize * (sortBy === 'recommended' ? 8 : 4), pageSize + 1),
    160
  );
  let scoreOffset = 0;
  let exhaustedScores = false;

  while (!exhaustedScores && scoreOffset < MAX_SCORE_SCAN) {
    const { data: scoreRows, error } = await supabase
      .from('compatibility_scores')
      .select('property_id, score')
      .eq('seeker_id', user.id)
      .order('score', { ascending: false })
      .range(scoreOffset, scoreOffset + BATCH - 1);

    if (error) throw error;
    if (!scoreRows || scoreRows.length === 0) {
      exhaustedScores = true;
      break;
    }

    const ids = scoreRows.map(r => r.property_id);
    let query = adminSb
      .from('properties')
      .select(PROPERTY_LIST_SELECT)
      .in('id', ids)
      .eq('is_active', true)
      .eq('approval_status', 'approved');

    query = applyPropertyFilters(query, filters);

    const { data: props, error: pErr } = await query;
    if (pErr) throw pErr;

    // Map for fast lookup
    const propMap = new Map((props || []).map(p => [p.id, p]));

    const visibleIds = ids.filter(id => propMap.has(id));
    const { interests } = await fetchPerPageUserContext(supabase, user, visibleIds);

    for (const row of scoreRows) {
      const prop = propMap.get(row.property_id);
      if (!prop || seenIds.has(prop.id)) continue;

      // Private eligibility: accept if score>=70 OR accepted interest OR owner
      const isPrivate = isPrivateListing(prop);
      const isOwner = prop.listed_by_user_id === user.id;
      const isAccepted = acceptedPrivateIdSet.has(prop.id)
        || interests.some(i => i.property_id === prop.id && i.status === 'accepted');
      if (!canSeePrivateListing({
        isPrivate,
        isOwner,
        hasAcceptedInterest: isAccepted,
        matchScore: row.score,
      })) {
        continue;
      }

      const transformed = transformProperty(prop, interests, { [prop.id]: row.score }, user, missingProfile, supabase, seekerContext);
      if (sortBy === 'recommended') {
        transformed._recScore = computeRecommendedScore(transformed, now);
      }

      collected.push(transformed);
      seenIds.add(prop.id);
    }

    const rankedPreview = [...collected].sort((a, b) => compareRankedItems(a, b, sortBy));
    const filteredPreview = cursor
      ? rankedPreview.filter(item => isRankedAfterCursor(item, cursor, sortBy))
      : rankedPreview;

    if (filteredPreview.length > pageSize && collected.length >= targetCandidateCount) {
      break;
    }

    scoreOffset += BATCH;
    if (scoreRows.length < BATCH) exhaustedScores = true;
  }

  // Backfill with otherwise-visible listings so public properties stay visible
  // even when a user's compatibility rows are incomplete.
  const fallbackLimit = Math.min(Math.max(targetCandidateCount, pageSize * 4), 160);
  if (collected.length < targetCandidateCount) {
    const fallbackQuery = applyPropertyFilters(
      buildVisiblePropertiesQuery(adminSb, user, []),
      filters
    )
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(fallbackLimit);

    const { data: fallbackProps, error: fallbackError } = await fallbackQuery;
    if (fallbackError) throw fallbackError;

    const missingProps = (fallbackProps || []).filter(prop => !seenIds.has(prop.id));
    if (missingProps.length > 0) {
      const missingIds = missingProps.map(prop => prop.id);
      const { interests, scoreMap } = await fetchPerPageUserContext(supabase, user, missingIds);
      for (const prop of missingProps) {
        const transformed = transformProperty(prop, interests, scoreMap, user, missingProfile, supabase, seekerContext);
        if (sortBy === 'recommended') {
          transformed._recScore = computeRecommendedScore(transformed, now);
        }
        collected.push(transformed);
        seenIds.add(prop.id);
      }
    }
  }

  const ranked = [...collected].sort((a, b) => compareRankedItems(a, b, sortBy));
  const filtered = cursor ? ranked.filter(item => isRankedAfterCursor(item, cursor, sortBy)) : ranked;
  const pageItems = filtered.slice(0, pageSize);
  const hasMore = filtered.length > pageSize;
  const nextCursor = hasMore ? encodeCursor(buildPersonalizedCursor(pageItems[pageItems.length - 1], sortBy)) : null;

  return {
    data: stripRankingMeta(pageItems),
    pagination: {
      page,
      pageSize,
      total: null,
      hasMore,
      nextCursor,
    },
  };
}

async function fetchPrecomputedScoreDrivenPage({ user, supabase, adminSb, pageSize, sortBy, missingProfile, acceptedPrivateIds, seekerContext }) {
  const ids = await getPrecomputedPropertyIds(user.id, sortBy, 1, pageSize + 1);
  if (!ids.length) return null;

  const { data: props, error: propsError } = await adminSb
    .from('properties')
    .select(PROPERTY_LIST_SELECT)
    .in('id', ids)
    .eq('is_active', true)
    .eq('approval_status', 'approved');

  if (propsError) throw propsError;
  if (!props?.length) return null;

  const propMap = new Map(props.map((prop) => [prop.id, prop]));
  const orderedProps = ids.map((id) => propMap.get(id)).filter(Boolean);
  const visibleIds = orderedProps.map((prop) => prop.id);
  const [{ interests, scoreMap }] = await Promise.all([
    fetchPerPageUserContext(supabase, user, visibleIds),
  ]);
  const acceptedPrivateIdSet = new Set(acceptedPrivateIds || []);
  const now = new Date();

  const transformed = orderedProps
    .map((prop) => {
      const score = scoreMap[prop.id] ?? null;
      const isPrivate = isPrivateListing(prop);
      const isOwner = prop.listed_by_user_id === user.id;
      const isAccepted = acceptedPrivateIdSet.has(prop.id)
        || interests.some((interest) => interest.property_id === prop.id && interest.status === 'accepted');

      if (!canSeePrivateListing({
        isPrivate,
        isOwner,
        hasAcceptedInterest: isAccepted,
        matchScore: score,
      })) {
        return null;
      }

      const item = transformProperty(prop, interests, scoreMap, user, missingProfile, supabase, seekerContext);
      if (sortBy === 'recommended') {
        item._recScore = computeRecommendedScore(item, now);
      }
      return item;
    })
    .filter(Boolean);

  if (transformed.length < pageSize) return null;

  const pageItems = transformed.slice(0, pageSize);
  const hasMore = transformed.length > pageSize;
  const nextCursor = hasMore
    ? encodeCursor(buildPersonalizedCursor(pageItems[pageItems.length - 1], sortBy))
    : null;

  return {
    data: stripRankingMeta(pageItems),
    pagination: {
      page: 1,
      pageSize,
      total: null,
      hasMore,
      nextCursor,
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
    location: normalizeTextFilter(searchParams.get('location')),
    search: normalizeTextFilter(searchParams.get('search')),
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
