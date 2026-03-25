const PERSONALIZED_SORTS = new Set(['match', 'recommended']);
const ANON_PROPERTIES_CACHE_TTL = 300;
const AUTH_STANDARD_PROPERTIES_CACHE_TTL = 60;

export function shouldUsePropertyListCache({ hasUser = false, sortBy = null, skipCache = false } = {}) {
  const isPersonalizedRequest = hasUser && PERSONALIZED_SORTS.has(sortBy);
  return !skipCache && (!hasUser || !isPersonalizedRequest);
}

export function getPropertyListCacheTtl({ hasUser = false } = {}) {
  return hasUser ? AUTH_STANDARD_PROPERTIES_CACHE_TTL : ANON_PROPERTIES_CACHE_TTL;
}
