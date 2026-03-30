import { callRedis } from '../../../utils/redis.js';

function isMeaningfulValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return value;
  return true;
}

export function hasActivePropertyFilters(filters = {}) {
  return Object.values(filters).some((value) => isMeaningfulValue(value));
}

export async function getPrecomputedPropertyIds(userId, sortBy, page = 1, pageSize = 12) {
  if (!userId || !['match', 'recommended'].includes(sortBy)) return [];
  if (page < 1 || pageSize < 1) return [];

  const key = resolvePropertyFeedKey(userId, sortBy);
  const start = (page - 1) * pageSize;
  const stop = start + pageSize - 1;
  const result = await callRedis('ZREVRANGE', key, String(start), String(stop));
  return Array.isArray(result) ? result.filter(Boolean) : [];
}

export async function getPrecomputedPropertyRank(userId, sortBy, propertyId) {
  if (!userId || !propertyId || !['match', 'recommended'].includes(sortBy)) return null;

  const result = await callRedis('ZREVRANK', resolvePropertyFeedKey(userId, sortBy), String(propertyId));
  const rank = Number(result);
  return Number.isFinite(rank) ? rank : null;
}

export async function getPrecomputedPropertyWindow(userId, sortBy, start = 0, pageSize = 12) {
  if (!userId || !['match', 'recommended'].includes(sortBy)) return [];
  if (start < 0 || pageSize < 1) return [];

  const key = sortBy === 'recommended'
    ? `feed:recommended:${userId}`
    : `feed:match:${userId}`;
  const stop = start + pageSize - 1;
  const result = await callRedis('ZREVRANGE', key, String(start), String(stop));
  return Array.isArray(result) ? result.filter(Boolean) : [];
}

function resolvePropertyFeedKey(userId, sortBy) {
  return sortBy === 'recommended'
    ? `feed:recommended:${userId}`
    : `feed:match:${userId}`;
}
