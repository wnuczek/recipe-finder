# Ingredient Search Ranked Results Implementation Plan

## Overview

Deliver roadmap slice S-01 as a complete ranked-search flow backed by a real database: users select ingredients, execute search explicitly, and receive deterministic ranked recipes with robust empty/error handling. This plan updates earlier assumptions after codebase verification and expands backend scope to Drizzle + Supabase Postgres per latest decisions.

## Current State Analysis

Backend search foundations already exist (Hono route, ranking utility, and server tests), but they are fixture-backed and not persisted. Frontend still exposes ingredient selection and the Search button shell, yet no search request lifecycle or results rendering is implemented. Frontend test harness and verification docs are also missing.

## Desired End State

Users can press Search and reliably get deterministic ranked results sorted by match count desc, favorites count desc, and title asc, with no-results and inline-retry UX in the home tab. Backend persists recipes and ingredients in Supabase Postgres via Drizzle, the API serves ranked results from repository data, and performance validation enforces p95 <= 1.2s with documented evidence. The plan completes only after automated checks pass and each phase receives explicit manual sign-off.

### Key Discoveries:

- The Search button currently has no execution handler in `app/(tabs)/index.tsx:78`.
- Search ranking already exists and is deterministic in `server/src/search/rank-recipes.ts:11`.
- API validation and response metadata are already present in `server/src/routes/search.ts:15`.
- Server tests already cover happy-path and invalid payload contracts in `server/src/routes/search.test.ts:5`.
- Existing scripts include backend run/lint/test but no frontend test command surface in `package.json:5`.

## What We're NOT Doing

- Recipe details and quantity scaling loop (S-02).
- Auth, user accounts, and personalized ranking.
- Multi-source scraping ingestion.
- Native distribution hardening.

## Implementation Approach

Keep current Hono search API and ranking algorithm, but replace fixture-only data path with Drizzle repositories backed by Supabase Postgres. Harden route contract and observability around persisted data, then integrate frontend search states and result rendering in the home tab. Finish with targeted test coverage and reproducible verification artifacts, preserving a hard p95 performance gate.

## Critical Implementation Details

### Timing & lifecycle

Search remains an explicit button-triggered action only; ingredient edits must never auto-trigger requests. This preserves predictable request boundaries for both UX and manual verification.

### State sequencing

On search submit: clear prior error, set loading, execute request, then atomically commit either success state (results + metadata) or failure state (error + retry context). Do not leave stale results visible after a failed fresh request.

### Data ordering

DB integration must land before route hardening and frontend wiring, so the API contract stabilizes before UI consumes it. Preserve ranking tie-break order exactly while changing storage source.

## Phase 1: Persistence Foundation (Drizzle + Supabase Postgres)

### Overview

Introduce persisted recipe and ingredient data storage with migration and seed workflow, replacing fixture-only runtime dependency.

### Changes Required:

#### 1. Dependency and Config Foundation

**File**: `package.json`

**Intent**: Add persistence dependencies and scripts required for Drizzle migrations, generate, and seed flow.

**Contract**: Introduce script contracts for `db:generate`, `db:migrate`, and `db:seed`; add Drizzle/Postgres client dependencies.

**File**: `.env.example`

**Intent**: Document required database environment variables for local and CI runs.

**Contract**: Declare canonical env keys for Supabase Postgres URL and optional shadow/dev DB values.

**File**: `drizzle.config.ts`

**Intent**: Configure migration output path and schema source for Drizzle CLI.

**Contract**: Points to server schema module and migration directory used by scripted workflows.

#### 2. Schema and Database Access Layer

**File**: `server/src/db/schema.ts`

**Intent**: Define normalized tables for recipes and recipe ingredients, including favorites signal used by ranking.

**Contract**: Schema supports one-to-many recipe -> ingredients relation and stable recipe IDs.

**File**: `server/src/db/client.ts`

**Intent**: Centralize DB client creation and environment validation.

**Contract**: Exposes singleton Drizzle DB handle consumed by repositories.

**File**: `server/src/db/repositories/recipe-repository.ts`

**Intent**: Encapsulate read operations needed by ranked search from persisted tables.

**Contract**: Repository returns normalized recipe entities matching existing ranking input shape.

#### 3. Seed and Verification Baseline

**File**: `server/src/db/seed.ts`

**Intent**: Seed recipes/ingredients and favorites counts aligned with current fixture semantics.

**Contract**: Idempotent seed behavior for repeated local runs.

**File**: `server/src/search/recipes.fixture.ts`

**Intent**: Reclassify fixture use to test/seed source only (not runtime route dependency).

**Contract**: Runtime search route no longer imports fixture directly.

### Success Criteria:

#### Automated Verification:

- Database dependencies install and DB scripts resolve.
- Drizzle migration generation and apply complete without errors.
- Seed script populates expected baseline recipe and ingredient rows.
- Server typecheck/lint pass after DB layer additions.

#### Manual Verification:

- Developer can provision local Supabase Postgres connection with documented env vars.
- Re-running migration and seed is safe and does not duplicate records.
- Seeded data includes favorites counts needed for ranking tie-break behavior.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase. Phase blocks use plain bullets - the corresponding `- [ ]` checkboxes for these items live in the `## Progress` section at the bottom of the plan.

---

## Phase 2: Ranked Search Contract Hardening

### Overview

Switch API search path to persisted repository data while preserving deterministic ranking rules and tightening request/response contracts.

### Changes Required:

#### 1. Repository-Backed Search Route

**File**: `server/src/routes/search.ts`

**Intent**: Replace fixture-backed query path with repository-backed lookup and keep strict payload validation.

**Contract**: Request accepts `ingredients: string[]` (+ optional includeZeroMatches), response preserves ranked shape and metadata.

**File**: `server/src/search/types.ts`

**Intent**: Align API and domain types with repository-backed source and metadata guarantees.

**Contract**: Ranked response contract remains stable for frontend consumption.

#### 2. Ranking Integrity Preservation

**File**: `server/src/search/rank-recipes.ts`

**Intent**: Keep deterministic ordering unchanged while adapting inputs from repository entities.

**Contract**: Sort order remains `(matchCount DESC, favoritesCount DESC, title ASC)`.

**File**: `server/src/search/rank-recipes.test.ts`

**Intent**: Guard existing ordering invariants during storage refactor.

**Contract**: Tests fail on any tie-break regression.

#### 3. Observability and Performance Metadata

**File**: `server/src/routes/search.ts`

**Intent**: Keep timing metadata and structured logs usable for p95 validation.

**Contract**: Response metadata includes duration and candidate counts needed for guardrail verification.

### Success Criteria:

#### Automated Verification:

- Search route tests pass against repository-backed flow.
- Ranking tests confirm tie-break determinism remains unchanged.
- Invalid payload still returns clear 4xx contract.
- Server test/typecheck/lint pipeline remains green.

#### Manual Verification:

- API responds with ranked persisted data for representative ingredient sets.
- Zero-match default behavior returns empty list and accurate metadata.
- Timing metadata is visible and suitable for p95 sampling.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase. Phase blocks use plain bullets - the corresponding `- [ ]` checkboxes for these items live in the `## Progress` section at the bottom of the plan.

---

## Phase 3: Frontend Search UX Integration

### Overview

Implement end-to-end search flow in the home tab with loading, success, empty, and inline retry states.

### Changes Required:

#### 1. API Client and Search State Machine

**File**: `services/search-client.ts`

**Intent**: Isolate API call details and normalize backend errors for UI consumption.

**Contract**: Typed client accepts selected ingredients and returns ranked payload or normalized error.

**File**: `app/(tabs)/index.tsx`

**Intent**: Add explicit search lifecycle states and button-triggered API execution.

**Contract**: Existing ingredient add/remove behavior remains intact; search state transitions are explicit and deterministic.

#### 2. Result and Error Presentation Components

**File**: `components/recipe-result-card.tsx`

**Intent**: Render ranked recipe rows with match and favorites metadata.

**Contract**: Component consumes typed ranked recipe contract and rank position.

**File**: `components/search-error-state.tsx`

**Intent**: Provide inline recoverable error UX with retry hook.

**Contract**: Stateless props include `message` and `onRetry`.

**File**: `app/(tabs)/index.tsx`

**Intent**: Wire no-results and error blocks into lifecycle without losing selected ingredient chips.

**Contract**: Retry executes last search request context; no-results state is explicit.

### Success Criteria:

#### Automated Verification:

- App/server typecheck passes across integration points.
- Lint passes for updated app and component files.
- API client contract assertions pass for success and failure mapping.
- Targeted UI tests cover loading, success, empty, and error/retry states.

#### Manual Verification:

- Search button executes requests only when at least one ingredient is selected.
- Inline retry recovers from simulated API failure without clearing selected chips.
- No-results message appears for zero-match responses and disappears on successful subsequent query.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase. Phase blocks use plain bullets - the corresponding `- [ ]` checkboxes for these items live in the `## Progress` section at the bottom of the plan.

---

## Phase 4: Verification, Performance Gate, and Runbook

### Overview

Finalize reproducible verification workflow, enforce hard p95 gate, and document execution path for future contributors.

### Changes Required:

#### 1. Unified Test and Verification Commands

**File**: `package.json`

**Intent**: Provide deterministic command surface for full validation runs.

**Contract**: Include one-command validation path for server tests, frontend tests, lint, and type checks.

**File**: `jest.config.js`

**Intent**: Introduce frontend test runner config suitable for Expo/React Native component tests.

**Contract**: Supports app/component test files and module alias resolution.

#### 2. Performance Evidence and Reproducibility Docs

**File**: `context/changes/ingredient-search-ranked-results/verification-notes.md`

**Intent**: Record p95 sampling method, sample size, and observed values.

**Contract**: Contains explicit pass/fail statement against p95 <= 1.2s.

**File**: `README.md`

**Intent**: Add concise local instructions for DB setup, migration, seed, API run, and validation commands.

**Contract**: Another contributor can reproduce full search flow setup from docs alone.

### Success Criteria:

#### Automated Verification:

- Full validation command passes consistently.
- Backend and frontend targeted tests pass in local run.
- Typecheck and lint pass after all integrations.
- Ranking contract tests still fail on intentional ordering mutation.

#### Manual Verification:

- Manual timing sample shows p95 <= 1.2s for representative ingredient queries.
- Another developer can follow runbook steps and reproduce end-to-end search flow.
- Human reviewer explicitly approves all phase manual checkpoints.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase. Phase blocks use plain bullets - the corresponding `- [ ]` checkboxes for these items live in the `## Progress` section at the bottom of the plan.

---

## Testing Strategy

### Unit Tests:

- Ranking utility tie-break and rank assignment behavior.
- Repository mapping from DB rows to ranking input contract.
- API client error normalization.

### Integration Tests:

- Search endpoint with persisted seeded data returns stable ranking and metadata.
- Home screen lifecycle transitions across loading/success/empty/error/retry.

### Manual Testing Steps:

1. Seed database, start API, and verify representative ranked responses.
2. Run app search flow, including simulated API failure and retry recovery.
3. Capture and record timing samples, then confirm p95 <= 1.2s.

## Performance Considerations

Ranking remains lightweight for MVP dataset size, but DB access introduces query and serialization overhead. Keep query shape predictable, avoid unnecessary row expansion, and use route metadata/logging to verify p95 compliance under representative local workload.

## Migration Notes

This plan introduces a new persisted storage layer. Rollout order is mandatory: schema/migrations/seed first, then repository-backed route, then frontend integration. If persistence integration blocks timeline, de-scope extra backend enhancements first while preserving core S-01 user flow.

## References

- Roadmap slice: `context/foundation/roadmap.md`
- PRD constraints: `context/foundation/prd.md`
- Lessons: `context/foundation/lessons.md`
- Existing frontend search shell: `app/(tabs)/index.tsx:78`
- Current route contract baseline: `server/src/routes/search.ts:15`
- Current ranking contract baseline: `server/src/search/rank-recipes.ts:11`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Persistence Foundation (Drizzle + Supabase Postgres)

#### Automated

- [x] 1.1 Database dependencies install and DB scripts resolve — 8bb38b0
- [x] 1.2 Drizzle migration generation and apply complete without errors — 8bb38b0
- [x] 1.3 Seed script populates expected baseline recipe and ingredient rows — 8bb38b0
- [x] 1.4 Server typecheck/lint pass after DB layer additions — 8bb38b0

#### Manual

- [x] 1.5 Developer can provision local Supabase Postgres connection with documented env vars — 8bb38b0
- [x] 1.6 Re-running migration and seed is safe and does not duplicate records — 8bb38b0
- [x] 1.7 Seeded data includes favorites counts needed for ranking tie-break behavior — 8bb38b0

### Phase 2: Ranked Search Contract Hardening

#### Automated

- [ ] 2.1 Search route tests pass against repository-backed flow
- [ ] 2.2 Ranking tests confirm tie-break determinism remains unchanged
- [ ] 2.3 Invalid payload still returns clear 4xx contract
- [ ] 2.4 Server test/typecheck/lint pipeline remains green

#### Manual

- [ ] 2.5 API responds with ranked persisted data for representative ingredient sets
- [ ] 2.6 Zero-match default behavior returns empty list and accurate metadata
- [ ] 2.7 Timing metadata is visible and suitable for p95 sampling

### Phase 3: Frontend Search UX Integration

#### Automated

- [ ] 3.1 App/server typecheck passes across integration points
- [ ] 3.2 Lint passes for updated app and component files
- [ ] 3.3 API client contract assertions pass for success and failure mapping
- [ ] 3.4 Targeted UI tests cover loading, success, empty, and error/retry states

#### Manual

- [ ] 3.5 Search button executes requests only when at least one ingredient is selected
- [ ] 3.6 Inline retry recovers from simulated API failure without clearing selected chips
- [ ] 3.7 No-results message appears for zero-match responses and disappears on successful subsequent query

### Phase 4: Verification, Performance Gate, and Runbook

#### Automated

- [ ] 4.1 Full validation command passes consistently
- [ ] 4.2 Backend and frontend targeted tests pass in local run
- [ ] 4.3 Typecheck and lint pass after all integrations
- [ ] 4.4 Ranking contract tests still fail on intentional ordering mutation

#### Manual

- [ ] 4.5 Manual timing sample shows p95 <= 1.2s for representative ingredient queries
- [ ] 4.6 Another developer can follow runbook steps and reproduce end-to-end search flow
- [ ] 4.7 Human reviewer explicitly approves all phase manual checkpoints
