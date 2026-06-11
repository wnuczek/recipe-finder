---
project: RecipeFinder
version: 5
status: draft
created: 2026-06-02
updated: 2026-06-11
prd_version: 1
main_goal: speed
top_blocker: time
---

# Roadmap: RecipeFinder

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

RecipeFinder helps a home cook quickly find matching recipes from available ingredients and avoid manual quantity math while cooking. The app's core value is not just listing recipes, but combining ranked ingredient matching with proportional quantity scaling in one practical flow. As of June 11, 2026, the full core loop — ingredient search, recipe details, and proportional scaling — is working end-to-end.

## North star

**S-04: Proportional scaling engine in details view** — **Delivered.** Shipped 2026-06-09 inside the `editable-ingredient-quantities` change (S-03): one shared scaling factor recalculates all ingredient amounts with per-unit rounding (`services/recipe-scaling.ts`). The core product hypothesis is proven; remaining slices harden and extend the loop.

> "North star" here means the smallest end-to-end slice whose delivery proves the core product hypothesis — the smallest flow that, if working, shows the product does what it claims. It is placed as early as prerequisites allow because everything else only matters if this works.

## At a glance

| ID   | Change ID                               | Outcome (user can …)                                                    | Prerequisites | PRD refs                      | Status   |
|------|-----------------------------------------|-------------------------------------------------------------------------|---------------|-------------------------------|----------|
| F-01 | cloudflare-web-deploy-baseline          | (foundation) Cloudflare Pages + Railway deployment baseline is wired    | —             | NFR-01, NFR-02                | done     |
| F-02 | minimal-search-api-foundation           | (foundation) backend search API scaffolded and deployed to Railway      | F-01          | FR-003, FR-004, NFR-01        | done     |
| S-01 | ingredient-search-ranked-results        | select ingredients and get recipe results sorted by match score         | —             | US-01, FR-001, FR-003, FR-004 | done     |
| S-02 | recipe-details-navigation               | open recipe details from search results                                 | S-01          | US-01, FR-005                 | done     |
| S-03 | editable-ingredient-quantities          | edit one ingredient quantity directly in recipe details                 | S-02          | US-01, FR-005, FR-006         | done     |
| S-04 | proportional-scaling-supported-units    | see all ingredient quantities recalculate proportionally after an edit  | S-03          | US-01, FR-006                 | done     |
| S-05 | search-and-details-performance-guardrail| use search and details with responsive behavior aligned to MVP guardrails | S-02, S-04  | US-01, FR-003, FR-005         | proposed |
| S-06 | recipe-details-photo-instructions       | see a photo and cooking instructions in recipe details                  | S-02          | FR-005 (extends)              | proposed |
| S-07 | dry-ingredient-unit-swap                | swap g ↔ szklanka for specific dry ingredients (flour, rice, sugar)     | S-04          | FR-006 (extends)              | proposed |
| S-08 | favourite-ingredients                   | mark ingredients as favourites and reach them faster in search          | S-01          | — (new, needs PRD update)     | proposed |
| S-09 | missing-ingredients-indicator           | see which ingredients they're missing for each recipe                   | S-02          | FR-004, FR-005 (extends)      | proposed |
| S-10 | portion-scaling-presets                 | scale all quantities with one tap via portion presets                   | S-04          | FR-006 (extends)              | proposed |
| S-11 | copy-scaled-ingredient-list             | copy the currently scaled ingredient list to the clipboard              | S-04          | FR-006 (extends)              | proposed |
| S-12 | restore-last-search                     | return to the app and continue from the last ingredient search          | S-01          | — (local profile)             | proposed |

## Baseline

What's already in place in the codebase as of 2026-06-02 (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Expo + Expo Router; ingredient search screen fully wired (`app/(tabs)/index.tsx`, `components/ingredient-input.tsx`, `components/search-results-section.tsx`, `components/recipe-result-card.tsx`). No recipe detail screen yet.
- **Backend / API:** present — Hono.js; `POST /api/search` endpoint deployed to Railway (`server/src/routes/search.ts`); `search-client.ts` calls the Railway URL in production.
- **Data:** present — Drizzle ORM; `recipes` + `recipe_ingredients` schema and migration (`server/src/db/schema.ts`, `server/drizzle/0000_mean_whistler.sql`); seed data at `server/src/db/seed.ts`.
- **Auth:** absent (by design — PRD: local profile, flat user model, no auth in MVP).
- **Deploy / infra:** present — Cloudflare Pages for frontend (`deploy-cloudflare-on-tag.yml` in GitHub Actions); Railway for backend API (`railway.json`). GitHub Actions deploys the frontend only; `wrangler.api.toml` exists in repo but API runs on Railway, not Cloudflare Workers.
- **Observability:** absent — no error tracking or telemetry in `server/src/`.

## Foundations

### F-01: Cloudflare web deploy baseline

- **Outcome:** (foundation) Cloudflare Pages + Railway deployment baseline is wired; frontend ships on tag-push, API runs on Railway.
- **Change ID:** cloudflare-web-deploy-baseline
- **PRD refs:** NFR-01, NFR-02
- **Unlocks:** F-02 (deploy host for the API); S-01, S-02 (both ship via this deployment chain).
- **Prerequisites:** —
- **Parallel with:** S-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Deploy configuration is in place but the full release cycle (tag → Cloudflare Pages + Railway) has not been production-verified; first live tag-push may surface configuration gaps.
- **Status:** done

### F-02: Minimal search API foundation

- **Outcome:** (foundation) backend search API scaffolded and deployed to Railway; `POST /api/search` accepts an ingredients list and returns ranked recipes.
- **Change ID:** minimal-search-api-foundation
- **PRD refs:** FR-003, FR-004, NFR-01
- **Unlocks:** S-01 (cloud-backed ingredient search); S-02 (details open from consistent API payload); S-05 (performance guardrail verification on deployed API).
- **Prerequisites:** F-01
- **Parallel with:** S-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** —
- **Status:** done

## Slices

### S-01: Ingredient search with ranked results

- **Outcome:** user can select ingredients from autocomplete and get recipe results sorted by match score.
- **Change ID:** ingredient-search-ranked-results
- **PRD refs:** US-01, FR-001, FR-003, FR-004
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** —
- **Status:** done

### S-02: Recipe details navigation

- **Outcome:** user can open recipe details from a ranked search result and inspect ingredient lines before editing.
- **Change ID:** recipe-details-navigation
- **PRD refs:** US-01, FR-005
- **Prerequisites:** S-01
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** If details payload shape is incomplete, this slice can produce a shell screen without full ingredient context.
- **Status:** done

### S-03: Editable ingredient quantities

- **Outcome:** user can modify one ingredient amount in recipe details as the scaling input.
- **Change ID:** editable-ingredient-quantities
- **PRD refs:** US-01, FR-005, FR-006
- **Prerequisites:** S-02
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Does `recipe_ingredients` store quantity and unit per ingredient, or only ingredient text? If quantity+unit are absent, the model must be extended before this slice can be fully implemented. — Owner: user. Block: no.
- **Risk:** Editable fields without strong parsing/validation can create invalid scaling inputs that break downstream recalculation.
- **Status:** done

### S-04: Proportional scaling for supported units

- **Outcome:** user sees all recipe ingredient quantities recalculate proportionally after editing one ingredient amount, within the supported unit set.
- **Change ID:** proportional-scaling-supported-units
- **PRD refs:** US-01, FR-006
- **Prerequisites:** S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - ~~Which exact unit set is considered "supported" in MVP?~~ Resolved: 8 units locked in code — g, kg, ml, l, szt, łyżka, łyżeczka, szklanka (`services/recipe-scaling.ts` / `server/src/search/supported-units.ts`).
- **Risk:** Unit handling edge cases can consume disproportionate time and threaten the deadline if unsupported cases are not explicitly constrained.
- **Status:** done — absorbed into S-03 (`editable-ingredient-quantities`); the rebase reconciliation layered stepper editing and full proportional recalculation into one change. See `context/archive/2026-06-05-editable-ingredient-quantities/change.md`.

### S-05: Search and details performance guardrail

- **Outcome:** user can search and open details with responsiveness that meets the MVP interaction guardrails in normal usage.
- **Change ID:** search-and-details-performance-guardrail
- **PRD refs:** US-01, FR-003, FR-005
- **Prerequisites:** S-02, S-04 (both satisfied as of 2026-06-09)
- **Parallel with:** S-06, S-07, S-08
- **Blockers:** —
- **Unknowns:**
  - What manual test dataset and runbook will be used to verify p95 thresholds consistently across runs? — Owner: user. Block: no.
- **Risk:** Without an explicit validation runbook, performance regressions may be discovered late, near release.
- **Status:** proposed

### S-06: Recipe details photo and instructions

- **Outcome:** user can see a recipe photo and step-by-step cooking instructions on the details screen.
- **Change ID:** recipe-details-photo-instructions
- **PRD refs:** FR-005 (extends the details view beyond the original PRD scope)
- **Prerequisites:** S-02
- **Parallel with:** S-05, S-07, S-08
- **Blockers:** —
- **Unknowns:**
  - Where do photos come from? Recipes are local seed fixtures (`server/src/search/recipes.fixture.ts`) with no external source; image URLs and instruction text must be authored into the seed. — Owner: user. Block: no.
- **Risk:** Vertical slice touches every layer (schema migration, seed, details endpoint, `RecipeDetails` type, UI); payload shape changes must stay backward-compatible with the snapshot cache.
- **Status:** proposed

### S-07: Dry-ingredient unit swap (g ↔ szklanka)

- **Outcome:** user can swap displayed units between grams and glasses (szklanka) for specific dry ingredients (e.g. flour, rice, sugar), with amounts converted via a per-ingredient density table.
- **Change ID:** dry-ingredient-unit-swap
- **PRD refs:** FR-006 (extends scaling beyond the original PRD scope)
- **Prerequisites:** S-04
- **Parallel with:** S-05, S-06, S-08
- **Blockers:** —
- **Unknowns:**
  - Which ingredients get a density entry, and what densities (flour ≈ 130 g/szklanka, rice ≈ 200 g, sugar ≈ 200 g)? Dry pasta measures poorly in glasses — keep the list deliberately small. — Owner: user. Block: no.
- **Risk:** Conversion composes with the scaling factor and per-unit rounding rules in `services/recipe-scaling.ts`; rounding after conversion must not drift on repeated swaps.
- **Status:** proposed

### S-08: Favourite ingredients

- **Outcome:** user can mark ingredients as favourites and reach them faster when building a search (e.g. pinned or pre-suggested in the ingredient autocomplete).
- **Change ID:** favourite-ingredients
- **PRD refs:** — (new scope; PRD update needed)
- **Prerequisites:** S-01
- **Parallel with:** S-05, S-06, S-07
- **Blockers:** —
- **Unknowns:**
  - Exact UX: pinned at the top of autocomplete, pre-selected chips, or a separate quick-pick row? — Owner: user. Block: yes (shape before planning).
  - Storage: PRD mandates local profile / no auth, so favourites live client-side (web localStorage / AsyncStorage); confirm no server persistence is expected. — Owner: user. Block: no.
- **Risk:** Distinct from the existing read-only `favoritesCount` popularity counter on recipes — naming must not conflate the two concepts.
- **Status:** proposed

### S-09: Missing-ingredients indicator

- **Outcome:** user can see which ingredients they're missing for each recipe — a "brakuje: …" badge on result cards and have/missing highlighting on the details ingredient list.
- **Change ID:** missing-ingredients-indicator
- **PRD refs:** FR-004, FR-005 (extends — deepens the core "cook with what I have" value)
- **Prerequisites:** S-02
- **Parallel with:** any open slice
- **Blockers:** —
- **Unknowns:**
  - Details screen needs to know the searched ingredients; today the snapshot cache carries the result card data — confirm the selected-ingredients list travels with navigation. — Owner: planning. Block: no.
- **Risk:** Match logic already exists (`services/ingredient-match.ts`, server-side ranking) — scope is presentation; avoid re-implementing matching client-side if the server already returns it.
- **Status:** proposed

### S-10: Portion scaling presets

- **Outcome:** user can scale the whole recipe with one tap (×½ / ×2 or a servings picker) instead of stepping a single ingredient repeatedly.
- **Change ID:** portion-scaling-presets
- **PRD refs:** FR-006 (extends)
- **Prerequisites:** S-04
- **Parallel with:** any open slice
- **Blockers:** —
- **Unknowns:**
  - Preset set: fixed multipliers (×½, ×1, ×2) vs. a servings count (requires a base-servings field recipes don't have yet). Fixed multipliers keep it schema-free. — Owner: user. Block: no.
- **Risk:** None significant — presets just set the existing `factor`; per-unit rounding already handles fractional results.
- **Status:** proposed

### S-11: Copy scaled ingredient list

- **Outcome:** user can copy the currently scaled ingredient list to the clipboard ("Skopiuj listę składników") to use as a lightweight shopping list.
- **Change ID:** copy-scaled-ingredient-list
- **PRD refs:** FR-006 (extends)
- **Prerequisites:** S-04
- **Parallel with:** any open slice
- **Blockers:** —
- **Unknowns:**
  - Clipboard API on web vs. native (`navigator.clipboard` vs. `expo-clipboard`) — pick per platform during planning. — Owner: planning. Block: no.
- **Risk:** None significant — string assembly over existing `displayedAmount`/`formatAmount`.
- **Status:** proposed

### S-12: Restore last search

- **Outcome:** user returns to the app and continues from their last ingredient search (selected chips restored; optionally last results).
- **Change ID:** restore-last-search
- **PRD refs:** — (fits PRD Access Control: local profile, preferences stored locally)
- **Prerequisites:** S-01
- **Parallel with:** any open slice
- **Blockers:** —
- **Unknowns:**
  - Restore chips only (re-run search on demand) or also cached results (staleness questions)? Chips-only is the safe MVP cut. — Owner: user. Block: no.
- **Risk:** Shares local-persistence plumbing with S-08 (favourite ingredients) — whichever lands first should establish the storage convention the other reuses.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                               | Suggested issue title                                    | Ready for `/10x-plan` | Notes                                              |
|------------|-----------------------------------------|----------------------------------------------------------|-----------------------|----------------------------------------------------|
| F-01       | cloudflare-web-deploy-baseline          | Foundation: Cloudflare Pages + Railway deployment baseline | no                    | Done — absorbed into baseline                      |
| F-02       | minimal-search-api-foundation           | Foundation: Backend search API on Railway                | no                    | Done — absorbed into baseline                      |
| S-01       | ingredient-search-ranked-results        | Slice: Ingredient search with ranked results             | no                    | Done — implemented end-to-end                      |
| S-02       | recipe-details-navigation               | Slice: Open recipe details from result card              | no                    | Done — merged to master                            |
| S-03       | editable-ingredient-quantities          | Slice: Edit quantity input in recipe details             | no                    | Done — archived 2026-06-09                         |
| S-04       | proportional-scaling-supported-units    | Slice: Recalculate all ingredient quantities proportionally | no                  | Done — absorbed into S-03                          |
| S-05       | search-and-details-performance-guardrail| Slice: Validate and tune search/details responsiveness   | yes                   | Prerequisites satisfied; runbook unknown is open   |
| S-06       | recipe-details-photo-instructions       | Slice: Show photo and instructions in recipe details     | yes                   | Best next move; self-contained vertical slice      |
| S-07       | dry-ingredient-unit-swap                | Slice: Swap g ↔ szklanka for dry ingredients             | yes                   | Density table scope should be locked in planning   |
| S-08       | favourite-ingredients                   | Slice: Mark ingredients as favourites for faster search  | no                    | UX shape undecided — shape before planning         |
| S-09       | missing-ingredients-indicator           | Slice: Show missing ingredients in results and details   | yes                   | Mostly presentation; match logic already exists    |
| S-10       | portion-scaling-presets                 | Slice: One-tap portion presets in recipe details         | yes                   | Rides the existing factor engine                   |
| S-11       | copy-scaled-ingredient-list             | Slice: Copy scaled ingredient list to clipboard          | yes                   | Button + string assembly over formatAmount         |
| S-12       | restore-last-search                     | Slice: Restore last ingredient search on return          | yes                   | Local storage; pairs with S-08 persistence         |

## Open Roadmap Questions

1. **Favourite-ingredients UX (S-08):** pinned autocomplete entries, pre-selected chips, or a quick-pick row? Blocks S-08 planning only. — Owner: user. Block: yes (S-08 only).
2. **NFR "≥10 results" vs. 5-recipe catalog:** the seeded catalog cannot satisfy the "at least 10 results" NFR. Decision 2026-06-11: catalog expansion needs a bigger approach and is parked beyond MVP — accept the gap for MVP and account for it when validating S-05. — Owner: user. Block: no.
3. **Full release cycle unverified:** the tag-push → Cloudflare Pages + Railway pipeline exists but has not been production-tested end-to-end. — Owner: user. Block: no (risk, not a planning blocker).
4. ~~**Supported units contract**~~ — Resolved 2026-06-11: locked to the 8 units implemented in `services/recipe-scaling.ts` (g, kg, ml, l, szt, łyżka, łyżeczka, szklanka).

## Parked

- **Barcode scanner (FR-008)** — Why parked: PRD Non-Goals; integration risk and mobile-only scope excluded from MVP.
- **Multi-source recipe scraping (FR-007)** — Why parked: PRD Non-Goals; one stable seeded source is sufficient to validate the product loop.
- **Native app distribution hardening** — Why parked: PRD Non-Goals; web-only Cloudflare Pages is the current release path.
- ~~**Ingredient chip removal (FR-002)**~~ — No longer parked: already implemented (`components/ingredient-chip.tsx` has per-chip remove). Confirmed 2026-06-11.
- **Observability infrastructure** — Why parked: no PRD NFR mandates monitoring tooling for MVP; absent from scope.
- **Recipe catalog expansion / content strategy** — Why parked: user decision 2026-06-11 — the catalog "needs thinking bigger" (likely multi-source ingestion, FR-007) and is beyond MVP. Consequence: the "≥10 results" NFR stays unmet for MVP (see Open Questions #4).

## Done

- **F-01: Cloudflare web deploy baseline** — Implemented as of 2026-06-02. `cloudflare-web-deploy-baseline`. Deploy infra in place (wrangler.api.toml, railway.json, GitHub Actions workflows). Lesson: —.
- **F-02: Minimal search API foundation** — Implemented as of 2026-06-02. `minimal-search-api-foundation`. Hono.js server + `POST /api/search` deployed to Railway. Lesson: —.
- **S-01: Ingredient search with ranked results** — Implemented as of 2026-06-02. `ingredient-search-ranked-results`. Full ingredient selection + ranked recipe results working end-to-end. Lesson: —.
- **S-02: Recipe details navigation** — Merged to master before 2026-06-09. `recipe-details-navigation`. Details endpoint, client, state reducers, snapshot cache, screen, and route (documented in the S-03 reconciliation note). Lesson: —.
- **S-03: user can modify one ingredient amount in recipe details as the scaling input.** — Archived 2026-06-09 → `context/archive/2026-06-05-editable-ingredient-quantities/`. Lesson: —.
- **S-04: Proportional scaling for supported units** — Delivered 2026-06-09 inside S-03's change (`editable-ingredient-quantities`): shared scaling factor, per-unit rounding rules, reset. No separate change-id was needed. Lesson: when parallel branches get rebased into one change, reconcile roadmap slice statuses at archive time.
