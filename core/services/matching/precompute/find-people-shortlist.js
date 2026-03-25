import { callRedis } from '../../../utils/redis.js';

const HOST_SHORTLIST_TTL_SECONDS = 1800;
const SEEKER_SHORTLIST_TTL_SECONDS = 1800;
const HOST_MAX_CANDIDATES = 1000;
const SEEKER_MAX_CANDIDATES = 1000;

function encodeShortlistMember(primaryId, propertyId, accepted = false) {
  if (!primaryId || !propertyId) return null;
  return `${primaryId}:${propertyId}:${accepted ? '1' : '0'}`;
}

export function decodeShortlistMember(member) {
  if (!member) return null;
  const [primaryId, propertyId, acceptedFlag = '0'] = String(member).split(':');
  if (!primaryId || !propertyId) return null;
  return {
    primaryId,
    propertyId,
    accepted: acceptedFlag === '1',
  };
}

function normalizeZRangeWithScores(result) {
  if (!Array.isArray(result)) return [];

  const entries = [];
  for (let index = 0; index < result.length; index += 2) {
    const member = result[index];
    const score = Number(result[index + 1]);
    const decoded = decodeShortlistMember(member);
    if (!decoded) continue;
    entries.push({
      ...decoded,
      score: Number.isFinite(score) ? score : 0,
    });
  }
  return entries;
}

function hostShortlistKey(userId) {
  return `find_people:host_candidates:${userId}`;
}

function seekerShortlistKey(userId) {
  return `find_people:seeker_candidates:${userId}`;
}

async function writeShortlist(key, rows, ttlSeconds) {
  await callRedis('DEL', key);
  if (!rows.length) return;

  const args = [];
  for (const row of rows) {
    args.push(String(row.score), row.member);
  }

  await callRedis('ZADD', key, ...args);
  await callRedis('EXPIRE', key, String(ttlSeconds));
}

export async function getHostFindPeopleShortlistPage(userId, page = 1, pageSize = 24) {
  const start = Math.max(0, (page - 1) * pageSize);
  const stop = start + Math.max(0, pageSize) - 1;
  const [rangeResult, totalResult] = await Promise.all([
    callRedis('ZREVRANGE', hostShortlistKey(userId), String(start), String(stop), 'WITHSCORES'),
    callRedis('ZCARD', hostShortlistKey(userId)),
  ]);

  return {
    entries: normalizeZRangeWithScores(rangeResult),
    total: Number(totalResult) || 0,
  };
}

export async function getSeekerFindLandlordsShortlistPage(userId, page = 1, pageSize = 24) {
  const start = Math.max(0, (page - 1) * pageSize);
  const stop = start + Math.max(0, pageSize) - 1;
  const [rangeResult, totalResult] = await Promise.all([
    callRedis('ZREVRANGE', seekerShortlistKey(userId), String(start), String(stop), 'WITHSCORES'),
    callRedis('ZCARD', seekerShortlistKey(userId)),
  ]);

  return {
    entries: normalizeZRangeWithScores(rangeResult),
    total: Number(totalResult) || 0,
  };
}

export async function rebuildHostFindPeopleShortlist(adminSb, landlordId) {
  if (!landlordId) return false;

  const key = hostShortlistKey(landlordId);
  const { data: approvedListings, error: listingsError } = await adminSb
    .from('properties')
    .select('id')
    .eq('listed_by_user_id', landlordId)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .limit(HOST_MAX_CANDIDATES);

  if (listingsError) throw listingsError;
  if (!approvedListings?.length) {
    await callRedis('DEL', key);
    return false;
  }

  const approvedPropertyIds = approvedListings.map((row) => row.id).filter(Boolean);
  const [scoresRes, acceptedRes] = await Promise.all([
    adminSb
      .from('compatibility_scores')
      .select(`
        seeker_id,
        property_id,
        score,
        property:properties!inner(id, listed_by_user_id, is_active, approval_status)
      `)
      .eq('property.listed_by_user_id', landlordId)
      .eq('property.is_active', true)
      .eq('property.approval_status', 'approved')
      .order('score', { ascending: false })
      .limit(HOST_MAX_CANDIDATES),
    adminSb
      .from('property_interests')
      .select(`
        seeker_id,
        property_id,
        property:properties!inner(id, listed_by_user_id, is_active, approval_status)
      `)
      .eq('property.listed_by_user_id', landlordId)
      .eq('property.is_active', true)
      .eq('property.approval_status', 'approved')
      .eq('status', 'accepted')
      .limit(HOST_MAX_CANDIDATES),
  ]);

  if (scoresRes.error) throw scoresRes.error;
  if (acceptedRes.error) throw acceptedRes.error;

  const bestBySeeker = new Map();
  const acceptedKeys = new Set(
    (acceptedRes.data || []).map((row) => `${row.seeker_id}:${row.property_id}`)
  );

  for (const row of scoresRes.data || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    const score = Number(row?.score);
    if (!seekerId || !propertyId || !Number.isFinite(score)) continue;

    const current = bestBySeeker.get(seekerId);
    const accepted = acceptedKeys.has(`${seekerId}:${propertyId}`);
    if (!current || score > current.score) {
      bestBySeeker.set(seekerId, { propertyId, score, accepted });
    }
  }

  for (const row of acceptedRes.data || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    if (!seekerId || !propertyId) continue;
    if (!bestBySeeker.has(seekerId)) {
      bestBySeeker.set(seekerId, { propertyId, score: 0, accepted: true });
    }
  }

  const rows = [...bestBySeeker.entries()]
    .map(([seekerId, value]) => ({
      member: encodeShortlistMember(seekerId, value.propertyId, value.accepted),
      score: value.score,
    }))
    .filter((row) => row.member);

  await writeShortlist(key, rows, HOST_SHORTLIST_TTL_SECONDS);
  return true;
}

export async function rebuildSeekerFindLandlordsShortlist(adminSb, seekerId) {
  if (!seekerId) return false;

  const key = seekerShortlistKey(seekerId);
  const [scoresRes, acceptedRes] = await Promise.all([
    adminSb
      .from('compatibility_scores')
      .select('property_id, score')
      .eq('seeker_id', seekerId)
      .order('score', { ascending: false })
      .limit(SEEKER_MAX_CANDIDATES),
    adminSb
      .from('property_interests')
      .select(`
        property_id,
        property:properties!inner(id, listed_by_user_id, is_active, approval_status)
      `)
      .eq('seeker_id', seekerId)
      .eq('status', 'accepted')
      .limit(SEEKER_MAX_CANDIDATES),
  ]);

  if (scoresRes.error) throw scoresRes.error;
  if (acceptedRes.error) throw acceptedRes.error;

  const propertyIds = (scoresRes.data || []).map((row) => row.property_id).filter(Boolean);
  const { data: properties, error: propertiesError } = propertyIds.length > 0
    ? await adminSb
      .from('properties')
      .select('id, listed_by_user_id, is_active, approval_status')
      .in('id', propertyIds)
      .eq('is_active', true)
      .eq('approval_status', 'approved')
    : { data: [], error: null };

  if (propertiesError) throw propertiesError;

  const propertyById = new Map((properties || []).map((row) => [row.id, row]));
  const bestByLandlord = new Map();

  for (const row of scoresRes.data || []) {
    const property = propertyById.get(row?.property_id);
    const landlordId = property?.listed_by_user_id;
    const score = Number(row?.score);
    if (!property?.id || !landlordId || !Number.isFinite(score)) continue;

    const current = bestByLandlord.get(landlordId);
    if (!current || score > current.score) {
      bestByLandlord.set(landlordId, {
        propertyId: property.id,
        score,
        accepted: false,
      });
    }
  }

  for (const row of acceptedRes.data || []) {
    const property = Array.isArray(row?.property) ? row.property[0] : row?.property;
    const landlordId = property?.listed_by_user_id;
    const propertyId = property?.id || row?.property_id;
    if (!landlordId || !propertyId) continue;

    if (!bestByLandlord.has(landlordId)) {
      bestByLandlord.set(landlordId, {
        propertyId,
        score: 0,
        accepted: true,
      });
    }
  }

  const rows = [...bestByLandlord.entries()]
    .map(([landlordId, value]) => ({
      member: encodeShortlistMember(landlordId, value.propertyId, value.accepted),
      score: value.score,
    }))
    .filter((row) => row.member);

  await writeShortlist(key, rows, SEEKER_SHORTLIST_TTL_SECONDS);
  return true;
}

export async function asyncRebuildFindPeopleShortlistsForProperty(propertyId, adminSb) {
  try {
    const { data: property } = await adminSb
      .from('properties')
      .select('id, listed_by_user_id')
      .eq('id', propertyId)
      .maybeSingle();

    if (!property?.listed_by_user_id) return;

    const [{ data: scoreRows }, { data: acceptedRows }] = await Promise.all([
      adminSb
        .from('compatibility_scores')
        .select('seeker_id')
        .eq('property_id', propertyId)
        .limit(200),
      adminSb
        .from('property_interests')
        .select('seeker_id')
        .eq('property_id', propertyId)
        .eq('status', 'accepted')
        .limit(200),
    ]);

    const seekerIds = [...new Set([
      ...((scoreRows || []).map((row) => row.seeker_id)),
      ...((acceptedRows || []).map((row) => row.seeker_id)),
    ].filter(Boolean))];

    await rebuildHostFindPeopleShortlist(adminSb, property.listed_by_user_id);

    const batchSize = 10;
    for (let index = 0; index < seekerIds.length; index += batchSize) {
      const batch = seekerIds.slice(index, index + batchSize);
      await Promise.all(batch.map((seekerId) => rebuildSeekerFindLandlordsShortlist(adminSb, seekerId)));
    }
  } catch (error) {
    console.error('[asyncRebuildFindPeopleShortlistsForProperty] Failed:', error);
  }
}
