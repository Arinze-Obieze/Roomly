# Matching And Discovery Implementation Plan

Date: 2026-03-25
Status: In progress
Owner: Product engineering / matching system

## Purpose

This document defines the implementation plan for RoomFind's matching and discovery system.

It covers:

- property-to-seeker matching
- seeker-to-host and host-to-seeker discovery
- private profile and private listing visibility
- ranking and caching strategy
- precomputation strategy
- instrumentation required before ML
- phased migration from the current rule engine to a stronger production system

This plan assumes a user can function as both a seeker and a host.
The system should treat "role" as context for the current surface, not as a hard product identity.

## Current Product Surfaces In Scope

- property discovery:
  - `app/api/properties/route.js`
  - `app/api/properties/[id]/route.js`
- matching recompute:
  - `core/services/matching/recompute-compatibility.service.js`
  - `core/services/matching/bulk-recompute.service.js`
  - `app/api/matching/recompute/route.js`
- people discovery:
  - `app/(dashboard)/find-people/page.js`
  - `app/api/landlord/find-people/route.js`
  - `app/api/seeker/find-landlords/route.js`
  - `app/api/seeker/find-buddies/route.js`
- conversation/contact gates:
  - `app/api/messages/start-conversation/route.js`
  - `app/api/interests/show-interest/route.js`
- ranking/feed logic:
  - `core/services/feeds/rebuild-feed.service.js`
- profile privacy and setup:
  - `app/(dashboard)/profile/page.js`
  - `components/profile/ProfileForm.jsx`
  - `components/profile/SettingsPanel.jsx`

## Product Assumptions

### Two-sided marketplace assumption

RoomFind is not a simple user-to-item recommender.
It is a two-sided marketplace with reciprocal constraints:

- seeker wants a good property or household fit
- host wants a good tenant or flatmate fit
- platform wants a successful match outcome, not only a click

This means discovery must optimize for:

- eligibility
- compatibility
- reciprocal acceptance likelihood
- privacy rules
- conversion quality

### Role assumption

Users may behave as:

- seeker only
- host only
- both seeker and host

`primary_role` may remain useful for onboarding UX, but it must not be treated as the system's source of truth for matching or discovery.

Use "surface context" instead:

- on property discovery, user is acting as seeker
- on tenant discovery, user is acting as host
- on landlord discovery, user is acting as seeker
- on buddy discovery, user is acting as a person seeking person-to-person compatibility

## Current Observations

### What is already working well

- compatibility is precomputed into `compatibility_scores`
- personalized ranking already exists
- cache versioning is already partially used
- private listing visibility already attempts to respect the `70+ match` rule
- landlord-side `find-people` already has some privacy-aware masking behavior

### Current system gaps

#### 1. Matching is not fully consistent across all paths

The same logical match is computed and consumed differently across:

- recompute paths
- property listing ranking
- feed rebuilding
- landlord discovery
- seeker discovery

This creates a risk that "the same match" means different things on different surfaces.

#### 2. Seeker-side people discovery is much less sophisticated than landlord-side

`app/api/seeker/find-landlords/route.js` currently:

- filters by score only
- does not rigorously enforce approval-state parity
- does not model accepted-interest overrides
- does not apply the same reciprocal logic as landlord-side discovery

#### 3. Privacy semantics are fragmented

The codebase currently references:

- `privacy_setting`
- `profile_visibility`

Those must be normalized or clearly mapped.

#### 4. Ranking logic is duplicated

Recommended ranking logic exists in more than one place and is not fully unified.

#### 5. Too much ranking work still happens in request-time flows

The personalized property path still performs score scans, property fetches, fallback backfills, and in-memory ranking during live requests.

#### 6. Current score is a heuristic, not a calibrated probability

The current match value should not be treated as a scientifically calibrated compatibility probability.
It is an interpretable rule-based score.

## Canonical Product Rules

These rules should become the single source of truth.

### Property visibility rules

For anonymous users:

- public approved active properties are visible
- private properties are not visible

For authenticated users:

- public approved active properties are visible
- own approved active properties are visible
- private approved active properties are visible if:
  - user is the owner
  - user has accepted interest
  - user has compatibility score `>= 70`

This rule applies consistently across:

- `/api/properties`
- `/api/properties/[id]`
- personalized ranking
- fallback listing fetches

### Private listing rule

Private listings with `70+` match should show in listing discovery.

They may still be masked until accepted interest if that is the intended product behavior for contact and full reveal.

### Contact rules for properties

For public listings:

- direct contact allowed if `score >= 51`
- otherwise user must show interest first

For private listings:

- user must have accepted interest before direct contact

### People discovery rules

For landlord finding tenants:

- show candidates based on approved active listings only
- allow accepted-interest candidates to remain visible even if score is below threshold
- private seeker profiles should be blurred unless mutual interest or equivalent reveal condition exists

For seeker finding landlords:

- use approved active listings only
- rank by best matched approved listing per host
- private host profiles should be blurred when shown
- private host profiles with `70+` match should still appear in discovery, but masked

### Private profile rule for `find-people`

If a user profile is set to private in the profile/settings flow and the match is `>= 70`, that profile should still be visible in `find-people`, but:

- avatar should be blurred
- name should be masked
- bio should be hidden
- direct "Contact" should not be the primary action
- show "Show Interest" instead

This rule applies especially to:

- private seeker profiles shown to hosts
- private host profiles shown to seekers

If mutual interest or accepted interest exists and the product intends to reveal identity, then the UI may upgrade from:

- blurred + show interest

to:

- revealed + contact

### Buddy discovery rule

Buddy discovery should also respect:

- dual-role product assumption
- privacy masking
- thresholding
- a separate person-to-person compatibility model

It should not be treated as a copy of property matching.

## Desired Architecture

### Matching domain layers

The matching system should be split into four layers:

#### 1. Eligibility layer

Hard filters only.

Examples:

- listing approval status
- active status
- ownership
- privacy gate
- smoking prohibition
- impossible stay duration

#### 2. Feature layer

Shared feature extraction.

Examples:

- seeker features
- host features
- property features
- reciprocal interaction features
- trust and freshness features

#### 3. Scoring layer

Interpretable rule score first, learned reranker later.

Outputs:

- `compatibility_score`
- `confidence_score`
- explanation fields

#### 4. Presentation layer

Applies display decisions:

- blurred or not
- contact vs show-interest CTA
- visible vs not visible

## Implementation Strategy

### Phase 1: Specification and rule consolidation
Status: Completed

Goals:

- create one canonical ruleset
- stop hidden divergence between APIs

Tasks:

- [x] add shared helper for property visibility
- [x] add shared helper for people discovery visibility
- [x] add shared helper for contact eligibility
- [x] add shared helper for profile masking logic
- [x] document all reveal states

Deliverables:

- [x] `core/services/matching/rules/`
- [x] shared tests for visibility and privacy logic

### Phase 2: Normalize privacy and profile semantics
Status: Completed

Goals:

- unify `privacy_setting` and `profile_visibility`
- treat privacy consistently across profile, listings, and people discovery

Tasks:

- [x] choose one canonical profile privacy field
- [x] add compatibility layer if migration is required
- [x] update all people discovery surfaces to use the same privacy source
- [x] add shared function:
  - `getPeopleDiscoveryVisibility({ isPrivateProfile, hasMutualInterest, matchScore })`

Required behavior:

- private profile + `70+` match => show blurred card with `Show Interest`
- private profile + mutual accepted relationship => reveal identity and allow `Contact`

Database note:

- [x] if `My Interests` needs to support both property interests and person-to-person interests, add a separate `people_interests` table instead of overloading `property_interests`
- [x] keep `property_interests` for seeker -> property workflows
- [x] use `people_interests` for host -> seeker, seeker -> host, and later buddy interest workflows

### Phase 3: Fix correctness gaps in the current system
Status: Completed

Goals:

- make current behavior correct before adding complexity

Tasks:

- [x] recompute only for approved active listings unless there is a deliberate admin-only reason not to
- [x] ensure seeker `find-landlords` only uses approved active listings
- [x] ensure `find-landlords` and `find-people` use parallel business logic
- [x] ensure accepted-interest override behavior is explicit and shared
- [x] ensure all sorting paths honor the same visibility rules for private listings

Specific fixes:

- [x] tighten `recomputeForSeeker` listing eligibility
- [x] tighten seeker-side landlord fetch query
- [x] move visibility rules out of ad hoc route code into shared helpers

### Phase 4: Unify ranking formulas
Status: Completed

Goals:

- same "recommended" meaning everywhere
- no duplicate ranking implementations

Tasks:

- [x] move ranking formulas into one shared module
- [x] unify:
  - compatibility ranking
  - recommended ranking
  - diversity logic if retained
- [x] add test vectors

Deliverables:

- [x] `core/services/matching/ranking/`
- [x] one shared `computeRecommendedScore`
- [x] one shared tie-break order

### Phase 5: Introduce feature snapshots and precompute
Status: Partially completed

Goals:

- reduce request-time compute
- create ML-ready features

Recommended tables or materialized views:

- `matching_user_features`
- `matching_property_features`
- `matching_host_features`
- optional `matching_pair_features`

Suggested contents:

- normalized city/location signals
- budget bands
- stay windows
- room/property type features
- lifestyle facets
- profile completion state
- trust indicators
- listing freshness
- interaction history aggregates

Tasks:

- [x] compute snapshots on profile/listing updates
- [x] compute pairwise compatibility only for eligible candidate sets
- [x] store top-K results for hot surfaces

### Phase 6: Redesign personalized caching
Status: Completed

Goals:

- avoid broad invalidation scans
- cache personalized discovery efficiently

Guiding principle:

- versioned keys by domain
- avoid pattern invalidation in hot paths

Recommended key families:

- `v:properties:global`
- `v:properties:user:{userId}`
- `v:find_people:host:{userId}`
- `v:find_people:seeker:{userId}`
- `v:profile_visibility:{userId}`
- `v:matching:user:{userId}`
- `v:matching:property:{propertyId}`

Recommended cache objects:

- property list page payloads
- people discovery payloads
- top-K candidate IDs and scores

Notes:

- [x] continue bypassing cache for truly unstable paths if needed
- [x] prefer invalidating via version bumps after recompute or privacy changes

### Phase 7: Instrument outcomes for evaluation
Status: Partially completed

Goals:

- make future ML meaningful
- measure ranking quality

Track events per surface:

- [x] impression
- [x] position shown
- [x] card click
- [x] show interest
- [x] interest accepted
- [x] conversation started
- [x] first reply
- [x] inspection requested
- [x] inspection completed
- [ ] tenancy success outcome if available

Recommended metadata:

- [x] surface
- [x] tab
- [x] property id
- [x] user id
- [x] target id
- [x] match score shown
- [x] blurred or revealed
- [x] CTA shown
- [x] rank position
- [x] privacy state
- [x] profile completeness state

### Phase 8: Heuristic v2
Status: Partially completed

Goals:

- improve quality before ML
- keep explainability

Add features currently underused or missing:

- [x] schedule compatibility
- [x] social-level compatibility
- [x] noise compatibility
- [x] interests overlap
- [x] actual host lifestyle friction
- [x] stronger reciprocal acceptance signals

Split outputs:

- [x] `compatibility_score`
- [x] `confidence_score`

Reason:

- sparse profiles should not receive overconfident scores

### Phase 9: First ML reranker

Goals:

- improve conversion quality without replacing core product rules

Recommended first model:

- CatBoost or XGBoost on tabular reciprocal features

Recommended first target:

- accepted interest or conversation started

Hard rules remain outside the model:

- approval
- active state
- privacy
- eligibility

Serving pattern:

- generate candidates with rules and precomputed shortlist
- rerank top N only

### Phase 10: Optional hybrid recommender

Only after more interaction data exists:

- LightFM for hybrid metadata + implicit feedback
- Implicit ALS/BPR for fast candidate generation baselines
- pgvector only if semantic similarity or ANN retrieval becomes necessary

## Detailed Behavior For `find-people`

### Current target behavior

#### Tab: Find Tenants

Actor context:

- current user is acting as host

Data source:

- current user's approved active listings
- scored compatible seekers
- accepted interests override threshold

Privacy behavior:

- public seeker profile => normal card
- private seeker profile + no mutual reveal => blurred card + `Show Interest`
- private seeker profile + mutual reveal => normal card + `Contact`

CTA behavior:

- revealed and contact-eligible => `Contact Seeker`
- private and not yet revealed => `Show Interest`

#### Tab: Find Landlords

Actor context:

- current user is acting as seeker

Data source:

- best matched approved active listing per host
- score threshold still applies

Privacy behavior:

- public host profile => normal card
- private host profile + no mutual reveal => blurred card + `Show Interest`
- private host profile + mutual reveal => normal card + `Contact`

CTA behavior:

- revealed and contact-eligible => `Contact Landlord`
- private and not yet revealed => `Show Interest`

### Important note

For people discovery, showing a blurred profile with `Show Interest` is the preferred product pattern for private profiles with strong matches.
This preserves discovery value without breaking privacy expectations.

## Detailed Behavior For Property Sorting

### Listing sorts in scope

- newest
- price low
- price high
- match
- recommended

### Rule for private listings

Private listings with `70+` match should be eligible to appear in listing discovery for authenticated users.

This must remain true in:

- standard query path
- personalized match sorting
- personalized recommended sorting
- pagination
- fallback backfills

### Ranking policy

Candidate generation and ranking should be separated:

- candidate generation determines what is eligible to be ranked
- ranking determines display order among eligible items

This is the same high-level system pattern described in industrial recommendation systems research.

## Best-Practice Guidance And Research Direction

The recommended architecture for RoomFind is:

- eligibility filtering
- candidate generation
- ranking
- presentation/privacy masking

This aligns with two-stage recommendation system practice.

Useful references:

- Covington et al., Deep Neural Networks for YouTube Recommendations
- Cheng et al., Wide & Deep Learning for Recommender Systems
- Rendle et al., Bayesian Personalized Ranking from Implicit Feedback
- reciprocal recommender systems literature for two-sided marketplaces

RoomFind should be treated as:

- a reciprocal recommendation problem
- with marketplace and privacy constraints
- not just a generic item recommender

## Proposed File And Module Structure

Suggested new modules:

- `core/services/matching/rules/property-visibility.js`
- `core/services/matching/rules/people-visibility.js`
- `core/services/matching/rules/contact-eligibility.js`
- `core/services/matching/scoring/compatibility-score.js`
- `core/services/matching/scoring/recommended-score.js`
- `core/services/matching/features/build-user-features.js`
- `core/services/matching/features/build-property-features.js`
- `core/services/matching/features/build-pair-features.js`
- `core/services/matching/presentation/mask-person-card.js`
- `core/services/matching/presentation/person-cta-state.js`

## Testing Plan

Required automated tests:

- private listing visibility for anonymous vs authenticated users
- private listing visibility when score is `69` vs `70`
- accepted interest override behavior
- contact gate behavior for `50` vs `51`
- people discovery blur behavior
- people discovery CTA behavior:
  - blurred private => `Show Interest`
  - revealed mutual => `Contact`
- same candidate visibility in both standard and personalized listing paths
- same ranking formula output in API and feed paths

## Implementation Order

1. [x] Add this spec and review it.
2. [x] Normalize privacy and visibility rules.
3. [x] Fix current correctness gaps.
4. [x] Unify ranking formulas.
5. [x] Add shared people-card masking and CTA state.
6. [x] Add feature snapshots and precompute pipeline.
7. [~] Add event instrumentation.
8. [~] Ship heuristic v2.
9. [ ] Add ML reranker.

## Immediate Next Implementation Slice

The first code implementation should focus on the highest-signal, lowest-risk slice:

- [x] shared privacy and reveal helper for people discovery
- [x] update `find-people` APIs to return CTA state
- [x] update `FindTenantsSection` and `FindLandlordsSection` to show:
  - blurred private profile cards
  - `Show Interest` instead of `Contact` when private and not revealed
- [x] tighten seeker-side landlord discovery to approved active listings only
- [x] add tests for private `70+` profile discovery behavior

## Progress Notes

- [x] Shared property visibility/contact rules implemented
- [x] Shared people discovery visibility/reveal rules implemented
- [x] Private profile reveal flow implemented with `people_interests`
- [x] `My Interests` now supports both property and person interests
- [x] Recommended score unified across listing and feed paths
- [x] Versioned cache strategy applied across matching, interests, and superadmin maintenance paths
- [x] Recompute pipeline tightened for approved/active listing eligibility and preference-only seekers
- [x] Property and people discovery now expose confidence and explanation data
- [x] Chat entry now shows match context
- [x] Superadmin dashboard now shows match quality funnel summary
- [x] Feature snapshots/materialized matching feature tables
- [x] Top-K precompute artifacts for hot surfaces
- [ ] Full threshold calibration based on longer-run production outcomes

## Decision Log

### Decision: Private profiles may still appear when strongly matched

Reason:

- preserves discovery quality
- aligns with marketplace dynamics
- respects privacy by masking identity and switching CTA to `Show Interest`

### Decision: Dual-role assumption is canonical

Reason:

- product already behaves this way in multiple surfaces
- hard-coding users into one role creates poor edge-case behavior

### Decision: Rule engine stays during early implementation

Reason:

- deterministic
- debuggable
- easy to explain
- strong fallback even after ML is added

## Exit Criteria Before ML

Do not move to ML until the following are true:

- visibility rules are unified
- ranking logic is unified
- privacy masking is consistent
- people discovery uses the same core rules on both sides
- event logging is in place
- offline evaluation data exists
