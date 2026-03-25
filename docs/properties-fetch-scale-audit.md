# Properties Fetch Scale Audit

Date: 2026-03-25
Scope: public `/rooms` listing flow, shared infinite-query hook, and `/api/properties`

## Summary

The public rooms page was already on a decent foundation:

- client requests are debounced
- infinite scrolling uses cursor pagination
- anonymous traffic is cached in Redis

The main scale risks were in the API route:

- authenticated standard browsing bypassed Redis completely
- personalized sorts could scan and rank far more rows than needed
- free-text filters used broad `ilike` OR clauses with no minimum query length
- property list queries selected more data than the listing cards actually need

## Findings

### 1. Authenticated standard browsing was uncached

`/api/properties` only cached anonymous traffic. Signed-in users using normal sorts like newest or price hit Supabase on every request, even when browsing the same filter combination repeatedly.

Risk:

- avoidable database load during normal signed-in browsing
- higher latency under concurrent dashboard/public usage

### 2. Personalized sorts did too much work per request

For `match` and `recommended`, the route:

- scanned compatibility scores in batches
- fetched matching properties repeatedly
- backfilled a large fallback window
- sorted and filtered the combined result in memory

This was functional, but it could become expensive as compatibility rows and listing volume grow.

Risk:

- high per-request cost for personalized feeds
- slower response times under heavier authenticated load

### 3. Text filters were broad and unbounded for very short input

The route applied `ilike` OR clauses across multiple fields for both `location` and `search`.

Risk:

- expensive broad scans for tiny inputs like a single letter
- poor index utilization unless the database is specially tuned

### 4. Property list selects were wider than necessary

The route selected `*` from `properties` for list pages even though cards only use a smaller subset of fields.

Risk:

- larger Supabase payloads
- more parsing and serialization work per request

## Fixes Applied

### Cache policy

- kept anonymous cache at 5 minutes
- added short-lived Redis caching for authenticated non-personalized browsing
- continued to bypass Redis for personalized sorts to avoid user-key explosion from highly individualized ranking

### Standard query path

- narrowed the property list select to the fields used by listing cards and ranking logic
- kept cursor pagination as the primary path

### Personalized query path

- reduced how much score-driven data is collected before evaluating whether enough ranked candidates exist
- added an early-stop preview check so the route stops scanning once it already has enough candidates for the requested page window
- reduced fallback overfetch size and aligned it with the target ranking window instead of always pulling a very large backfill

### Text filtering

- normalized free-text terms with a minimum useful length before applying broad `ilike` filters
- preserved normal multi-field search behavior for real queries

## Residual Notes

- This audit did not validate actual Postgres execution plans or database indexes.
- If listing volume grows substantially, the next likely improvement would be DB-level search/index tuning for `city`, `state`, `title`, and `description`, or moving search onto a dedicated text-search strategy.
- Personalized ranking would scale further if more of the ranking logic moved closer to the database or into precomputed materialized data.
