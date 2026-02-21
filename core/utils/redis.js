/**
 * Redis Caching for roomFind using Upstash REST API
 * 
 * Uses Upstash REST API for serverless compatibility
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL: https://...
 * - UPSTASH_REDIS_REST_TOKEN: ...
 * 
 * CACHE KEYS:
 * - properties:list:{hash} → 5 min
 * - properties:{id} → 10 min
 * - user:{id} → 30 min
 * - communities:posts → 2 min
 * - static:amenities → 24 hours
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let isConnecting = false;

// Helper: Make REST API call to Upstash
const callRedis = async (command, ...args) => {
  if (!REDIS_URL || !REDIS_TOKEN) {
    console.log('[Redis] No Upstash credentials configured, caching disabled');
    return null;
  }

  try {
    const response = await fetch(`${REDIS_URL}/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commands: [[command, ...args]],
      }),
    });

    if (!response.ok) {
      throw new Error(`Upstash API returned ${response.status}`);
    }

    const data = await response.json();
    return data?.result?.[0];
  } catch (err) {
    console.error(`[Redis] Error executing ${command}:`, err.message);
    return null;
  }
};

// Health check on first use
let hasCheckedHealth = false;
const checkRedisHealth = async () => {
  if (hasCheckedHealth || !REDIS_URL || !REDIS_TOKEN) return;
  hasCheckedHealth = true;

  try {
    const result = await callRedis('PING');
    if (result === 'PONG') {
      console.log('[Redis] Connected to Upstash successfully');
    }
  } catch (err) {
    console.warn('[Redis] Health check failed, caching disabled');
  }
};

/**
 * Get value from Redis cache
 */
export const getCached = async (key) => {
  try {
    await checkRedisHealth();
    const value = await callRedis('GET', key);
    
    if (value) {
      console.log(`[Cache HIT] ${key}`);
      return JSON.parse(value);
    }
    console.log(`[Cache MISS] ${key}`);
    return null;
  } catch (err) {
    console.error(`[Cache GET] Error for ${key}:`, err.message);
    return null; // Graceful fallback
  }
};

/**
 * Set value in Redis cache with TTL
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 */
export const setCached = async (key, value, ttlSeconds = 300) => {
  try {
    await checkRedisHealth();
    await callRedis('SET', key, JSON.stringify(value), 'EX', ttlSeconds.toString());
    console.log(`[Cache SET] ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.error(`[Cache SET] Error for ${key}:`, err.message);
  }
};

/**
 * Delete cached value(s)
 */
export const deleteCached = async (keys) => {
  try {
    await checkRedisHealth();
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length > 0) {
      await callRedis('DEL', ...keyArray);
      console.log(`[Cache DELETE] ${keyArray.length} keys removed`);
    }
  } catch (err) {
    console.error('[Cache DELETE] Error:', err.message);
  }
};

/**
 * Pattern-based cache invalidation
 * WARNING: This scans all keys, can be slow on large datasets
 */
export const invalidatePattern = async (pattern) => {
  try {
    await checkRedisHealth();
    
    // For Upstash REST API, we need to use SCAN
    // Due to API limitations, we'll use KEYS as fallback (not ideal for large DBs)
    const keysResult = await callRedis('KEYS', pattern);
    
    if (keysResult && Array.isArray(keysResult) && keysResult.length > 0) {
      await callRedis('DEL', ...keysResult);
      console.log(`[Cache INVALIDATE] ${keysResult.length} keys matching: ${pattern}`);
    } else {
      console.log(`[Cache INVALIDATE] No keys matching: ${pattern}`);
    }
  } catch (err) {
    console.error('[Cache INVALIDATE] Error:', err.message);
  }
};

/**
 * Cache wrapper for GET requests
 * Tries cache first, then executes fetch function if miss
 */
export const cachedFetch = async (cacheKey, ttlSeconds, fetchFn) => {
  // Try cache first
  const cached = await getCached(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch if not cached
  try {
    const data = await fetchFn();

    // Store in cache
    if (data) {
      await setCached(cacheKey, data, ttlSeconds);
    }

    return data;
  } catch (err) {
    console.error(`[Fetch Error] ${cacheKey}:`, err.message);
    throw err;
  }
};

/**
 * Pre-populate cache
 */
export const preWarmCache = async (key, fetchFn, ttlSeconds = 3600) => {
  try {
    console.log(`[Cache WARM] Pre-warming ${key}...`);
    const data = await fetchFn();
    if (data) {
      await setCached(key, data, ttlSeconds);
    }
    return data;
  } catch (err) {
    console.error(`[Cache WARM] Error for ${key}:`, err.message);
    return null;
  }
};

/**
 * Batch cache operations
 */
export const getCachedBatch = async (keys) => {
  try {
    await checkRedisHealth();
    
    // Use MGET for batch retrieval
    const values = await callRedis('MGET', ...keys);
    const result = {};
    
    if (Array.isArray(values)) {
      keys.forEach((key, index) => {
        result[key] = values[index] ? JSON.parse(values[index]) : null;
      });
    }
    
    return result;
  } catch (err) {
    console.error('[Cache BATCH GET] Error:', err.message);
    return {};
  }
};

/**
 * Increment counter (for rate limiting)
 */
export const incrementCounter = async (key, ttlSeconds = 3600) => {
  try {
    await checkRedisHealth();
    
    const count = await callRedis('INCR', key);
    const ttl = await callRedis('TTL', key);
    
    if (ttl === -1) {
      await callRedis('EXPIRE', key, ttlSeconds.toString());
    }

    return count || 0;
  } catch (err) {
    console.error('[Counter Increment] Error:', err.message);
    return 0;
  }
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = async () => {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return false;
  }

  try {
    const result = await callRedis('PING');
    return result === 'PONG';
  } catch (err) {
    return false;
  }
};
