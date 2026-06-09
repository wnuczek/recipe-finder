# Editable Ingredient Quantities — Plan Brief

> Full plan: `context/changes/editable-ingredient-quantities/plan.md`

## What & Why

The user opens a recipe from search results and adjusts any ingredient's quantity; all other quantities recalculate proportionally. This closes the second half of RecipeFinder's core promise (PRD FR-005/FR-006, roadmap slice S-02): not just finding recipes by ingredients, but adapting them to what the user actually has — without manual math.

## Starting Point

S-01 (ranked ingredient search) is live: Hono + Drizzle/Postgres backend on Railway, Zod-validated Expo client, search screen with result cards. But **no quantity data exists anywhere** — the DB stores only ingredient names, there's no recipe-details endpoint, and result cards aren't tappable. This plan builds the entire quantities vertical from schema to screen.

## Desired End State

Tapping a search result opens `/recipe/<id>` showing the full ingredient list with quantities. The user taps +/− on any ingredient (e.g. "I only have 300 g of pasta") and every other supported-unit ingredient rescales with kitchen-sensible rounding. "Do smaku" ingredients stay visible but inert. Originals show subtly while scaled; one tap resets.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Quantity storage | Nullable `amount` + `unit` columns on `recipe_ingredients` | Minimal migration; null pair naturally models non-scalable "to taste" rows |
| Supported units v1 | g, kg, ml, l, szt, łyżka, łyżeczka, szklanka | Covers Polish home-cooking recipes; all scale linearly in one pure function |
| Details data source | New `GET /api/recipes/:id` | Deep-link/refresh-safe on web; search payload stays lean and unchanged |
| Non-scalable ingredients | Visible, non-editable, skipped by scaling | Honest recipe view; UX clearly constrains unsupported units (S-02 risk) |
| Rounding | Smart per-unit (g/ml whole; kg/l 2 dp; szt/kitchen ¼ grid) | Output reads like a real recipe — protects the trust guardrail |
| Input control | Stepper +/− per ingredient (user override of free-text recommendation) | No free-text validation surface; touch-friendly |
| Step sizes | Fixed per unit (g/ml ±10; kg/l ±0.1; szt ±0.5; kitchen ±0.25) | Predictable and aligned with the rounding grid — stepped values never re-round |
| Reset | Original shown per row + reset button | Cheap on base-immutable factor math; recovers any mis-tap |
| Testing | Full pyramid (scaling fn + endpoint + component), wired into `npm run validate` | Scaling math is the trust-critical core; matches every repo test seam |

## Scope

**In scope:** schema migration + reseed with quantities; `GET /api/recipes/:id`; `services/recipe-client.ts` + pure `services/recipe-scaling.ts`; pressable result cards; `app/recipe/[id].tsx` with stepper rows, reset, loading/error states; tests at all three seams.

**Out of scope:** unit conversion (g↔kg), free-text input, persisting scaled state, search ranking/response changes, servings concept, recipe images, multi-source ingest.

## Architecture / Approach

Bottom-up through existing seams: schema/seed → endpoint → client services → UI. The scaling model is **base-immutable**: screen state holds the fetched recipe plus a single `factor`; every displayed amount is `round(base × factor)` per unit rules, and stepping derives a new factor from the edited ingredient's *base* amount — so repeated taps never accumulate rounding drift. All math lives in a pure service module (mirroring `search-state.ts`); components only render.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Data model & seed | `amount`/`unit` columns + 5 quantified recipes | Fixture shape change ripples into search code/tests |
| 2. Details API | `GET /api/recipes/:id` (200/404, numeric amounts) | Drizzle numeric-as-string serialization breaking client Zod |
| 3. Client services | Validated fetcher + pure scaling engine, fully unit-tested | Rounding/step edge cases (clamping, drift) |
| 4. Screen & steppers | Tappable cards → details screen with scaling UX | Input-state wiring; keeping files under 200-line rule |

**Prerequisites:** Railway DB access for migrate/seed; S-01 search flow working locally.
**Estimated effort:** ~2-3 sessions across 4 phases; Phases 1-2 are one sitting, Phase 4 is the largest.

## Open Risks & Assumptions

- Assumes the 5 seed recipes can be quantified sensibly in supported units; compound lines ("1 puszka 400 g") flatten to one canonical amount+unit.
- Until the Railway DB is reseeded post-migration, all ingredients render as non-scalable (graceful degradation, but worth knowing at deploy time).
- Stepper-only input means large jumps (200 g → 500 g) take many taps — accepted with fixed per-unit steps; revisit if manual testing finds it painful.

## Success Criteria (Summary)

- User can tap any search result, see quantities, step any scalable ingredient, and watch all others rescale proportionally with recipe-like rounding.
- Non-scalable ingredients remain visible and clearly inert; reset restores exact originals.
- `npm run validate` passes end-to-end with new tests at server, service, and component seams.
