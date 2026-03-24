import test from 'node:test';
import assert from 'node:assert/strict';
import { assertRateLimit } from '../core/utils/rate-limit.js';

const makeRequest = (headers = {}) => ({
  headers: {
    get(name) {
      return headers[name.toLowerCase()] ?? null;
    },
  },
});

test('rate limit falls back to in-memory counters when Redis is unavailable', async () => {
  const request = makeRequest({ 'x-forwarded-for': '127.0.0.1' });

  const first = await assertRateLimit({
    request,
    key: 'test-memory-fallback',
    limit: 2,
    windowSeconds: 60,
    scope: 'ip',
  });
  const second = await assertRateLimit({
    request,
    key: 'test-memory-fallback',
    limit: 2,
    windowSeconds: 60,
    scope: 'ip',
  });
  const third = await assertRateLimit({
    request,
    key: 'test-memory-fallback',
    limit: 2,
    windowSeconds: 60,
    scope: 'ip',
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfter >= 1);
});
