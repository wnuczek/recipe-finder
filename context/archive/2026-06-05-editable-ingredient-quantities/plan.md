# Editable Ingredient Quantities Implementation Plan

## Overview

Implement the recipe-details half of the core product loop (PRD FR-005/FR-006, roadmap S-02 outcome): the user taps a search result, opens a recipe details screen, adjusts any ingredient's quantity with stepper buttons, and every other supported-unit ingredient recalculates proportionally. Non-scalable ingredients stay visible but inert. Originals remain recoverable via a reset action.

## Current State Analysis

- **No quantity data exists.** `server/src/db/schema.ts:9-20` stores only `(recipeId, ingredient)` name pairs; `server/src/search/recipes.fixture.ts` seeds 5 recipes with name-only ingredient arrays; `Recipe.ingredients` is `string[]` (`server/src/search/types.ts:1-6`).
- **No details endpoint.** API surface is `GET/POST /api/recipes/search` and `GET /api/ingredients` (`server/src/routes/search.ts:118-178`).
- **No details screen or navigation.** `components/recipe-result-card.tsx:11-40` is purely presentational (no tap handler); `app/modal.tsx` is scaffold; no `app/recipe/` route.
- **Established patterns to reuse:** pure-function state modules (`services/search-state.ts`), Zod-validated fetch client with typed errors (`services/search-client.ts:31-82`), vitest for server+services, jest-expo for components, themed UI via `useThemeColor` + `ThemedText`/`ThemedView`.
- **Backend runs on Railway with Postgres via Drizzle** (`drizzle-kit generate` + `npm run db:migrate` + `npm run db:seed` scripts in `package.json`).

## Desired End State

The user searches, taps a result, lands on `/recipe/<id>`, sees the full ingredient list with quantities, taps +/− on any scalable ingredient, watches all other scalable ingredients rescale proportionally with kitchen-sensible rounding, sees the original amounts subtly per row while scaled, and can reset to originals. Verified by `npm run validate` passing with new tests across all three seams (server route, services, component) plus manual walkthrough on web.

### Key Discoveries:

- Client search Zod schema pins `ingredients: z.array(z.string())` (`services/search-client.ts:63`) — the search response contract must NOT change shape, which the chosen detail-endpoint design respects.
- `services/search-state.ts` proves the repo's preferred pattern: immutable pure functions consumed by `useState` in the screen — the scaling engine should follow it.
- Drizzle `numeric` columns deserialize as strings in JS; the details API must emit real numbers or the client Zod `z.number()` validation fails (see Critical Implementation Details).
- `client:test` and `app:test` scripts enumerate test files explicitly (`package.json:18,19`) — new test files must be added to those script lines or they silently never run.

## What We're NOT Doing

- No unit conversion between units (g↔kg, ml↔szklanka). Scaling multiplies within each ingredient's own unit only.
- No free-text quantity input — steppers only (user decision).
- No persistence of scaled state (navigating away discards the factor; re-open restores originals).
- No changes to search ranking, search response shape, or the search screen beyond making result cards pressable.
- No servings-count concept, no recipe images, no favorites mutation, no multi-source ingest (PRD non-goals).
- No global state library — local screen state + pure functions, per existing pattern.

## Implementation Approach

Bottom-up through the existing seams: (1) extend the data model and seed with `amount`/`unit`, (2) add `GET /api/recipes/:id`, (3) build the client fetcher and a pure scaling engine in `services/`, (4) wire the screen, navigation, and stepper UI. The scaling model is **base-immutable**: the screen holds the fetched recipe (never mutated) plus a single `factor` number; every displayed amount is `round(base.amount × factor)` per unit rules. Stepping an ingredient derives a new factor from that ingredient's base amount, so repeated steps never accumulate rounding drift.

Supported units (canonical lowercase tokens stored in DB and used by the client dictionary): `g`, `kg`, `ml`, `l`, `szt`, `łyżka`, `łyżeczka`, `szklanka`.

| Unit | Stepper step | Display rounding |
| --- | --- | --- |
| g, ml | ±10 | whole number |
| kg, l | ±0.1 | 2 decimals |
| szt | ±0.5 | nearest 0.25 |
| łyżka, łyżeczka, szklanka | ±0.25 | nearest 0.25 |

## Critical Implementation Details

- **No-drift factor math**: state stores `factor` only. On step: `newAmount = displayedAmount(ingredient, factor) ± step`, then `newFactor = newAmount / ingredient.baseAmount`. Never multiply the current factor by a delta and never write rounded values back into ingredient state — that compounds rounding error across taps.
- **Search contract freeze**: the search response must keep `ingredients: string[]`. The client schema at `services/search-client.ts:63` rejects anything else, and Phase 1 changes the fixture shape that the search code reads — the search path must map ingredient objects back to names.
- **Drizzle numeric serialization**: Drizzle's `numeric` type returns strings. Use `doublePrecision` for the `amount` column (or parse explicitly in the route) so the JSON response carries numbers; the client validates `amount: z.number().nullable()`.
- **Stepper clamping**: decrement must be disabled (not clamped to 0) when `displayedAmount − step ≤ 0`. A zero or negative edited amount would produce factor ≤ 0 and zero out the whole recipe.

## Phase 1: Data model & seed quantities

### Overview

Add nullable `amount` + `unit` columns to `recipe_ingredients`, extend the fixture/seed with realistic quantities for all 5 recipes, and keep the existing search path emitting name-only arrays.

### Changes Required:

#### 1. Schema migration

**File**: `server/src/db/schema.ts`

**Intent**: Add nullable quantity columns so each ingredient row can carry an amount in a supported unit, with `(null, null)` meaning a non-scalable ingredient ("do smaku").

**Contract**: `recipeIngredientsTable` gains `amount: doublePrecision("amount")` (nullable) and `unit: text("unit")` (nullable). Invariant: `amount` and `unit` are either both set or both null — enforced at seed/route level (a DB CHECK is optional). Generate the migration with `npm run db:generate`.

#### 2. Supported-units constant (server)

**File**: `server/src/search/units.ts` (new)

**Intent**: One canonical list of supported unit tokens for seed validation and the details route, so an unsupported unit can never enter the DB silently.

**Contract**: `export const SUPPORTED_UNITS = ["g","kg","ml","l","szt","łyżka","łyżeczka","szklanka"] as const;` plus the derived `SupportedUnit` type.

#### 3. Fixture & seed update

**File**: `server/src/search/recipes.fixture.ts`, `server/src/db/seed.ts`

**Intent**: Extend each of the 5 fixture recipes so every ingredient becomes `{ name, amount, unit }` with realistic Polish home-cooking quantities; include at least 2 non-scalable ingredients across the set (e.g. `sól` → `(null, null)`) and at least one of each unit family (mass, volume, szt, kitchen measure) so scaling/rounding paths all have data. Seed writes the new columns.

**Contract**: fixture ingredient shape changes from `string` to `{ name: string; amount: number | null; unit: SupportedUnit | null }`. Every consumer of the fixture (search loading, seed, existing tests) must be updated to read `.name` where it previously read the string. Search response shape stays `ingredients: string[]`.

#### 4. Search path compatibility

**File**: `server/src/search/*` (wherever recipes are loaded/mapped — follow compiler errors from the fixture shape change), `server/src/search/types.ts`

**Intent**: Keep ranked search behavior and response identical. Introduce a `RecipeDetail` type carrying full ingredient objects; the search-facing `Recipe` keeps (or maps to) name-only arrays.

**Contract**: `server/src/search/types.ts` adds `RecipeIngredient = { name: string; amount: number | null; unit: string | null }` and `RecipeDetail = { id; title; favoritesCount; ingredients: RecipeIngredient[] }`. Existing `Recipe`/`RankedRecipe` keep `ingredients: string[]`.

### Success Criteria:

#### Automated Verification:

- Migration generates and applies cleanly: `npm run db:generate && npm run db:migrate`
- Seed runs: `npm run db:seed`
- Server suite passes (existing search tests green after fixture shape change): `npm run server:test`
- Type checks pass: `npm run server:typecheck && npm run typecheck`
- Lint passes: `npm run server:lint && npm run lint`

#### Manual Verification:

- Inspect DB (or seed output) — all 5 recipes have amounts/units, non-scalable rows are `(null, null)`, no unit outside `SUPPORTED_UNITS`
- Existing search flow in the app still returns identical-looking results

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: Recipe details API

### Overview

Add `GET /api/recipes/:id` returning the full recipe with ingredient quantities, following the existing Hono route + Zod conventions in `server/src/routes/search.ts`.

### Changes Required:

#### 1. Details route

**File**: `server/src/routes/recipes.ts` (new), registered in the server entry (`server/src/index.ts` or wherever `search` routes are mounted)

**Intent**: Fetch one recipe by id with its ingredients (amounts + units) from Postgres; 404 with the established error envelope when the id doesn't exist.

**Contract**: `GET /api/recipes/:id` → `200 { recipe: RecipeDetail }` | `404 { error: ... }` (mirror the error shape used by search routes). Ingredient `amount` must serialize as a JSON number or null, never a string. Response ingredient order should be stable (insertion/alphabetical — pick one and keep it deterministic for tests).

> **Addendum (impl-review 2026-06-09):** The detail fetch (`getRecipeById`) landed in `server/src/db/repositories/recipe-repository.ts` alongside its siblings `listRecipesForSearch`/`listIngredients`, not under `server/src/search/*` as the plan's path hint guessed — the repository is the actual data-access home in this codebase. The route is registered in `server/src/app.ts`. The route also adds defensive `400` (empty id) and `500` branches (with matching tests), consistent with the mirrored search route. Both are intended realizations, not drift.

#### 2. Route tests

**File**: `server/src/routes/recipes.test.ts` (new — mirror the location/style of existing search route tests)

**Intent**: Lock the contract: 200 happy path with full ingredient objects (including a null-amount row), 404 for unknown id, numeric `amount` type assertion.

**Contract**: vitest, runs under existing `npm run server:test` glob (`server/vitest.config.ts`).

### Success Criteria:

#### Automated Verification:

- Server tests pass including new route tests: `npm run server:test`
- Type check passes: `npm run server:typecheck`
- Lint passes: `npm run server:lint`

#### Manual Verification:

- `curl` the local dev server (`npm run server:dev`): known id returns quantities, unknown id returns 404, p95-scale latency is instant at seed size

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 3: Client services — fetcher and scaling engine

### Overview

Add the Zod-validated details fetcher and the pure scaling engine with per-unit step/rounding rules. No UI yet — everything testable headlessly with vitest.

### Changes Required:

#### 1. Recipe details client

**File**: `services/recipe-client.ts` (new)

**Intent**: Fetch and validate `GET /api/recipes/:id`, mirroring `services/search-client.ts` exactly: same base-URL resolution, `fetchImpl` injection for tests, typed error class with `retryable` (404 → not retryable; network/5xx → retryable), Zod schema duplicated client-side per existing convention.

**Contract**: `fetchRecipe(id: string, options?): Promise<RecipeDetail>` where `RecipeDetail.ingredients: { name: string; amount: number | null; unit: string | null }[]`. Error class `RecipeClientError` with the same fields as `SearchClientError` (`services/search-client.ts:31-44`).

#### 2. Scaling engine

**File**: `services/recipe-scaling.ts` (new)

**Intent**: Pure functions implementing the chosen behavior: per-unit step + rounding dictionary, base-immutable factor math, scalability predicate, stepper enable/disable, reset, and Polish-format display (comma decimal separator).

**Contract**: the module other layers depend on —
- `UNIT_RULES: Record<SupportedUnit, { step: number; round: (n: number) => number }>` per the table in Implementation Approach
- `isScalable(ing): boolean` — `amount != null && unit != null && unit in UNIT_RULES`
- `displayedAmount(ing, factor): number` — `round(ing.amount × factor)` per unit rule
- `stepFactor(ing, factor, direction): number` — new factor derived from the ingredient's base amount (see Critical Implementation Details)
- `canStep(ing, factor, direction): boolean` — false for decrement when `displayedAmount − step ≤ 0`
- `formatAmount(n): string` — comma decimal separator, no trailing zeros (`1,5`, `375`, `0,25`)
- `RESET_FACTOR = 1`

#### 3. Service tests

**File**: `services/recipe-client.test.ts`, `services/recipe-scaling.test.ts` (new)

**Intent**: Client tests mirror `search-client.test.ts` cases (success, 404 non-retryable, network retryable, malformed payload). Scaling tests cover: factor derivation from each unit family, per-unit rounding boundaries, non-scalable skip, decrement disable at minimum, reset, and a repeated-step no-drift case (e.g. 10 increments then 10 decrements returns to the original display values).

**Contract**: vitest. **Must be appended to the `client:test` script line in `package.json:18`** — files there are enumerated explicitly.

### Success Criteria:

#### Automated Verification:

- New service tests pass: `npm run client:test`
- Type check passes: `npm run typecheck`
- Lint passes: `npm run lint`

#### Manual Verification:

- Skim test output: rounding examples read like real recipe lines (no `333,33 g`-style values surviving in display paths)

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 4: Details screen, navigation, and stepper UI

### Overview

Ship the user-visible loop: pressable result cards navigating to `app/recipe/[id].tsx`, ingredient rows with steppers, scaled/original display, reset, loading/error states, and component tests.

### Changes Required:

#### 1. Pressable result card

**File**: `components/recipe-result-card.tsx`

**Intent**: Wrap the card in a `Pressable` (or expo-router `Link`) navigating to `/recipe/${recipe.id}`, with haptic/visual press feedback consistent with existing UI. Keep it presentational otherwise.

**Contract**: navigation via expo-router (`router.push` or `Link href={`/recipe/${id}`}`); no prop changes to `SearchResultsSection`.

#### 2. Recipe details route

**File**: `app/recipe/[id].tsx` (new)

**Intent**: Fetch via `fetchRecipe(useLocalSearchParams().id)` on mount; render loading / error-with-retry / success states following the state-shape pattern of `services/search-state.ts` and the section-states pattern of `components/search-results-section.tsx`. Success state holds `{ recipe, factor }`; header shows title + favorites; body renders the ingredient list and a reset button (visible/enabled only when `factor !== 1`). Stack title via `Stack.Screen` options.

**Contract**: route is deep-linkable — works from a cold web refresh on `/recipe/r-001` (no dependency on search state). Keep the file under 200 lines (AGENTS.md) by delegating rows and list to components below.

#### 3. Ingredient row components

**File**: `components/recipe-ingredient-row.tsx` (new); `components/recipe-ingredients-section.tsx` (new, if needed to keep files under 200 lines)

**Intent**: Two row variants: (a) scalable — name, current amount + unit, +/− stepper buttons (disabled per `canStep`), original amount shown subtly (e.g. `oryg. 250 g`) only when `factor !== 1`; (b) non-scalable — name plus the ingredient's note style (`do smaku`) and a muted "nie skaluje się" treatment, no controls. Themed via `useThemeColor`, text via `ThemedText`, following `components/ingredient-chip.tsx` styling idioms.

**Contract**: row receives `{ ingredient, factor, onStep(direction) }`; all math/format calls go through `services/recipe-scaling.ts` — no arithmetic in components.

#### 4. Component tests

**File**: `components/recipe-ingredient-row.test.tsx` (new)

**Intent**: jest-expo tests following `components/search-results-section.test.tsx` patterns (mock `useThemeColor`): renders scaled value per unit rounding, fires `onStep` on press, disables decrement at minimum, renders non-scalable variant without controls, shows original amount when factor ≠ 1.

**Contract**: **append the file to the `app:test` script in `package.json:19`** (files are enumerated explicitly).

### Success Criteria:

#### Automated Verification:

- Component tests pass: `npm run app:test`
- Full gate passes: `npm run validate`

#### Manual Verification:

- End-to-end on web (`npm run web` + `npm run server:dev`): search → tap result → details open quickly (PRD p95 ≤ 700ms scale)
- Stepping `makaron` from 250 g → 300 g rescales every scalable ingredient proportionally; `sól` row stays inert
- Original amounts appear per row when scaled; reset restores originals exactly
- Decrement disables at the minimum step; values never hit 0 or negative
- Cold refresh on `/recipe/<id>` (web) loads the recipe via the endpoint
- Unknown id shows the error state with retry
- Dark mode renders correctly on the new screen

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation — this completes the change.

---

## Testing Strategy

### Unit Tests:

- `services/recipe-scaling.test.ts` — the trust-critical core: factor math, per-unit rounding grid, step clamping, non-scalable skip, no-drift on repeated steps, reset.
- `services/recipe-client.test.ts` — fetch success/404/network/malformed, mirroring `search-client.test.ts`.
- `server/src/routes/recipes.test.ts` — 200 contract (numeric amounts, null pair for non-scalable), 404.

### Integration Tests:

- `npm run validate` chains all suites; Phase 1 proves existing search tests survive the fixture shape change.

### Manual Testing Steps:

1. Seed, start server + web app; search `makaron, pomidor`; tap the top result.
2. Increment `makaron` three times; confirm every scalable row rescales and reads like a real recipe line.
3. Decrement an ingredient to its minimum; confirm the − button disables before 0.
4. Tap reset; confirm exact original values return and the `oryg.` hints disappear.
5. Refresh the browser on `/recipe/<id>`; confirm the recipe loads. Try a bogus id; confirm error + retry.

## Performance Considerations

Seed-scale data (5 recipes × ~5 ingredients) makes the endpoint and recalculation trivially fast; recalculation is synchronous pure math on tap — no debouncing or memoization needed. The PRD p95 ≤ 700ms details budget is the only number to sanity-check manually against the Railway-hosted API.

## Migration Notes

The migration adds two nullable columns — backward compatible with existing rows (they read as non-scalable until reseeded). Run `npm run db:migrate && npm run db:seed` against the Railway database after merge; until reseed, all ingredients render as non-scalable, which degrades gracefully.

## References

- PRD: `context/foundation/prd.md` (FR-005, FR-006, US-01, Business Logic)
- Roadmap slice: `context/foundation/roadmap.md` (S-02)
- Patterns: `services/search-client.ts:31-82`, `services/search-state.ts:5-62`, `components/search-results-section.test.tsx:7-9`
- Schema: `server/src/db/schema.ts:9-20`; routes: `server/src/routes/search.ts:118-178`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Data model & seed quantities

#### Automated

- [x] 1.1 Migration generates and applies cleanly: `npm run db:generate && npm run db:migrate` — 1155b2d
- [x] 1.2 Seed runs: `npm run db:seed` — 1155b2d
- [x] 1.3 Server suite passes after fixture shape change: `npm run server:test` — 1155b2d
- [x] 1.4 Type checks pass: `npm run server:typecheck && npm run typecheck` — 1155b2d
- [x] 1.5 Lint passes: `npm run server:lint && npm run lint` — 1155b2d

#### Manual

- [x] 1.6 DB/seed inspection: all 5 recipes quantified, non-scalable rows `(null, null)`, no unsupported units — 1155b2d
- [x] 1.7 Existing search flow unchanged in the app — 1155b2d

### Phase 2: Recipe details API

#### Automated

- [x] 2.1 Server tests pass including new route tests: `npm run server:test` — c5b698d
- [x] 2.2 Type check passes: `npm run server:typecheck` — c5b698d
- [x] 2.3 Lint passes: `npm run server:lint` — c5b698d

#### Manual

- [x] 2.4 curl checks: known id → quantities, unknown id → 404, latency instant at seed size — c5b698d

### Phase 3: Client services — fetcher and scaling engine

#### Automated

- [x] 3.1 New service tests pass: `npm run client:test` — a8e9955
- [x] 3.2 Type check passes: `npm run typecheck` — a8e9955
- [x] 3.3 Lint passes: `npm run lint` — a8e9955

#### Manual

- [x] 3.4 Rounded display values read like real recipe lines — a8e9955

### Phase 4: Details screen, navigation, and stepper UI

#### Automated

- [x] 4.1 Component tests pass: `npm run app:test` — 3880034
- [x] 4.2 Full gate passes: `npm run validate` — 3880034

#### Manual

- [x] 4.3 End-to-end: search → tap → details opens fast — 3880034
- [x] 4.4 Stepping rescales all scalable rows; non-scalable rows inert — 3880034
- [x] 4.5 Original amounts shown when scaled; reset restores exactly — 3880034
- [x] 4.6 Decrement disables at minimum; no zero/negative values — 3880034
- [x] 4.7 Cold web refresh on `/recipe/<id>` loads via endpoint; bogus id → error + retry — 3880034
- [x] 4.8 Dark mode renders correctly — 3880034
