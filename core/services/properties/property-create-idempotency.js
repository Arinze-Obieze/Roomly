import { callRedis, deleteCached, getCached, setCached } from '@/core/utils/redis';

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;
const IDEMPOTENCY_IN_PROGRESS_TTL_SECONDS = 60 * 10;

const buildKey = (userId, idempotencyKey) => `idempotency:property_create:${userId}:${idempotencyKey}`;

export async function getPropertyCreateIdempotencyState(userId, idempotencyKey) {
  if (!userId || !idempotencyKey) return null;
  return getCached(buildKey(userId, idempotencyKey));
}

export async function claimPropertyCreateIdempotency(userId, idempotencyKey, requestFingerprint) {
  if (!userId || !idempotencyKey) {
    return { ok: false, reason: 'missing_key' };
  }

  const key = buildKey(userId, idempotencyKey);
  const payload = JSON.stringify({
    status: 'in_progress',
    requestFingerprint: requestFingerprint || null,
    createdAt: new Date().toISOString(),
  });

  const result = await callRedis('SET', key, payload, 'NX', 'EX', String(IDEMPOTENCY_IN_PROGRESS_TTL_SECONDS));
  return {
    ok: result === 'OK',
    reason: result === 'OK' ? 'claimed' : 'already_exists',
  };
}

export async function storePropertyCreateIdempotencyResult(userId, idempotencyKey, requestFingerprint, response) {
  if (!userId || !idempotencyKey) return;

  await setCached(
    buildKey(userId, idempotencyKey),
    {
      status: 'completed',
      requestFingerprint: requestFingerprint || null,
      response: response || null,
      createdAt: new Date().toISOString(),
    },
    IDEMPOTENCY_TTL_SECONDS
  );
}

export async function clearPropertyCreateIdempotency(userId, idempotencyKey) {
  if (!userId || !idempotencyKey) return;
  await deleteCached(buildKey(userId, idempotencyKey));
}
