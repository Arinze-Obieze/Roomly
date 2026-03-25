import crypto from 'crypto';

export function buildPropertyDetailCacheKey(propertyId, userId = 'anon', versions = {}) {
  const hash = crypto
    .createHash('md5')
    .update(`${propertyId}:${userId}:${JSON.stringify(versions)}`)
    .digest('hex');

  return `property:${hash}`;
}
