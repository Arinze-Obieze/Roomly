# Redis Caching - Production Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Integration Complete
- [x] Core utilities (`core/utils/redis.js`) - Upstash compatible
- [x] Custom hooks (`core/hooks/useCachedQuery.js`) - auto cache config
- [x] Query provider (`providers/QueryProvider.jsx`) - enhanced with CACHE_CONFIG
- [x] API endpoints cached (7 endpoints):
  - [x] `api/properties/route.js` - 5min TTL for listings
  - [x] `api/properties/[id]/route.js` - 10min TTL for details
  - [x] `api/community/posts/route.js` - 2min TTL for feed
  - [x] `api/community/posts/[id]/route.js` - 5min TTL for details
  - [x] `api/buddy/messages/route.js` - 30sec TTL for messages
  - [x] `api/seeker/interests/route.js` - 10min TTL for seeker dashboard
  - [x] `api/landlord/interests/route.js` - 10min TTL for landlord dashboard
- [x] Cache invalidation implemented on mutations (POST/PUT/DELETE)

### ✅ Documentation Complete
- [x] Caching strategy guide (`docs/caching-strategy.md`)
- [x] Performance benefits analysis (`docs/caching-benefits.md`)
- [x] Integration status document (`docs/caching-implementation-status.md`)
- [x] Environment template (`.env.example.redis`)
- [x] Redis integration example (`core/examples/redis-integration-example.js`)
- [x] Setup guide (`redis-setup.sh`)

---

## Deployment Steps

### Step 1: Get Upstash Redis URL
**Time**: 5 minutes
- [ ] Go to https://console.upstash.com
- [ ] Sign up / log in (free tier available)
- [ ] Click "Create Database"
- [ ] Select Name: "roomFind" (or similar)
- [ ] Select Region: Closest to your deployment region
- [ ] Copy "Connection String" (looks like `redis://default:xxx@xxx:6379`)
- [ ] Keep this string safe (contains password)

### Step 2: Update Environment Variables
**Time**: 2 minutes

#### For Local Development
Create/update `.env.local` in project root:
```env
REDIS_URL=redis://default:<password>@<host>:<port>
```

#### For Production (Vercel)
1. Go to Vercel Project Settings → Environment Variables
2. Add new variable:
   - **Name**: `REDIS_URL`
   - **Value**: Your Upstash connection string
   - **Environments**: Production (and Staging if desired)
3. Redeploy to apply changes

### Step 3: Verify Local Testing
**Time**: 10 minutes

```bash
# 1. Start development server
npm run dev

# 2. Check logs for Redis connection
# Should see: "[Redis] Connecting to Upstash..."
# Or: "[Redis] Connected successfully"
# Or: "[Redis] No Redis URL configured, caching disabled"

# 3. Make a request to cached endpoint
# Example: Visit http://localhost:3000/properties?city=Amsterdam

# 4. Watch for cache messages in console
# Should see: "[Cache] Cache MISS: properties:list:*"

# 5. Repeat request
# Should see: "[Cache] Cache HIT: properties:list:*"

# 6. Visit Upstash console and check keys
# Should see keys like "properties:list:abc123"
```

### Step 4: Deploy to Production
**Time**: 5 minutes

**Option A: Using Vercel Dashboard**
1. Go to Vercel → Deployments
2. Click "Redeploy" on latest commit
3. Wait for deployment to complete
4. Check deployment logs for Redis connection

**Option B: Using CLI**
```bash
vercel deploy --prod
```

### Step 5: Verify Production Deployment
**Time**: 5 minutes

1. Visit production URL
2. Check Network tab (DevTools) for response times
   - Should be ~80-150ms for cached requests
   - First request ~300-600ms
3. Verify cache is working:
   - Make same request twice
   - Second should be faster
4. Check Upstash console dashboard
   - Should see growing number of keys
   - Memory usage should be low (< 10MB initially)

### Step 6: Monitor & Adjust
**Time**: Ongoing

#### Weekly Monitoring
- [ ] Monitor cache hit rate in Upstash dashboard
- [ ] Check memory usage (should stay < 50MB for free tier)
- [ ] Look for error logs (connection failures, timeouts)
- [ ] Monitor response times (should average < 100ms for cached)

#### Alerting (Optional)
Set up alerts in Upstash dashboard for:
- Memory usage > 80%
- Request latency spikes
- Connection errors

#### TTL Adjustments
Monitor these metrics and adjust TTLs if needed:
```javascript
// If cache hit rate is:
// < 30% → Increase TTL by 2x
// > 80% → Decrease TTL by 0.5x

// Current recommended ranges:
// - Frequently updated data: 30s - 5min
// - Regular data: 5min - 30min
// - Static data: 1hr - 24hr
```

---

## Troubleshooting

### Issue: Redis connection fails
```
[Redis] Connection failed: ECONNREFUSED
```
**Solution**:
- Verify REDIS_URL is correct in .env.local
- Ensure Upstash database is running (check console)
- Check network/firewall isn't blocking connection
- Verify TLS certificates are valid

### Issue: Cache hits not happening
```
[Cache] Cache MISS: properties:list:*
[Cache] Cache MISS: properties:list:* (repeated)
```
**Solution**:
- Verify cache TTL > 0 (check `core/utils/redis.js`)
- Confirm Redis is actually storing data (check Upstash console)
- Clear cache manually: `redis-cli FLUSHDB` or Upstash console "Reset"
- Restart application after TTL increase

### Issue: Memory usage grows too fast
**Solution**:
- Reduce TTLs (memory fills with old keys)
- Implement cache warming instead of relying on demand-fill
- Monitor key patterns in Upstash (find unexpectedly large keys)
- Consider upgrading to paid Upstash tier

### Issue: Deployment shows no REDIS_URL
**Solution**:
- Verify environment variable was added to Vercel
- Go to Vercel Settings → Environment Variables
- Confirm variable appears in production environment
- Redeploy after adding variable (new builds needed)
- Wait for redeployment to complete

### Issue: Specific endpoint is slow
**Solution**:
1. Check if endpoint is cached (look for `cachedFetch` in code)
2. Verify TTL is appropriate for data freshness
3. Check if cache invalidation is working (should see pattern invalidation logs)
4. Profile database query time (is it slow without cache?)
5. Consider adding `preWarmCache()` for popular items

---

## Performance Baselines

### Before Caching
```
Property List (GET /api/properties?city=Amsterdam)
- First request: 650ms
- Second request: 620ms (DB hit again, no caching)
- Average DB queries: 20 per request
- Typical concurrent load: 10-50 users
```

### After Caching (Expected)
```
Property List (GET /api/properties?city=Amsterdam)
- First request: 600ms (cache miss, fetch from DB)
- Second request: 80ms (cache hit within 5 minutes)
- Average DB queries: ~2 per request (90% reduction)
- Typical concurrent load: 100-500 users without degradation
```

---

## Rollback Plan

If caching causes issues, rollback is simple:

### Quick Rollback
1. Set `REDIS_URL` to empty string or remove it
2. Application automatically falls back to DB-only mode
3. Deploy changes

### Detailed Rollback
1. Go to `.env.local` and remove `REDIS_URL`
2. Alternatively, temporarily rename redis.js:
   ```bash
   mv core/utils/redis.js core/utils/redis.js.bak
   ```
3. Redeploy
4. Application works normally (no caching, slightly slower)

### Long-term Fix
If specific endpoints have issues:
1. Comment out `cachedFetch()` call in that endpoint
2. Revert to direct DB query
3. Investigate why caching broke that endpoint
4. Fix root cause, re-enable caching

---

## Success Criteria

✅ **Deployment is successful when**:
1. REDIS_URL is set in production environment
2. Logs show "[Redis] Connected successfully"
3. Cache keys appear in Upstash console
4. Response times are ~80-150ms for cached requests
5. Upstash dashboard shows memory usage growing (indicates usage)
6. No errors in production logs related to Redis
7. Application performance is noticeably faster

---

## Next Steps After Deployment

### Immediate (Within 24 hours)
- [ ] Monitor logs for any Redis errors
- [ ] Test cache invalidation (create property, verify properties:list:* cleared)
- [ ] Verify response times in production vs development

### Short-term (Within 1 week)
- [ ] Analyze cache hit rates in Upstash
- [ ] Identify if any endpoints need TTL adjustments
- [ ] Check for unexpected cache patterns
- [ ] Review error logs for connection issues

### Medium-term (Within 1 month)
- [ ] Implement cache warming for popular items
- [ ] Consider upgrading expensive queries
- [ ] Set up monitoring/alerting
- [ ] Document any custom cache patterns

### Long-term
- [ ] Implement distributed cache (multi-region)
- [ ] Add cache analytics endpoint
- [ ] Auto-scale Upstash tier based on usage
- [ ] Archive old cache patterns documentation

---

## Quick Reference

### Cache Key Patterns
```javascript
properties:list:*       // All property list caches
property:*              // All property detail caches
community:posts:*       // All community feed caches
community:post:*        // All community detail caches
buddy:messages:*        // All buddy message caches
seeker:interests:*      // Seeker interest caches
landlord:interests:*    // Landlord interest caches
```

### Common Commands
```bash
# Check Redis connection
redis-cli ping

# View all keys
redis-cli KEYS "*"

# View memory usage
redis-cli INFO memory

# Clear all keys (WARNING: destructive)
redis-cli FLUSHDB

# Monitor real-time operations
redis-cli MONITOR
```

### Environment Variable Format
```
REDIS_URL=redis://default:<password>@<host>:<port>
```

Example:
```
REDIS_URL=redis://default:abc123def456@upstash-1234.upstash.io:6379
```

---

## Support Resources

- **Upstash Console**: https://console.upstash.com
- **Upstash Docs**: https://upstash.com/docs/redis/overview
- **roomFind Caching Guide**: `docs/caching-strategy.md`
- **Redis Commands**: https://redis.io/commands/
- **Performance Metrics**: `docs/caching-benefits.md`

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Ready for Production Deployment ✅
