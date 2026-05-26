# Ingredient Search Ranked Results - Plan Brief

> Full plan: `context/changes/ingredient-search-ranked-results/plan.md`

## What & Why

This update delivers S-01 as a real end-to-end search slice with persisted backend data, deterministic ranking, and complete home-screen search UX. We are replanning because the repository already contains partial backend work, so the goal is to finish the slice with stable contracts instead of rebuilding from stale assumptions.

## Starting Point

The backend already has a Hono search route, ranking utility, and server tests, but it still depends on fixture data rather than database persistence. The frontend home screen still has ingredient selection and a Search button shell, yet no request lifecycle, result rendering, or retry/error behavior.

## Desired End State

Users search by selected ingredients and receive deterministic ranked results with explicit empty/error handling and inline retry. Backend reads from Supabase Postgres through Drizzle repositories while preserving ranking order and route contract shape. Verification includes mandatory phase-by-phase manual sign-off and a hard p95 <= 1.2s performance gate with documented evidence.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Complexity depth | Medium-depth planning rounds | Existing partial implementation reduces unknowns, but DB introduction and UX integration still create cross-surface risk. | Plan |
| Backend scope | Expand backend in this change | You explicitly chose to include backend expansion rather than freeze current API surface. | Plan |
| Persistence stack | Drizzle + Supabase Postgres | You requested real table-backed storage, and this aligns with scalable API direction. | Plan |
| Zero-match behavior | Empty results by default | Preserves relevance quality and matches current ranking semantics. | Plan |
| Failure UX | Inline error with retry | Keeps user context and supports quick recovery without disruptive navigation. | Plan |
| Performance policy | Hard p95 <= 1.2s gate | Enforces PRD guardrail as a release condition, not a best-effort metric. | Plan |
| Manual QA policy | Mandatory per-phase sign-off | Ensures each phase is human-verified before progressing. | Plan |
| Time-pressure tradeoff | De-scope test depth first if needed | Reflects your stated priority when schedule pressure appears. | Plan |

## Scope

**In scope:**

- Drizzle + Supabase Postgres schema/migrations/seed for recipes and ingredients.
- Repository-backed ranked search API with deterministic tie-break order.
- Home tab search lifecycle with loading/success/empty/error/retry states.
- Targeted automated tests and full manual verification checkpoints.
- Performance evidence documentation for p95 gate.

**Out of scope:**

- Recipe details/scaling flow (S-02).
- Auth and personalized ranking.
- Multi-source scraping.
- Native app hardening.

## Architecture / Approach

A persisted data layer (Supabase Postgres + Drizzle) becomes the source of truth for searchable recipes and ingredients. The Hono route stays as the API boundary, ranking remains deterministic in a shared utility, and the Expo home screen consumes a typed search client to render controlled UX states. Validation closes with reproducible runbook and hard performance acceptance.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Persistence Foundation | Drizzle config, schema, migrations, seed, repository baseline | DB setup/migration friction can slow early momentum |
| 2. Search Contract Hardening | Repository-backed route with preserved ranking contract and metadata | Contract drift while swapping data source |
| 3. Frontend UX Integration | Search execution and result/error/empty/retry states in home tab | Async state bugs and stale UI transitions |
| 4. Verification and Runbook | Unified checks, hard p95 validation, reproducible docs | Final quality gate fails late if verification is weak |

**Prerequisites:** Supabase project/credentials, local env setup, npm install, agreement on manual sign-off gate.
**Estimated effort:** ~4-6 implementation sessions across 4 phases.

## Open Risks & Assumptions

- Drizzle + Supabase onboarding may add setup overhead in an Expo-first repo.
- Hard p95 gate can fail locally if sampling method is inconsistent.
- Reducing test depth under time pressure increases regression risk and must be explicitly documented if used.

## Success Criteria (Summary)

- Users can execute ingredient search and receive deterministic ranked results with clear empty/error/retry behavior.
- API reads from persisted DB tables while preserving current ranking and response contracts.
- Automated checks pass and manual sign-offs are completed for each phase, including documented p95 <= 1.2s evidence.
