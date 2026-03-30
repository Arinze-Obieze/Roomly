import crypto from 'crypto';
import { isIP } from 'node:net';
import { incrementCounter } from './redis.js';

const memoryStore = new Map();

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const getFallbackMode = () => (
  process.env.NODE_ENV === 'production' ? 'deny' : 'memory'
);

const normalizeIdentifierPart = (value) => {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
};

const getClientIp = (request) => {
  const candidateHeaders = [
    request.headers.get('x-vercel-forwarded-for'),
    request.headers.get('cf-connecting-ip'),
    request.headers.get('fly-client-ip'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for'),
  ];

  for (const headerValue of candidateHeaders) {
    if (!headerValue) continue;

    const candidate = headerValue.split(',')[0]?.trim();
    if (!candidate) continue;
    if (isIP(candidate)) {
      return candidate;
    }
  }

  return 'unknown';
};

const buildRateLimitIdentifier = ({ request, scope }) => {
  const scopeParts = Array.isArray(scope) ? scope : [scope];
  const tokens = [];

  for (const part of scopeParts) {
    if (part === 'ip') {
      tokens.push(getClientIp(request));
      continue;
    }

    const normalized = normalizeIdentifierPart(part);
    if (normalized) {
      tokens.push(normalized);
    }
  }

  if (tokens.length === 0) {
    tokens.push('global');
  }

  return crypto.createHash('sha256').update(tokens.join('|')).digest('hex');
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
  fallbackMode = getFallbackMode(),
  increment = incrementCounter,
}) {
  const identifier = buildRateLimitIdentifier({ request, scope });
  const namespacedKey = `rl:${key}:${identifier}`;

  let count = 0;
  let retryAfter = windowSeconds;
  let backend = 'redis';
  let reason = null;

  const backendResult = await increment(namespacedKey, windowSeconds);
  if (backendResult?.ok) {
    count = backendResult.count;
    retryAfter = backendResult.retryAfter;
    backend = backendResult.backend || 'redis';
  } else {
    reason = backendResult?.reason || 'backend_unavailable';

    if (fallbackMode === 'deny') {
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        backend: 'unavailable',
        reason: 'backend_unavailable',
        resetAt: nowInSeconds() + retryAfter,
      };
    }

    const memoryCount = incrementMemoryCounter(namespacedKey, windowSeconds);
    count = memoryCount.count;
    retryAfter = memoryCount.retryAfter;
    backend = 'memory';
  }

  return {
    allowed: count <= limit,
    retryAfter,
    remaining: Math.max(0, limit - count),
    backend,
    reason,
    resetAt: nowInSeconds() + retryAfter,
  };
}

export function buildRateLimitHeaders({ limit, remaining, retryAfter, resetAt }) {
  return {
    'Retry-After': String(Math.max(1, retryAfter || 1)),
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining || 0)),
    'X-RateLimit-Reset': String(resetAt || nowInSeconds()),
  };
}

export function __resetRateLimitMemoryStoreForTests() {
  memoryStore.clear();
}
