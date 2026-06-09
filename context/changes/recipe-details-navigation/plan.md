# Recipe Details Navigation Implementation Plan

## Overview

Let the user tap a recipe in the ranked search results and open a full recipe details screen (FR-005). Alongside the navigation itself, this change lays the quantities/units data foundation (numeric `amount` + constrained `unit` on `recipe_ingredients`) that the follow-up scaling change (FR-006) will compute on — but performs no scaling math.

## Current State Analysis

- Search results render `RankedRecipe` rows (`services/search-client.ts:3-11`) via `SearchResultsSection` → `RecipeResultCard` (`components/recipe-result-card.tsx:20`); the card is a plain `View` with **no press handler**.
- Routing is a root `Stack` (`app/_layout.tsx:17-20`) with `(tabs)` + `modal`; **no dynamic route exists**.
- Server (Hono) exposes only search + ingredients endpoints (`server/src/routes/search.ts`); **no `GET /api/recipes/:id`**, and the repository (`server/src/db/repositories/recipe-repository.ts`) has no `getRecipeById()`.
- DB schema (`server/src/db/schema.ts`) stores ingredient **names only** — `recipe_ingredients(recipe_id, ingredient)` with composite PK. No amounts, units, or instructions.
- Seed pipeline: `server/src/search/recipes.fixture.ts` (5 recipes, flat name arrays) → `server/src/db/seed.ts` (idempotent upsert + delete/reinsert of ingredients).
- Client error handling pattern is established: `SearchClientError` with `retryable`/`status`, zod response validation, Polish user-facing messages (`services/search-client.ts:31-44, 102-120`).
- Test layout: Hono route tests with injectable mocked repository (`server/src/routes/search.test.ts` `buildTestApp()` pattern), vitest client tests with mocked `fetchImpl`, jest-expo component tests with mocked `useThemeColor`.
- PRD guardrail: recipe details open time **p95 ≤ 700ms**. S-01 set the precedent of treating p95 as a hard gate with documented evidence (`context/changes/ingredient-search-ranked-results/verification-notes.md`).
- Lesson (`context/foundation/lessons.md`): always split code into reusable components and services.

## Desired End State

Tapping a result card pushes `/recipe/<id>` over the tab bar. The screen renders instantly from the in-memory search snapshot (title + ingredient names), then a `GET /api/recipes/:id` fetch fills per-ingredient amounts and units. Refreshing or deep-linking the details URL on web works standalone. Unknown ids show a friendly not-found state with a back-to-search link; fetch failures show an inline error with Retry. The DB stores numeric amounts and supported units for every seeded ingredient row. The S-01 search response contract is byte-identical to before this change.

Verify by: `npm run validate` green; manual tap-through on web; refresh of `/recipe/r-001` renders from network alone; documented p95 ≤ 700ms evidence for the details endpoint.

### Key Discoveries:

- `RankedRecipe.id` is already in every result row — route param needs nothing new from search (`services/search-client.ts:3-11`).
- Adding columns to `recipe_ingredients` does NOT disturb search: `listRecipesForSearch` selects named columns only (`server/src/db/repositories/recipe-repository.ts:46-57`).
- Expo Router auto-registers `app/recipe/[id].tsx`; only screen options need a `Stack.Screen` entry in `app/_layout.tsx`.
- `package.json` test scripts (`client:test`, `app:test`) enumerate explicit file paths — new test files silently never run unless the scripts are extended.
- Production API base URL is hardcoded for Railway (`services/search-client.ts:51-58`); p95 evidence must be measured against that deployment after migration + reseed.

## What We're NOT Doing

- **No scaling math or editable quantity inputs** — that is the follow-up FR-006 change; this screen displays amounts read-only.
- **No instructions/preparation steps** — not in any must-have FR; schema gets no `instructions` field.
- **No change to the S-01 search response contract** — `ingredients: string[]` stays as-is in search results, zod schemas, and client types (decision: contract frozen).
- **No DB-level unit enum** — units are constrained at the application layer by the supported-units module; the column stays `text`.
- **No favorites/sharing/images** on the details screen.
- **No new state library** — plain `useState` + pure state-transition modules, matching S-01.

## Implementation Approach

Follow the S-01 layering exactly, one new vertical slice: schema/seed → repository → Hono route → typed client → screen. Quantities enter the data model now so the scaling change becomes pure UI/logic. The details screen uses a two-source render: an in-memory snapshot cache (written on search success) gives an instant paint, and the network fetch is the source of truth that fills amounts and covers deep links. Error UX mirrors S-01's inline retry semantics, distinguishing not-found (404, non-retryable, friendly message + back link) from transient failures (retry button).

## Critical Implementation Details

- **Drizzle numeric mapping**: pg-core `numeric()` returns `string` by default. Use `real`/`doublePrecision` (or `numeric` with a number mapping) so `amount` reaches the API as a JS `number | null` — the details response contract depends on it.
- **Explicit test-script lists**: `client:test` and `app:test` in `package.json` run hardcoded file lists. Phase 3 must append the new test files to those scripts or they will pass CI without ever running.
- **Snapshot seeding, not param serialization**: Expo Router params are strings — do not serialize the recipe into route params. Pass only `id`; the details screen reads the last search results from a small module-level cache in `services/`. When the cache misses (deep link/refresh), the screen renders its loading state until the fetch lands.
- **Production p95 ordering**: the Railway deployment must receive the migration + reseed before measuring p95 in Phase 4; measuring against a schema-mismatched deploy invalidates the evidence.

## Phase 1: Quantities Data Foundation

### Overview

Extend the data model with numeric amounts and constrained units, rework the fixture/seed with real quantities, and add the `getRecipeById` repository read. Search surfaces stay untouched.

### Changes Required:

#### 1. Supported units module

**File**: `server/src/search/supported-units.ts` (new)

**Intent**: Single source of truth for the MVP supported-unit set, satisfying FR-006's "supported units" constraint at the application layer.

**Contract**: Exports `SUPPORTED_UNITS` (readonly tuple — `"g" | "ml" | "szt" | "łyżka" | "łyżeczka" | "szklanka"`), type `SupportedUnit`, and a `isSupportedUnit(value: string): value is SupportedUnit` guard. The seed and the details route both validate against this module.

#### 2. Schema extension

**File**: `server/src/db/schema.ts`

**Intent**: Store per-ingredient quantity so details can display it and scaling can later compute on it.

**Contract**: `recipeIngredientsTable` gains `amount` (floating-point numeric, nullable — null means "to taste"/"do smaku") and `unit` (text, nullable — null only when `amount` is null). Composite PK `(recipe_id, ingredient)` unchanged. Generate the migration with `npm run db:generate`.

#### 3. Fixture rework

**File**: `server/src/search/recipes.fixture.ts`

**Intent**: Author the 5 seed recipes with realistic numeric quantities in supported units, while keeping the search-facing `Recipe` shape (names only) derivable.

**Contract**: Fixture entries carry `ingredients: { name: string; amount: number | null; unit: SupportedUnit | null }[]`. A derived export (or mapping helper) preserves the existing `Recipe[]` (names-only) shape for the ranking utility and any test that consumes it today — search-side consumers must not need edits beyond the import of that derived shape.

#### 4. Seed update

**File**: `server/src/db/seed.ts`

**Intent**: Persist `amount`/`unit` per ingredient row using the existing idempotent transaction pattern.

**Contract**: Insert into `recipe_ingredients` now includes `amount` and `unit`; delete/reinsert semantics unchanged.

#### 5. Details types + repository read

**File**: `server/src/search/types.ts`, `server/src/db/repositories/recipe-repository.ts`

**Intent**: Add the canonical details shape and a single-recipe read that later phases (route, client) build on.

**Contract** (other phases depend on this):

```ts
export type RecipeDetailsIngredient = {
  name: string;
  amount: number | null;
  unit: string | null;
};

export type RecipeDetails = {
  id: string;
  title: string;
  favoritesCount: number;
  ingredients: RecipeDetailsIngredient[];
};

// repository
export async function getRecipeById(id: string): Promise<RecipeDetails | null>;
```

Returns `null` for unknown ids; ingredients ordered alphabetically by name (deterministic, matching the search repository's ordering convention).

### Success Criteria:

#### Automated Verification:

- Migration generates and applies cleanly: `npm run db:generate` + `npm run db:migrate`
- Seed succeeds against local DB: `npm run db:seed`
- Server typecheck passes: `npm run server:typecheck`
- Server lint passes: `npm run server:lint`
- Existing server tests still pass (search contract untouched): `npm run server:test`

#### Manual Verification:

- DB inspection shows every seeded ingredient row with a sensible `amount`/`unit` (or null pair for "to taste")
- Local search flow (home tab) still returns identical ranked results after migration + reseed

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding. Phase blocks use plain bullets — checkbox state lives only in `## Progress`.

---

## Phase 2: Recipe Details Endpoint

### Overview

Expose `GET /api/recipes/:id` returning the rich details shape, with 404 semantics and a timing log for the p95 gate.

### Changes Required:

#### 1. Details route

**File**: `server/src/routes/recipe-details.ts` (new), `server/src/app.ts`

**Intent**: Serve a single recipe with quantities; keep route modules split per lessons.md rather than growing `search.ts`.

**Contract**: `GET /api/recipes/:id`. Response 200:

```ts
{
  recipe: RecipeDetails;
  metadata: { durationMs: number };
}
```

Unknown id → 404 `{ error: "Recipe not found" }`. Blank/whitespace id → 400 `{ error: ... }`. Emits `console.info("details.completed", { recipeId, found, durationMs })` mirroring the `search.completed` log. Repository is injectable for tests, following the `buildTestApp()` pattern in `server/src/routes/search.test.ts`. Registered in `app.ts` under the existing `/api` mount + CORS.

#### 2. Route tests

**File**: `server/src/routes/recipe-details.test.ts` (new)

**Intent**: Lock the contract — found, not-found, validation, and metadata shape.

**Contract**: Vitest, mocked repository. Cases: 200 with full ingredient quantity shape (including a null-amount row), 404 for unknown id, 400 for blank id, `metadata.durationMs` is a number.

### Success Criteria:

#### Automated Verification:

- Server tests pass (new details suite + existing search suite): `npm run server:test`
- Server typecheck passes: `npm run server:typecheck`
- Server lint passes: `npm run server:lint`

#### Manual Verification:

- `curl localhost:8787/api/recipes/r-001` returns title + ingredients with amounts/units
- `curl localhost:8787/api/recipes/nope` returns 404 with the error body

**Implementation Note**: Pause for manual confirmation after automated checks pass.

---

## Phase 3: Navigation + Details Screen

### Overview

Wire the tap, add the typed client, and build the root-stack details screen with instant snapshot render, fetch fill, and S-01-style error states.

### Changes Required:

#### 1. Details client

**File**: `services/recipe-details-client.ts` (new)

**Intent**: Typed fetch for `GET /api/recipes/:id` reusing the S-01 error-mapping pattern (zod validation, `SearchClientError` semantics, Polish messages).

**Contract**: `fetchRecipeDetails(id: string, options?): Promise<RecipeDetails>` — 404 throws non-retryable with a distinguishable signal (`status: 404`), 5xx/network throw retryable, malformed payload throws non-retryable. Reuses or mirrors `SearchClientError` and the base-URL resolution from `services/search-client.ts:51-58`.

#### 2. Snapshot cache

**File**: `services/recipe-snapshot-cache.ts` (new), `app/(tabs)/index.tsx`

**Intent**: Give the details screen an instant first paint when arriving from results, without serializing data into route params.

**Contract**: Module-level store: `setRecipeSnapshots(recipes: RankedRecipe[])`, `getRecipeSnapshot(id: string): RankedRecipe | undefined`. `runSearch` success path in `app/(tabs)/index.tsx` writes the snapshots; `search-state.ts` pure functions stay pure (no side effects added there).

#### 3. Details screen state module

**File**: `services/recipe-details-state.ts` (new)

**Intent**: Pure state transitions for the details screen lifecycle, mirroring `search-state.ts`.

**Contract**: State statuses `'loading' | 'success' | 'not_found' | 'error'`, plus snapshot presence; transition helpers analogous to `applyLoading`/`applySuccess`/`applyError`, with not-found derived from the 404 signal.

#### 4. Details screen UI

**File**: `app/recipe/[id].tsx` (new route), `components/recipe-details-screen.tsx` (new), `components/recipe-ingredient-row.tsx` (new), `app/_layout.tsx`

**Intent**: Render the recipe: title, favorites count, ingredient list with `amount unit name` rows ("do smaku" when amount is null); loading / not-found (friendly message + back-to-search link) / error (inline message + Retry) states. Route file stays thin (param read + hook-up), presentation lives in components per lessons.md and the 200-line rule.

**Contract**: Route reads `id` via `useLocalSearchParams`, renders instantly from `getRecipeSnapshot(id)` when available (names-only until fetch lands), and always fetches as source of truth. `app/_layout.tsx` gains a `Stack.Screen name="recipe/[id]"` entry with a back-enabled header. Not-found links back via `router` to the home tab.

#### 5. Tap wiring

**File**: `components/recipe-result-card.tsx`

**Intent**: Make the result card pressable and navigate to the details route.

**Contract**: Card wrapped in `Pressable` with `accessibilityRole="button"`, navigating to `/recipe/${recipe.id}` (expo-router `Link asChild` or `useRouter().push`). Visual layout unchanged.

#### 6. Tests + script registration

**File**: `services/recipe-details-client.test.ts` (new), `services/recipe-details-state.test.ts` (new), `components/recipe-details-screen.test.tsx` (new), `package.json`

**Intent**: Match S-01 depth per layer and make the new tests actually run.

**Contract**: Client tests (vitest, mocked `fetchImpl`): success parse, 404 → non-retryable not-found signal, 5xx → retryable, malformed → non-retryable. State tests: transition coverage. Component test (jest-expo, mocked `useThemeColor`): success render with quantities + "do smaku" row, not-found state, error state with retry callback. `package.json` `client:test` and `app:test` lists extended with the new files.

### Success Criteria:

#### Automated Verification:

- Client tests pass: `npm run client:test`
- Component tests pass: `npm run app:test`
- App typecheck passes: `npm run typecheck`
- Lint passes: `npm run lint`

#### Manual Verification:

- Web: search → tap a card → details opens full-screen with quantities; back returns to intact results
- Web: refresh on `/recipe/r-001` renders correctly from network alone (no snapshot)
- Unknown id (`/recipe/nope`) shows the not-found state with a working back-to-search link
- With the server stopped, details shows the inline error and Retry recovers once the server is back

**Implementation Note**: Pause for manual confirmation after automated checks pass.

---

## Phase 4: Verification & p95 Evidence

### Overview

Close the change with the full validation suite, production rollout of migration + seed, and documented p95 ≤ 700ms evidence per the S-01 hard-gate precedent.

### Changes Required:

#### 1. Verification notes

**File**: `context/changes/recipe-details-navigation/verification-notes.md` (new)

**Intent**: Document the verification run and the p95 evidence so the gate is auditable, mirroring S-01's verification-notes format.

**Contract**: Records: `npm run validate` result, production migration/seed confirmation, p95 measurement method (sample size ≥ 30 sequential `GET /api/recipes/:id` requests against the Railway deployment, p95 computed from recorded latencies), the measured value vs the 700ms budget, and manual sign-off checklist outcomes.

### Success Criteria:

#### Automated Verification:

- Full validation suite green: `npm run validate`

#### Manual Verification:

- Production (Railway) migrated + reseeded; deployed `/api/recipes/r-001` returns the quantities shape
- p95 ≤ 700ms evidence recorded in verification-notes.md (hard gate — failing value blocks close-out)
- End-to-end manual pass on the deployed web build: search → details → back, refresh, not-found
- Human sign-off recorded in verification-notes.md

**Implementation Note**: Final phase — pause for manual confirmation; cross-phase manual rollup applies.

---

## Testing Strategy

### Unit Tests:

- Repository `getRecipeById` contract exercised through route tests with mocked repo (found/404 mapping)
- Details client: success, 404, 5xx, network, malformed payload
- Details state module: every transition, snapshot-present vs absent

### Integration Tests:

- Hono route tests via `app.request()` with injectable repository (matches `search.test.ts` pattern)

### Manual Testing Steps:

1. Search "ryż" → tap "Kurczak curry z ryżem" → details shows 5 ingredients with amounts/units
2. Browser-refresh the details URL → identical render after loading state
3. Navigate to `/recipe/nonexistent` → not-found state, back link returns home
4. Stop the server, open details → error + Retry; restart server, Retry succeeds
5. Confirm search results screen is unchanged (S-01 regression check)

## Performance Considerations

- PRD guardrail: details open p95 ≤ 700ms — enforced as a hard gate in Phase 4 against the Railway deployment.
- The snapshot cache makes perceived list→details navigation instant regardless of network; the gate measures the API itself.
- `getRecipeById` is a single PK-filtered join over 5 seeded recipes — no index work needed at MVP scale.

## Migration Notes

- One additive migration (two nullable columns) — existing rows remain valid; reseed populates quantities.
- Production order: deploy server code (backward-compatible) → run migration → reseed → then measure p95.
- Rollback: columns are nullable and unread by S-01 surfaces; reverting the app code alone is safe.

## References

- Roadmap slice: `context/foundation/roadmap.md` (S-02, FR-005/FR-006 split)
- S-01 plan + verification precedent: `context/changes/ingredient-search-ranked-results/plan.md`, `verification-notes.md`
- Error-handling pattern: `services/search-client.ts:31-44`
- Route test pattern: `server/src/routes/search.test.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Quantities Data Foundation

#### Automated

- [x] 1.1 Migration generates and applies cleanly (`npm run db:generate` + `npm run db:migrate`) — e84559b
- [x] 1.2 Seed succeeds against local DB (`npm run db:seed`) — e84559b
- [x] 1.3 Server typecheck passes (`npm run server:typecheck`) — e84559b
- [x] 1.4 Server lint passes (`npm run server:lint`) — e84559b
- [x] 1.5 Existing server tests still pass (`npm run server:test`) — e84559b

#### Manual

- [x] 1.6 DB rows show sensible amount/unit (or null pair) for every seeded ingredient — e84559b
- [x] 1.7 Local search flow still returns identical ranked results after migration + reseed — e84559b

### Phase 2: Recipe Details Endpoint

#### Automated

- [x] 2.1 Server tests pass including new details suite (`npm run server:test`) — 99f58f9
- [x] 2.2 Server typecheck passes (`npm run server:typecheck`) — 99f58f9
- [x] 2.3 Server lint passes (`npm run server:lint`) — 99f58f9

#### Manual

- [x] 2.4 curl known id returns title + ingredients with amounts/units — 99f58f9
- [x] 2.5 curl unknown id returns 404 with error body — 99f58f9

### Phase 3: Navigation + Details Screen

#### Automated

- [x] 3.1 Client tests pass (`npm run client:test`) — 946137c
- [x] 3.2 Component tests pass (`npm run app:test`) — 946137c
- [x] 3.3 App typecheck passes (`npm run typecheck`) — 946137c
- [x] 3.4 Lint passes (`npm run lint`) — 946137c

#### Manual

- [x] 3.5 Web tap-through: search → details with quantities → back to intact results — 946137c
- [x] 3.6 Web refresh on details URL renders from network alone — 946137c
- [x] 3.7 Unknown id shows not-found with working back-to-search link — 946137c
- [x] 3.8 Server-down error state + successful Retry after restart — 946137c

### Phase 4: Verification & p95 Evidence

#### Automated

- [x] 4.1 Full validation suite green (`npm run validate`)

#### Manual

- [x] 4.2 Production migrated + reseeded; deployed details endpoint returns quantities shape — edc2a26
- [x] 4.3 p95 ≤ 700ms evidence recorded in verification-notes.md (hard gate) — edc2a26
- [x] 4.4 End-to-end manual pass on deployed web build (search → details → back, refresh, not-found) — 20e311f
- [x] 4.5 Human sign-off recorded in verification-notes.md — 20e311f
