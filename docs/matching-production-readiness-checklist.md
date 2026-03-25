# Matching Production Readiness Checklist

Use this before rolling out the matching/discovery system broadly.

## Pre-Deploy Checks

- [ ] `npm run test:unit` passes on the release commit
- [ ] `npm run build` passes on the release commit
- [ ] staging and production env vars are correct:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SECRET_SERVICE_ROLE_KEY`
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] all required migrations are applied:
  - [ ] [20260325000100_create_people_interests.sql](/home/arinze/Desktop/Programming/Works/roomFind/supabase/migrations/20260325000100_create_people_interests.sql)
  - [ ] [20260325000200_create_matching_feature_snapshots.sql](/home/arinze/Desktop/Programming/Works/roomFind/supabase/migrations/20260325000200_create_matching_feature_snapshots.sql)
- [ ] snapshot tables exist and are writable:
  - [ ] `matching_user_features`
  - [ ] `matching_property_features`
- [ ] `people_interests` table exists with RLS enabled
- [ ] Redis is reachable, or graceful cache fallback is acceptable

## Data and Schema Checks

- [ ] no live code path depends on `users.occupation`
- [ ] `user_lifestyles.occupation` is the only occupation source in use
- [ ] `compatibility_scores` contains current rows for active test users
- [ ] profile updates create or refresh matching snapshots
- [ ] property creation/approval/update refreshes snapshots and shortlist artifacts
- [ ] superadmin hardening tasks are complete in [superadmin-hardening-todo.md](/home/arinze/Desktop/Programming/Works/roomFind/docs/superadmin-hardening-todo.md)
- [ ] superadmin property approve/reject/suspend actions refresh discovery artifacts immediately
- [ ] superadmin role updates stay consistent between `users.is_superadmin` and auth metadata

## Monitoring Readiness

- [ ] logging is enabled for API errors
- [ ] monitor 5xx rates on:
  - [ ] `/api/properties`
  - [ ] `/api/properties/[id]`
  - [ ] `/api/landlord/find-people`
  - [ ] `/api/seeker/find-landlords`
  - [ ] `/api/interests/show-interest`
  - [ ] `/api/messages/send`
- [ ] monitor Redis abort/timeout spikes
- [ ] monitor slow Supabase queries
- [ ] monitor analytics insert failures

## Rollback Readiness

- [ ] previous deployment artifact is available
- [ ] rollback owner is identified
- [ ] emergency fallback plan exists for disabling people discovery surfaces
- [ ] migrations are backward-compatible enough for app rollback

## Staging Smoke Pass

### 1. Auth and Profile Setup

- [ ] sign in as a seeker test user
- [ ] sign in as a host test user
- [ ] create one incomplete-profile user
- [ ] create one complete-profile user
- [ ] confirm incomplete-profile user sees gating, not crashes

### 2. Property Discovery

- [ ] anonymous `/api/properties` only returns public listings
- [ ] authenticated `/api/properties?sortBy=newest` works normally
- [ ] authenticated `/api/properties?sortBy=match` works normally
- [ ] authenticated `/api/properties?sortBy=recommended` works normally
- [ ] property list caching behaves as expected for standard sorts
- [ ] personalized match/recommended paths bypass stale-list caching as intended

### 3. Private Listing Visibility

- [ ] private listing below threshold and no accepted interest is blocked
- [ ] private listing at `70+` match appears but stays masked
- [ ] accepted interest reveals private listing correctly
- [ ] owner can always view own private listing

### 4. Listing Details

- [ ] property detail endpoint loads successfully for public listing
- [ ] property detail cache works across repeated opens
- [ ] host details are masked correctly on private listings before reveal
- [ ] match reasons on cards/details are varied and not all identical

### 5. Show Interest Flow

- [ ] seeker cannot show interest in own property
- [ ] inactive listing rejects interest
- [ ] missing lifestyle blocks interest submission
- [ ] public listing with score `<= 50` results in `pending`
- [ ] public listing with score `>= 51` results in `accepted`
- [ ] private listing results in `pending`
- [ ] duplicate interest submission is idempotent and does not 500

### 6. People Discovery

- [ ] host `find-people` loads matched seekers
- [ ] seeker `find-landlords` loads matched landlords
- [ ] private profiles are blurred before reveal
- [ ] accepted reveal switches CTA to contact state
- [ ] people discovery pages do not 500 when occupation is missing from `users`
- [ ] shortlist/precompute fallback still works if Redis is cold

### 7. Interests Dashboard

- [ ] property interests render correctly
- [ ] people interests render correctly
- [ ] counterpart occupation renders safely without `users.occupation`
- [ ] accept/reject updates work correctly
- [ ] accepted people interest reveals profile state correctly

### 8. Messaging

- [ ] start conversation works from valid contexts
- [ ] direct contact is blocked when rules require interest first
- [ ] sending a message works
- [ ] first reply from the other party works
- [ ] no duplicate/invalid first-reply analytics behavior

### 9. Matching Maintenance

- [ ] seeker recompute works
- [ ] property recompute works
- [ ] property edit triggers artifact refresh
- [ ] property approval triggers recompute and shortlist refresh
- [ ] superadmin property status change updates discoverability correctly

### 10. Analytics and Admin

- [ ] impression events are logged
- [ ] click events are logged
- [ ] show-interest events are logged
- [ ] interest-accepted events are logged
- [ ] start-conversation events are logged
- [ ] first-reply events are logged
- [ ] inspection events are logged
- [ ] superadmin match funnel metrics load successfully
- [ ] superadmin property approve/reject/suspend actions complete without CSRF failures
- [ ] superadmin role grant/revoke works and remains effective after a fresh login

## Go / No-Go Rules

### Go

- [ ] no privacy leaks found
- [ ] no blocking 5xx errors in main discovery flows
- [ ] no broken contact-gating behavior
- [ ] recompute and refresh flows behave correctly
- [ ] analytics and metrics work at a basic operational level

### No-Go

- [ ] any private listing/profile visibility leak
- [ ] repeated 500s on discovery routes
- [ ] broken show-interest state logic
- [ ] broken messaging/contact gate
- [ ] artifact refresh failures after property/profile changes
