import { callRedis } from '../../../utils/redis.js';
import { fetchAllPages, fetchBatchesByIds } from '../discovery/query-utils.js';

const HOST_SHORTLIST_TTL_SECONDS = 1800;
const SEEKER_SHORTLIST_TTL_SECONDS = 1800;

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
  return getHostFindPeopleShortlistWindow(userId, start, pageSize);
}

export async function getHostFindPeopleShortlistWindow(userId, start = 0, pageSize = 24) {
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
  return getSeekerFindLandlordsShortlistWindow(userId, start, pageSize);
}

export async function getSeekerFindLandlordsShortlistWindow(userId, start = 0, pageSize = 24) {
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
      .eq('approval_status', 'approved');

  if (listingsError) throw listingsError;
  if (!approvedListings?.length) {
    await callRedis('DEL', key);
    return false;
  }

  const [scoreRows, acceptedRows] = await Promise.all([
    fetchAllPages((offset, pageSize) =>
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
      .range(offset, offset + pageSize - 1)
    ),
    fetchAllPages((offset, pageSize) =>
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
      .range(offset, offset + pageSize - 1)
    ),
  ]);

  const bestBySeeker = new Map();
  const acceptedKeys = new Set(
    (acceptedRows || []).map((row) => `${row.seeker_id}:${row.property_id}`)
  );

  for (const row of scoreRows || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    const score = Number(row?.score);
    if (!seekerId || !propertyId || !Number.isFinite(score)) continue;

    const current = bestBySeeker.get(seekerId);
    const accepted = acceptedKeys.has(`${seekerId}:${propertyId}`);
    if (!current || score > current.score) {
      bestBySeeker.set(seekerId, {
        propertyId,
        score,
        accepted: accepted || !!current?.accepted,
      });
    } else if (accepted && !current.accepted) {
      current.accepted = true;
    }
  }

  for (const row of acceptedRows || []) {
    const seekerId = row?.seeker_id;
    const propertyId = row?.property_id;
    if (!seekerId || !propertyId) continue;
    if (!bestBySeeker.has(seekerId)) {
      bestBySeeker.set(seekerId, { propertyId, score: 0, accepted: true });
    } else {
      bestBySeeker.get(seekerId).accepted = true;
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
  const [scoreRows, acceptedRows] = await Promise.all([
    fetchAllPages((offset, pageSize) =>
      adminSb
      .from('compatibility_scores')
      .select('property_id, score')
      .eq('seeker_id', seekerId)
      .order('score', { ascending: false })
      .range(offset, offset + pageSize - 1)
    ),
    fetchAllPages((offset, pageSize) =>
      adminSb
      .from('property_interests')
      .select(`
        property_id,
        property:properties!inner(id, listed_by_user_id, is_active, approval_status)
      `)
      .eq('seeker_id', seekerId)
      .eq('status', 'accepted')
      .range(offset, offset + pageSize - 1)
    ),
  ]);

  const propertyIds = (scoreRows || []).map((row) => row.property_id).filter(Boolean);
  const properties = propertyIds.length > 0
    ? await fetchBatchesByIds(propertyIds, (batch) =>
      adminSb
        .from('properties')
        .select('id, listed_by_user_id, is_active, approval_status')
        .in('id', batch)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
    )
    : [];

  const propertyById = new Map((properties || []).map((row) => [row.id, row]));
  const bestByLandlord = new Map();
  const acceptedPropertyIds = new Set(
    (acceptedRows || []).map((row) => {
      const property = Array.isArray(row?.property) ? row.property[0] : row?.property;
      return property?.id || row?.property_id;
    }).filter(Boolean)
  );

  for (const row of scoreRows || []) {
    const property = propertyById.get(row?.property_id);
    const landlordId = property?.listed_by_user_id;
    const score = Number(row?.score);
    if (!property?.id || !landlordId || !Number.isFinite(score)) continue;

    const current = bestByLandlord.get(landlordId);
    if (!current || score > current.score) {
      bestByLandlord.set(landlordId, {
        propertyId: property.id,
        score,
        accepted: !!current?.accepted,
      });
    }
    if (acceptedPropertyIds.has(property.id) && bestByLandlord.has(landlordId)) {
      bestByLandlord.get(landlordId).accepted = true;
    }
  }

  for (const row of acceptedRows || []) {
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
    } else {
      bestByLandlord.get(landlordId).accepted = true;
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
