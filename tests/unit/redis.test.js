import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const REDIS_URL = 'https://example-redis.upstash.io';
const REDIS_TOKEN = 'test-token';

describe('redis cache wrapper', () => {
  const originalEnv = {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = REDIS_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = REDIS_TOKEN;
  });

  afterEach(() => {
    if (originalEnv.url === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalEnv.url;

    if (originalEnv.token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalEnv.token;
  });

  test('stores a property payload on first fetch and serves it from cache on the second fetch', async () => {
    const logs = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const redisState = new Map();
    const redisCalls = [];

    global.fetch = vi.fn(async (_url, options) => {
      const commands = JSON.parse(options.body);
      const [command, ...args] = commands[0];
      redisCalls.push([command, ...args]);

      if (command === 'PING') {
        return {
          ok: true,
          json: async () => [{ result: 'PONG' }],
        };
      }

      if (command === 'GET') {
        return {
          ok: true,
          json: async () => [{ result: redisState.get(args[0]) ?? null }],
        };
      }

      if (command === 'SET') {
        const [key, value] = args;
        redisState.set(key, value);
        return {
          ok: true,
          json: async () => [{ result: 'OK' }],
        };
      }

      throw new Error(`Unexpected Redis command: ${command}`);
    });

    const { cachedFetch } = await import('../../core/utils/redis.js');
    const propertyCacheKey = 'property:9aa0dfbc24fb8d53898392461e56071b';
    const propertyPayload = {
      id: '5033ee37-2e70-4e49-936a-44a8a4ccc30d',
      title: 'Quiet room in Lekki',
    };
    const fetchFn = vi.fn(async () => propertyPayload);

    const firstResult = await cachedFetch(propertyCacheKey, 600, fetchFn);
    const secondResult = await cachedFetch(propertyCacheKey, 600, fetchFn);

    expect(firstResult).toEqual(propertyPayload);
    expect(secondResult).toEqual(propertyPayload);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    expect(redisCalls).toEqual([
      ['PING'],
      ['GET', propertyCacheKey],
      ['SET', propertyCacheKey, JSON.stringify(propertyPayload), 'EX', '600'],
      ['GET', propertyCacheKey],
    ]);

    expect(logs).toContain('[Cache MISS] property:9aa0dfbc24fb8d53898392461e56071b');
    expect(logs).toContain('[Cache SET] property:9aa0dfbc24fb8d53898392461e56071b (TTL: 600s)');
    expect(logs).toContain('[Cache HIT] property:9aa0dfbc24fb8d53898392461e56071b');
  });
});
