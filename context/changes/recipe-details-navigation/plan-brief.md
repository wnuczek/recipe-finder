# Recipe Details Navigation — Plan Brief

> Full plan: `context/changes/recipe-details-navigation/plan.md`

## What & Why

Users can find recipes (S-01) but tapping a result does nothing — the core loop "find → open → adapt" dead-ends at the list. This change delivers FR-005: tap a ranked result and open a recipe details screen, while laying the quantities/units data foundation the upcoming scaling change (FR-006) will compute on.

## Starting Point

S-01 is implemented and reviewed: ranked search backed by Drizzle + Supabase Postgres via a Hono API, with a hardened response contract. The DB stores ingredient *names only*; there is no details route, no `GET /api/recipes/:id`, and the result card has no press handler.

## Desired End State

Tapping a card pushes a full-screen `/recipe/<id>` over the tab bar, painting instantly from the in-memory search snapshot and filling per-ingredient amounts/units from a new details endpoint. Refresh and deep links work standalone on the web target. Unknown ids get a friendly not-found state; failures get inline error + Retry, matching S-01's UX language.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Content scope | Add quantities/units to schema now (no instructions, no scaling math) | Details screen looks complete and the scaling change becomes pure UI/logic. | Plan |
| Data source | Fetch by id, seeded instantly from in-memory snapshot | Web target needs self-sufficient URLs; snapshot keeps perceived navigation instant. | Plan |
| Route placement | Root stack `app/recipe/[id].tsx` | Standard master→detail push, clean web URL, full screen for cooking. | Plan |
| Failure UX | Not-found vs retryable error, S-01 inline-retry pattern | Consistent with the error semantics users already learned in S-01. | Plan |
| Quantity model | Numeric nullable `amount` + constrained `unit` (supported-units module) | FR-006's "supported units" boundary stays explicit; scaling becomes pure multiplication. | Plan |
| S-01 contract | Search response frozen (names only) | Zero risk to the reviewed, p95-gated S-01 surface; small details payload. | Plan |
| p95 policy | Hard gate ≤ 700ms with documented evidence | Follows the S-01 hard-gate precedent for PRD guardrails. | Plan |
| Test depth | Match S-01 per layer (route, client, state, component) | Each new surface gets the coverage its S-01 sibling already has. | Plan |

## Scope

**In scope:**

- `recipe_ingredients` migration: nullable numeric `amount` + `unit`, supported-units module, reseeded quantities
- `GET /api/recipes/:id` (200 / 404 / 400) with timing log + route tests
- Typed details client, snapshot cache, details state module
- `app/recipe/[id].tsx` + details components, press wiring on `RecipeResultCard`
- p95 ≤ 700ms evidence against the Railway deployment

**Out of scope:**

- Scaling math / editable quantities (next S-02 sub-slice)
- Instructions/steps, images, favorites actions
- Any change to the S-01 search response contract
- DB-level unit enums, new state libraries

## Architecture / Approach

One new vertical slice following S-01's layering: schema/seed → repository `getRecipeById` → Hono route module → zod-validated client → root-stack screen. The screen renders from two sources: module-level snapshot cache (instant, names-only) and the fetch (source of truth with amounts). Route files stay thin; presentation lives in `components/`, transitions in pure `services/` modules per lessons.md.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Quantities Data Foundation | Migration, supported units, reseeded fixture, `getRecipeById` | Drizzle numeric→string mapping gotcha; seed authoring quality |
| 2. Recipe Details Endpoint | `GET /api/recipes/:id` + tests + timing log | 404/400 contract drift from client expectations |
| 3. Navigation + Details Screen | Tap wiring, client, snapshot cache, screen with all states | Stateful screen branching (snapshot × fetch × errors) |
| 4. Verification & p95 Evidence | `npm run validate` green, prod migration/reseed, p95 doc | Gate measured against un-migrated deploy invalidates evidence |

**Prerequisites:** local Postgres env from S-01 works (`db:migrate`/`db:seed`), Railway access for production migration + measurement.
**Estimated effort:** ~3-4 implementation sessions across 4 phases.

## Open Risks & Assumptions

- Seed quantities are authored by hand — unrealistic amounts would undermine trust once scaling lands; review during Phase 1 manual sign-off.
- Railway round-trip latency is outside our control; if p95 > 700ms the gate forces optimization (or an explicit, documented decision) before close-out.
- Assumes Expo Router web deep-linking to `/recipe/[id]` works in the current export setup; verified in Phase 3 manual checks.

## Success Criteria (Summary)

- User taps any ranked result and gets a details screen with title and ingredient quantities; back returns to intact results.
- Details URLs survive refresh/deep-link on web; unknown ids and failures degrade gracefully with retry.
- `npm run validate` green and documented p95 ≤ 700ms for the details endpoint on the deployed backend.
