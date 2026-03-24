import { incrementCounter } from './redis.js';

const memoryStore = new Map();

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const getClientIp = (request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
};

const incrementMemoryCounter = (key, windowSeconds) => {
  const now = nowInSeconds();
  const bucket = memoryStore.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowSeconds });
    return { count: 1, retryAfter: windowSeconds };
  }

  bucket.count += 1;
  memoryStore.set(key, bucket);

  return {
    count: bucket.count,
    retryAfter: Math.max(1, bucket.expiresAt - now),
  };
};

export async function assertRateLimit({
  request,
  key,
  limit,
  windowSeconds,
  scope = 'global',
}) {
  const identifier = scope === 'ip' ? getClientIp(request) : scope;
  const namespacedKey = `rl:${key}:${identifier}`;

  let count = 0;
  let retryAfter = windowSeconds;

  const redisCount = await incrementCounter(namespacedKey, windowSeconds);
  if (Number.isFinite(redisCount) && redisCount > 0) {
    count = redisCount;
  } else {
    const memoryCount = incrementMemoryCounter(namespacedKey, windowSeconds);
    count = memoryCount.count;
    retryAfter = memoryCount.retryAfter;
  }

  return {
    allowed: count <= limit,
    retryAfter,
    remaining: Math.max(0, limit - count),
  };
}
