import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __resetRateLimitMemoryStoreForTests,
  assertRateLimit,
  buildRateLimitHeaders,
} from '../core/utils/rate-limit.js';

const makeRequest = (headers = {}) => ({
  headers: {
    get(name) {
      return headers[name.toLowerCase()] ?? null;
    },
  },
});

test.beforeEach(() => {
  __resetRateLimitMemoryStoreForTests();
});

test('rate limit falls back to in-memory counters when Redis is unavailable', async () => {
  const request = makeRequest({ 'x-forwarded-for': '127.0.0.1' });
  const unavailableIncrementer = async () => ({
    ok: false,
    backend: 'unavailable',
    reason: 'test_unavailable',
    count: 0,
    retryAfter: 60,
  });

  const first = await assertRateLimit({
    request,
    key: 'test-memory-fallback',
    limit: 2,
    windowSeconds: 60,
    scope: 'ip',
    fallbackMode: 'memory',
    increment: unavailableIncrementer,
  });
  const second = await assertRateLimit({
    request,
    key: 'test-memory-fallback',
    limit: 2,
    windowSeconds: 60,
    scope: 'ip',
    fallbackMode: 'memory',
    increment: unavailableIncrementer,
  });
  const third = await assertRateLimit({
    request,
    key: 'test-memory-fallback',
    limit: 2,
    windowSeconds: 60,
    scope: 'ip',
    fallbackMode: 'memory',
    increment: unavailableIncrementer,
  });

  assert.equal(first.allowed, true);
  assert.equal(first.backend, 'memory');
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfter >= 1);
});

test('rate limit denies requests when backend is unavailable and fallback mode is deny', async () => {
  const request = makeRequest({ 'x-forwarded-for': '127.0.0.1' });

  const result = await assertRateLimit({
    request,
    key: 'test-deny-fallback',
    limit: 1,
    windowSeconds: 30,
    scope: 'ip',
    fallbackMode: 'deny',
    increment: async () => ({
      ok: false,
      backend: 'unavailable',
      reason: 'test_unavailable',
      count: 0,
      retryAfter: 30,
    }),
  });

  assert.equal(result.allowed, false);
  assert.equal(result.backend, 'unavailable');
  assert.equal(result.reason, 'backend_unavailable');
});

test('rate limit hashes identifiers and incorporates sanitized ip scope', async () => {
  const request = makeRequest({
    'x-forwarded-for': '203.0.113.10, 10.0.0.1',
  });
  const keys = [];

  const result = await assertRateLimit({
    request,
    key: 'test-key-shape',
    limit: 10,
    windowSeconds: 60,
    scope: ['Person@Example.com', 'ip'],
    increment: async (key) => {
      keys.push(key);
      return {
        ok: true,
        backend: 'redis',
        count: 1,
        retryAfter: 60,
      };
    },
  });

  assert.equal(result.allowed, true);
  assert.equal(keys.length, 1);
  assert.match(keys[0], /^rl:test-key-shape:[a-f0-9]{64}$/);
  assert.ok(!keys[0].includes('Person@Example.com'));
  assert.ok(!keys[0].includes('203.0.113.10'));
});

test('rate limit headers expose standard limit metadata', () => {
  const headers = buildRateLimitHeaders({
    limit: 5,
    remaining: 2,
    retryAfter: 17,
    resetAt: 123456,
  });

  assert.deepEqual(headers, {
    'Retry-After': '17',
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '2',
    'X-RateLimit-Reset': '123456',
  });
});
