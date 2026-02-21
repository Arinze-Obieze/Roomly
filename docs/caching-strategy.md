# Caching Strategy for roomFind

## Overview
Three-layer caching for optimal performance:
1. **Browser (TanStack Query)** - Client-side memory cache
2. **Redis** - Server-side distributed cache
3. **Supabase** - Source of truth database

---

## Layer 1: TanStack Query (Client-side)

### Benefits
- Zero latency for cached data
- Automatic garbage collection
- Background refetching
- Optimistic updates

### Configuration by Data Type

```javascript
// Real-time (Chat, Notifications)
staleTime: 0          // Always stale
gcTime: 5 min         // Keep 5 min for background refetch

// User-specific (Profiles, Preferences)
staleTime: 10 min     // Fresh for 10 min
gcTime: 30 min        // Keep 30 min in memory

// Listings & Search
staleTime: 5 min      // Fresh for 5 min
gcTime: 1 hour        // Keep 1 hour in memory

// Static (Amenities, Locations)
staleTime: 24 hours   // Fresh for entire day
gcTime: 7 days        // Keep 7 days in memory

// Community (Posts, Comments)
staleTime: 2 min      // Fresh for 2 min
gcTime: 30 min        // Keep 30 min in memory
```

### Usage in Components

```javascript
import { useCachedQuery } from '@/core/hooks/useCachedQuery';

export default function ListingsPage() {
  // Automatically uses correct cache config
  const { data, isLoading } = useCachedQuery(
    'listings',                    // data type
    ['properties', page, filters], // query key
    async () => {
      const res = await fetch(`/api/properties?...`);
      return res.json();
    }
  );

  return <div>{/* render data */}</div>;
}
```

---

## Layer 2: Redis (Server-side)

### When to Use
- High-frequency queries (listings, search results)
- Expensive computations (aggregations, analytics)
- Rate limiting counters
- Session store (optional)

### When NOT to Use
- Real-time data (chat, notifications)
- User-specific data that varies by user
- Small datasets (< 1KB) - overhead not worth it
- Highly volatile data

### Cache Key Naming Pattern

```
{entity}:{operation}:{identifier}:{filters}

Examples:
- properties:list:page:1:filters:city=london
- properties:detail:123
- user:profile:abc-123
- conversations:list:user-123
- messages:detail:conv-456
- static:amenities
- static:locations
```

### Implementation Steps

#### Step 1: Install Redis
```bash
npm install redis
# or use Upstash for serverless: https://upstash.com/
```

#### Step 2: Configure Environment
```env
# .env.local
REDIS_URL=redis://localhost:6379
# or
REDIS_URL=redis://:password@host:port
```

#### Step 3: Use in API Routes

```javascript
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  // Generate cache key
  const cacheKey = `properties:list:${new URLSearchParams(
    Object.fromEntries(searchParams)
  ).toString()}`;

  // Try Redis first
  const data = await cachedFetch(cacheKey, 300, async () => {
    // Expensive query here
    return await supabase.from('properties').select('*');
  });

  return NextResponse.json(data);
}

export async function POST(request) {
  // ... mutation ...
  
  // Invalidate cache after mutation
  await invalidatePattern('properties:list:*');
  
  return NextResponse.json(result);
}
```

### TTL Recommendations

```javascript
const ttlMap = {
  // Real-time (don't cache)
  chat: null,
  notifications: null,
  
  // Hot data (frequently changing)
  'community:posts': 120,    // 2 min
  'interests:status': 180,   // 3 min
  
  // Warm data (semi-frequent changes)
  'properties:list': 300,    // 5 min
  'conversations:list': 300, // 5 min
  'user:profile': 600,       // 10 min
  
  // Cold data (rarely changes)
  'static:amenities': 86400,    // 24 hours
  'static:locations': 86400,    // 24 hours
  'static:interests': 86400,    // 24 hours
};
```

---

## Layer 3: Advanced Caching Patterns

### Pattern 1: Cache Warming (Pre-populate Cache)

```javascript
// Run on server startup or scheduled job
import { preWarmCache } from '@/core/utils/redis';

async function warmCacheOnStartup() {
  // Cache static data
  await preWarmCache('static:amenities', async () => {
    const res = await supabase.from('amenities').select('*');
    return res.data;
  }, 86400);

  // Cache popular listings
  await preWarmCache('properties:top:monthly', async () => {
    const res = await supabase
      .from('properties')
      .select('*')
      .eq('is_active', true)
      .limit(20);
    return res.data;
  }, 3600);
}
```

### Pattern 2: Cascade Invalidation

```javascript
// When user updates profile, invalidate related caches
async function handleProfileUpdate(userId) {
  await invalidatePattern(`user:${userId}:*`);
  await invalidatePattern(`conversations:user:${userId}:*`);
  await invalidatePattern(`properties:user:${userId}:*`);
}
```

### Pattern 3: Optimistic Updates

```javascript
import { useOptimisticMutation } from '@/core/hooks/useCachedQuery';

export default function PropertyCard({ property }) {
  const mutation = useOptimisticMutation(
    ['properties', property.id],
    {
      mutationFn: async (newData) => {
        const res = await fetch(`/api/properties/${property.id}`, {
          method: 'PUT',
          body: JSON.stringify(newData)
        });
        return res.json();
      },
      onSuccess: async () => {
        // Invalidate list cache
        queryClient.invalidateQueries({ 
          queryKey: ['properties', 'list'],
          refetchType: 'active'
        });
      }
    }
  );

  return (
    <button onClick={() => mutation.mutate({ ...property, liked: true })}>
      Save Property
    </button>
  );
}
```

---

## Implementation Roadmap

### Phase 1: Quick Wins (Days 1-2)
- [ ] Deploy Redis (use Upstash for serverless, no infra cost)
- [ ] Add Redis caching to `/api/properties` (most frequently accessed)
- [ ] Add Redis caching to `/api/community/posts`
- [ ] Cache static data (amenities, locations, interests)

### Phase 2: Client-side Optimization (Day 3)
- [ ] Update QueryProvider with cache configs
- [ ] Migrate high-traffic queries to `useCachedQuery`
- [ ] Implement cache invalidation on mutations
- [ ] Add stale-while-revalidate pattern

### Phase 3: Advanced (Week 2)
- [ ] Implement cache warming for popular properties
- [ ] Add analytics on cache hit/miss rates
- [ ] Optimize real-time data (use pubsub instead of polling)
- [ ] Set up cache monitoring/alerts

---

## Performance Metrics to Track

```javascript
// Measure cache effectiveness
const metrics = {
  cacheHitRate: (hits / (hits + misses)) * 100,      // Target: 60-80%
  avgResponseTime: totalTime / requestCount,          // Target: < 100ms
  dbQueryReduction: (cachedRequests / totalRequests) * 100, // Target: 50%+
};
```

---

## Data Type → Cache Strategy Matrix

| Data Type | TanStack TTL | Redis TTL | Invalidate Trigger |
|-----------|-------------|-----------|-------------------|
| Chat Messages | None | None (don't cache) | Real-time subscription |
| Notifications | 0 | None | Real-time subscription |
| Properties List | 5 min | 5 min | POST/PUT property |
| Property Detail | 10 min | 10 min | PUT property |
| User Profile | 10 min | 30 min | PUT user |
| Conversations | 5 min | 5 min | POST message (own) |
| Messages | None | None | Real-time subscription |
| Community Posts | 2 min | 2 min | POST/DELETE/VOTE |
| Static (Amenities) | 24h | 24h | Admin update only |
| Search Results | 5 min | 5 min | POST property |

---

## Troubleshooting

### Issue: Stale Data
**Solution:** Reduce `staleTime` and use `refetchOnWindowFocus: true`

### Issue: Cache Miss Spikes
**Solution:** Implement cache warming for popular queries

### Issue: Memory Growing
**Solution:** Set appropriate `gcTime` and monitor Redis memory

### Issue: Redis Disconnections
**Solution:** Graceful fallback to uncached queries (already built-in)

---

## Checklist Before Going to Production

- [ ] Redis instance deployed and tested
- [ ] Connection string in environment variables
- [ ] Cache TTLs reviewed and appropriate
- [ ] Invalidation logic comprehensive
- [ ] Monitoring/logging for cache hits/misses
- [ ] Load testing under realistic query patterns
- [ ] Graceful fallback if Redis unavailable
- [ ] Data privacy: no sensitive data in Redis (passwords, tokens, etc.)
