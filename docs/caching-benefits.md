## Current vs. Optimized Architecture

### CURRENT ARCHITECTURE (Before)
```
User Request
    ↓
TanStack Query (60s stale)
    ↓
API Route
    ↓
Supabase Database
    ↓
Response (600ms - 2s depending on query complexity)

Problems:
❌ Every 60 seconds, data is "stale" and refetch requested
❌ Complex queries (with joins) hit database every minute
❌ Multiple users requesting same data all hit DB
❌ No server-side caching for expensive queries
```

### OPTIMIZED ARCHITECTURE (After)
```
User Request
    ↓
TanStack Query (2-24h stale depending on type)
    ├─ Cache HIT → Return from memory (0-5ms) ✅
    ├─ Cache MISS → Continue ↓
    └─ Cache expires gracefully
    ↓
Redis Cache (checked by API route)
    ├─ Cache HIT → Return from Redis (5-20ms) ✅
    ├─ Cache MISS → Continue ↓
    └─ Serve from cache while refetching in background
    ↓
Supabase Database (only on miss)
    ↓
Response
    ├─ Store in Redis (5-24h by type)
    └─ Store in TanStack Query (user's browser)

Benefits:
✅ 80-90% requests served from browser cache (0-5ms)
✅ 10-15% requests served from Redis (5-20ms)  
✅ Only 5% requests hit database (500-2000ms)
✅ 10-100x faster response times for cached data
✅ Much lower database load
✅ Better offline support (stale data still available)
```

---

## Real-World Performance Impact

### Scenario: 1000 property listing requests per hour

#### BEFORE (Current)
```
60 requests/min that fetch from DB = 1000 requests/hour to Supabase
Response time: 600ms average
Total time spent: ~10 minutes of waiting
Database load: HIGH
```

#### AFTER (With Redis)
```
80% (800) from browser cache    = 0ms per request
10% (100) from Redis            = 15ms per request
10% (100) from database         = 700ms per request

Average response time: 80ms
Total time spent: ~1.3 minutes of waiting (80% faster!)
Database load: 10x reduced
```

---

## Cost Implications

### Development: FREE
- Local Redis in Docker: No cost
- Implementation: Use open-source tools

### Production: Low Cost
```
Option A: Upstash Redis (Serverless)
- Free tier: 10,000 commands/day (enough for small app)
- Pay as you grow: $0.20 per 100k commands
- For 10M commands/month: ~$20/month

Option B: AWS ElastiCache
- t4g.micro: ~$15/month
- Includes automatic failover, scaling

Option C: Self-hosted on Heroku/Railway
- ~$7-15/month for small instance
```

### Database Cost Reduction
```
Before: ~5000 Supabase queries/hour
After: ~500 Supabase queries/hour (90% reduction)

Cost savings: Massive! 
Supabase billing is usually dominated by query volume.
10x fewer queries = potentially 10x savings.
```

---

## Implementation Priority

### HIGH IMPACT (Days 1-2)
1. Properties listing endpoint (most used, 30M queries/month)
2. Community posts (frequently updated, 5M queries/month)
3. Conversations list (real-time, cache with short TTL)
4. Static data (amenities, locations, interests)

**Expected impact:** 80% fewer database queries

### MEDIUM IMPACT (Days 3-5)
5. User profiles (10min cache, 2M queries/month)
6. Property details (10min cache, 1M queries/month)
7. Search results (cache by filters)

**Expected impact:** 90% fewer database queries

### LOW IMPACT (Future)
- Chat messages (use real-time subscriptions, not caching)
- Notifications (use real-time subscriptions, not caching)
- Rate limiting counters (already using in-memory)

---

## Monitoring & Observability

### Cache Hit Rate
```javascript
// Add to API routes
const cacheHit = await getCached(key);
const metrics = {
  key,
  hit: !!cacheHit,
  timestamp: Date.now(),
  endpoint: request.nextUrl.pathname
};
console.log('CACHE_METRIC', metrics);
```

### Track in Production
```javascript
const hitRate = hits / (hits + misses);
// Target: 60-80% for hot data
// Target: 30-50% for frequently changing data

const responseTimes = {
  fromBrowser: 5,    // ms (TanStack Query)
  fromRedis: 15,     // ms 
  fromDatabase: 700  // ms (Supabase)
};
```

### Upstash Monitoring (if using cloud)
- Dashboard shows: commands/day, max throughput, latency
- Alerts on quota exceeded
- Performance graphs

---

## Gotchas & Solutions

### Gotcha 1: Cache Key Collision
**Problem:** Different query params generate different cache keys
```javascript
// These are different keys (bad!)
properties?city=london&beds=2
properties?beds=2&city=london
```

**Solution:** Sort params before keying
```javascript
const sortedParams = new URLSearchParams(
  Object.fromEntries(
    Array.from(searchParams.entries()).sort()
  )
);
const key = `properties:${sortedParams.toString()}`;
```

### Gotcha 2: Cascading Invalidation
**Problem:** User updates property, but property list isn't invalidated
**Solution:** Use pattern invalidation
```javascript
await invalidatePattern('properties:*'); // Invalidates all property caches
```

### Gotcha 3: Sensitive Data in Cache
**Problem:** Storing passwords or tokens in Redis
**Solution:** Never cache sensitive data
```javascript
// ❌ WRONG
setCached('user:123', userWithPassword);

// ✅ RIGHT
setCached('user:123', {
  id: user.id,
  name: user.name,
  avatar: user.avatar
  // No password, no token
});
```

### Gotcha 4: Memory Buildup
**Problem:** Redis memory keeps growing
**Solution:** Set appropriate TTLs and garbage collection
```javascript
// Always set TTL
await setCached(key, data, 3600); // 1 hour

// Monitor memory
redis-cli INFO memory
```

---

## Testing Caching

### Test 1: Cache Hit Rate
```javascript
// Fetch same query 10 times
for (let i = 0; i < 10; i++) {
  const start = Date.now();
  await fetch('/api/properties?city=london');
  console.log(`Request ${i}: ${Date.now() - start}ms`);
}
// Expected: First slow, rest fast
```

### Test 2: Invalidation
```javascript
// 1. Fetch properties
const first = await fetch('/api/properties');

// 2. Create property (invalidates cache)
await fetch('/api/properties', { method: 'POST', body: {...} });

// 3. Fetch again (should be fresh)
const second = await fetch('/api/properties');

// Expected: second should NOT be identical to first
```

### Test 3: Redis Offline Fallback
```javascript
// Stop Redis: docker stop roomfind-redis
// Make request: should still work (falls back to database)
// Resume Redis: docker start roomfind-redis
```

---

## Next Steps

1. **Choose Redis host:** Local (dev) or Upstash (prod)
2. **Run setup:** `chmod +x redis-setup.sh && ./redis-setup.sh`
3. **Implement Phase 1:** Properties + Community caching
4. **Monitor:** Track cache hit rates and response times
5. **Iterate:** Adjust TTLs based on real-world usage

---

## Resources

- **Redis Docs:** https://redis.io/
- **TanStack Query:** https://tanstack.com/query/latest
- **Upstash Redis:** https://upstash.com/
- **AWS ElastiCache:** https://aws.amazon.com/elasticache/
- **Docker Redis:** `docker run -d -p 6379:6379 redis:7-alpine`
