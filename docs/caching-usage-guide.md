# Redis Caching Usage Guide for Developers

## Quick Start

### Using Cached Queries in Components

#### Example 1: Property List with Cache Auto-Config
```javascript
// Before (without caching)
import { useQuery } from '@tanstack/react-query';

function PropertyList() {
  const { data: properties } = useQuery({
    queryKey: ['properties', searchParams],
    queryFn: async () => {
      const res = await fetch(`/api/properties?${new URLSearchParams(searchParams)}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000,   // 1 hour
  });
  // ... rest of component
}

// After (with caching auto-config)
import { useCachedQuery } from '@/core/hooks/useCachedQuery';

function PropertyList() {
  const { data: properties } = useCachedQuery('listings', 
    ['properties', searchParams],
    async () => {
      const res = await fetch(`/api/properties?${new URLSearchParams(searchParams)}`);
      return res.json();
    }
  );
  // SAME component code, but:
  // - Automatically applies 5min stale, 60min gc
  // - Smart retry logic
  // - No manual TTL configuration needed
}
```

#### Example 2: Pagination with Cache Awareness
```javascript
import { useCachedInfiniteQuery } from '@/core/hooks/useCachedQuery';

function InfinitePropertyList() {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading 
  } = useCachedInfiniteQuery('listings',
    ['properties', 'infinite'],
    async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/properties?page=${pageParam}`);
      return res.json();
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
    }
  );

  return (
    <>
      {data?.pages.map(page => 
        page.properties.map(prop => <PropertyCard key={prop.id} />)
      )}
      <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isLoading}>
        Load more
      </button>
    </>
  );
}
```

#### Example 3: User-Specific Data (Interests/Dashboard)
```javascript
import { useCachedQuery } from '@/core/hooks/useCachedQuery';

function SeekerDashboard() {
  // Cache key includes user ID by default in backend
  // Returns cached data per user
  const { data: interests } = useCachedQuery('user',
    ['seeker', 'interests'],
    async () => {
      const res = await fetch('/api/seeker/interests');
      return res.json();
    }
  );

  return (
    <>
      <h1>My Interests</h1>
      {interests?.data.map(interest => (
        <InterestCard key={interest.id} interest={interest} />
      ))}
    </>
  );
}
```

#### Example 4: Mutations with Auto-Invalidation
```javascript
import { useSmartMutation } from '@/core/hooks/useCachedQuery';

function CreatePropertyForm() {
  const { mutate, isPending } = useSmartMutation({
    mutationFn: async (formData) => {
      const res = await fetch('/api/properties', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      return res.json();
    },
    onSuccess: () => {
      // Hook automatically invalidates these query keys:
      // ['properties'], ['properties:list:*'], etc.
      console.log('Property created!');
    },
    invalidateKeys: [
      ['properties'], // Primary key
      ['seeker', 'interests'], // Secondary keys to also invalidate
    ],
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutate(new FormData(e.target));
    }}>
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Property'}
      </button>
    </form>
  );
}
```

#### Example 5: Optimistic Updates (Instant UI)
```javascript
import { useOptimisticMutation } from '@/core/hooks/useCachedQuery';
import { useQueryClient } from '@tanstack/react-query';

function VoteButton({ postId, currentVote }) {
  const queryClient = useQueryClient();
  const { mutate } = useOptimisticMutation(
    ['community', 'posts', postId],
    {
      mutationFn: async (voteType) => {
        const res = await fetch(`/api/community/posts/${postId}/vote`, {
          method: 'POST',
          body: JSON.stringify({ voteType }),
        });
        return res.json();
      },
      // Instant UI update while request is in flight
      // Reverts automatically if request fails
    }
  );

  return (
    <div className="vote-buttons">
      <button onClick={() => mutate(1)} disabled={currentVote === 1}>
        👍 Upvote
      </button>
      <button onClick={() => mutate(-1)} disabled={currentVote === -1}>
        👎 Downvote
      </button>
      <button onClick={() => mutate(0)} disabled={currentVote === 0}>
        ✓ Clear
      </button>
    </div>
  );
}
```

---

## Cache Configuration Reference

### CACHE_CONFIG Object
Located in `providers/QueryProvider.jsx`:

```javascript
const CACHE_CONFIG = {
  realtime: {
    staleTime: 0,                    // Always refetch
    gcTime: 5 * 60 * 1000,           // 5 min garbage collection
  },
  user: {
    staleTime: 10 * 60 * 1000,       // 10 min stale
    gcTime: 30 * 60 * 1000,          // 30 min garbage collection
  },
  listings: {
    staleTime: 5 * 60 * 1000,        // 5 min stale
    gcTime: 60 * 60 * 1000,          // 1 hour garbage collection
  },
  community: {
    staleTime: 2 * 60 * 1000,        // 2 min stale
    gcTime: 30 * 60 * 1000,          // 30 min garbage collection
  },
  static: {
    staleTime: 24 * 60 * 60 * 1000,  // 24 hour stale
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 day garbage collection
  },
};
```

### Cache Type Mapping
```javascript
// Use 'realtime' for:
// - Live chat messages
// - Notifications
// - Real-time updates
// → Handled differently via subscriptions

// Use 'user' for:
// - User profiles
// - User preferences
// - Saved interests
// Example: useCachedQuery('user', ['profile'], fetchFn)

// Use 'listings' for:
// - Property searches
// - Property lists
// - Property details
// Example: useCachedQuery('listings', ['properties'], fetchFn)

// Use 'community' for:
// - Community posts
// - Community feeds
// - Comments
// Example: useCachedQuery('community', ['posts'], fetchFn)

// Use 'static' for:
// - Location lists
// - Amenities
// - Fixed references
// Example: useCachedQuery('static', ['amenities'], fetchFn)
```

---

## API Endpoint Patterns

### 1. Implementing Caching in New Endpoints

#### Pattern: Simple GET with Cache
```javascript
// api/example/route.js
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';
import crypto from 'crypto';

const generateCacheKey = (params) => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex');
  return `example:list:${hash}`;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = generateCacheKey(Object.fromEntries(searchParams));

    // Fetch from cache first (10 min TTL)
    const data = await cachedFetch(cacheKey, 600, async () => {
      return await fetchFromDatabase(searchParams);
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // ... validation and auth ...

    // Insert into database
    const data = await insertDataToDatabase(body);

    // Invalidate cache for this data type
    await invalidatePattern('example:list:*');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

#### Pattern: User-Specific Cached Data
```javascript
// api/user/preferences/route.js
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';

const generateCacheKey = (userId) => {
  return `user:preferences:${userId}`;
};

export async function GET(request) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = generateCacheKey(user.id);

  // User-specific cache (30 min TTL)
  const data = await cachedFetch(cacheKey, 1800, async () => {
    return await fetchUserPreferences(user.id);
  });

  return NextResponse.json(data);
}

export async function PUT(request) {
  const { data: { user } } = await supabase.auth.getUser();
  const updates = await request.json();

  // Update database
  await updateUserPreferences(user.id, updates);

  // Invalidate this user's cache only
  const cacheKey = generateCacheKey(user.id);
  await invalidatePattern(cacheKey);

  return NextResponse.json({ success: true });
}
```

#### Pattern: Cache with Related Data Invalidation
```javascript
// api/community/posts/route.js
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';

export async function POST(request) {
  const post = await createPost(body);

  // Invalidate multiple related caches
  await invalidatePattern('community:posts:*');      // Post lists
  await invalidatePattern('community:post:*');       // Post details
  await invalidatePattern('user:interests:*');       // User's interests

  return NextResponse.json(post);
}
```

---

## Common Patterns & Solutions

### Pattern 1: Cache Warming (Pre-populate)
```javascript
// pages/properties/index.js
import { preWarmCache } from '@/core/utils/redis';

export async function getStaticProps() {
  // Pre-warm cache with popular searches
  const popularCities = ['Amsterdam', 'London', 'Berlin'];

  for (const city of popularCities) {
    await preWarmCache(
      `properties:list:${city}`,
      async () => {
        // Fetch popular properties for this city
        return await fetchPropertiesForCity(city);
      },
      5 * 60 // 5 minute TTL
    );
  }

  return { revalidate: 3600 }; // Revalidate hourly
}
```

### Pattern 2: Batch Cache Retrieval
```javascript
// Get multiple cached items at once
import { getCachedBatch } from '@/core/utils/redis';

const propertyIds = ['prop-1', 'prop-2', 'prop-3'];
const cacheKeys = propertyIds.map(id => `property:${id}`);

const cachedProperties = await getCachedBatch(cacheKeys);
// Returns array: [prop1Data, prop2Data, prop3Data]
```

### Pattern 3: Cache Health Check
```javascript
// Optional endpoint for monitoring
export async function GET() {
  const { isRedisAvailable } = await import('@/core/utils/redis');
  const health = await isRedisAvailable();

  return NextResponse.json({
    redis: health ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}
```

### Pattern 4: Graceful Cache Degradation
```javascript
// Your fetch function already handles this!
// If Redis is down, cachedFetch() falls back to direct DB query
// No special handling needed in your code

const data = await cachedFetch(key, ttl, async () => {
  // This runs if:
  // 1. Cache miss (not in Redis)
  // 2. Redis unavailable (timeout or error)
  return await fetchFromDatabase();
});
// Result is the same either way!
```

### Pattern 5: Manual Cache Invalidation (Rare)
```javascript
// Usually handled automatically, but if needed:
import { deleteCached, invalidatePattern } from '@/core/utils/redis';

// Delete single key
await deleteCached('properties:list:abc123');

// Delete pattern (recommended)
await invalidatePattern('properties:*'); // All property caches
await invalidatePattern('*');            // DANGER: All caches
```

---

## Debugging & Monitoring

### Enable Debug Logging
```javascript
// core/utils/redis.js already logs everything
// Check browser console or server logs for:
// [Redis] ...
// [Cache] Cache HIT: ...
// [Cache] Cache MISS: ...
```

### Check Cache Health
```javascript
// Create a debug component
import { isRedisAvailable } from '@/core/utils/redis';

export async function CacheHealthCheck() {
  const available = await isRedisAvailable();
  
  return (
    <div>
      <h2>Cache Status: {available ? '✅ Connected' : '❌ Disconnected'}</h2>
      <p>When disconnected, app falls back to database queries.</p>
    </div>
  );
}
```

### Monitor Cache Hit Rate
```javascript
// Add to your analytics or observability tool
// Track when [Cache] HIT vs MISS appears in logs
// Target: > 70% hit rate during normal operation

// Example metric:
const cacheHitRate = (cacheHits / (cacheHits + cacheMisses)) * 100;
// Good: 70-90%
// Excellent: > 85%
// Check: < 50% (TTL might be too short)
```

### Profile Specific Endpoints
```javascript
// Browser DevTools Network tab
// After caching enabled:
// Cached response: 50-150ms
// Cache miss: 300-600ms
// Expected improvement: 3-6x faster

// Check Response headers for custom timing:
// fetch('/api/properties?city=Amsterdam').then(r => {
//   console.time('Request to render');
//   return r.json();
// }).then(data => {
//   console.timeEnd('Request to render');
// });
```

---

## Best Practices

### 1. ✅ DO
- Use appropriate cache type (use 'listings' for properties, 'user' for profiles)
- Include user ID in cache key for user-specific data
- Invalidate related caches (e.g., when property updates, invalidate list cache)
- Monitor cache hit rates
- Set reasonable TTLs (5min for frequently updated, 24h for static)
- Test cache invalidation works correctly

### 2. ❌ DON'T
- Cache authentication tokens (cache only after verified)
- Cache personal/sensitive data longer than necessary
- Use same cache key for different users (specify user ID)
- Set TTL to 0 (that's no caching)
- Forget to invalidate on mutations
- Cache data that changes frequently without short TTL
- Use cache for unauthenticated critical operations

### 3. 🔶 MAYBE
- Cache real-time data (prefer subscriptions)
- Cache rapidly changing data (use very short TTL, e.g., 30s)
- Cache without user ID (only if truly global/static)

---

## Troubleshooting Guide

### Q: Cache isn't working, I'm not seeing cache hits
```
A: Check these in order:
1. Verify REDIS_URL is set: console.log(process.env.REDIS_URL)
2. Check logs for "[Redis] Connected successfully"
3. Restart dev server after setting REDIS_URL
4. Make same request twice (first is miss, second should be hit)
5. Check Upstash dashboard for keys
```

### Q: Cache hit rate is very low
```
A: Reasons and fixes:
- TTL too short: Increase TTL (example: 5→10 minutes)
- Query params vary too much: Add filtering to cache key
- Real-time subscriptions overwriting cache: Use different data source
- Cache key collision: Add user ID or date to key
```

### Q: Redis connection slow/timing out
```
A: Solutions:
- Check network connectivity
- Verify Upstash is not rate-limited
- Increase timeout: Edit redis.js timeout duration
- Use local Redis for development (docker)
- Check Upstash dashboard for issues
```

### Q: Stale data being served from cache
```
A: Solutions:
- Decrease TTL (cache expires sooner)
- Add immediate invalidation on mutations
- Use invalidatePattern() more aggressively
- Check cache invalidation logs
```

---

## Resources

- **Caching Strategy**: See `docs/caching-strategy.md`
- **Performance Overview**: See `docs/caching-benefits.md`
- **Deployment Guide**: See `docs/production-deployment-checklist.md`
- **Redis Commands**: https://redis.io/commands/
- **Upstash Docs**: https://upstash.com/docs

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Ready for Development ✅
