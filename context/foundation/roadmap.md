---
project: RecipeFinder
version: 3
status: draft
created: 2026-06-02
updated: 2026-06-03
prd_version: 1
main_goal: speed
top_blocker: time
---

# Roadmap: RecipeFinder

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

RecipeFinder helps a home cook quickly find matching recipes from available ingredients and avoid manual quantity math while cooking. The app's core value is not just listing recipes, but combining ranked ingredient matching with proportional quantity scaling in one practical flow. As of June 2, 2026, the ingredient search end of that loop is working end-to-end; the recipe detail and scaling end remains to be built.

## North star

**S-04: Proportional scaling engine in details view** — This is the first slice that fully proves the product promise because quantity edits immediately update all ingredient amounts in supported units.

> "North star" here means the smallest end-to-end slice whose delivery proves the core product hypothesis — the smallest flow that, if working, shows the product does what it claims. It is placed as early as prerequisites allow because everything else only matters if this works.

## At a glance

| ID   | Change ID                               | Outcome (user can …)                                                    | Prerequisites | PRD refs                      | Status   |
|------|-----------------------------------------|-------------------------------------------------------------------------|---------------|-------------------------------|----------|
| F-01 | cloudflare-web-deploy-baseline          | (foundation) Cloudflare Pages + Railway deployment baseline is wired    | —             | NFR-01, NFR-02                | done     |
| F-02 | minimal-search-api-foundation           | (foundation) backend search API scaffolded and deployed to Railway      | F-01          | FR-003, FR-004, NFR-01        | done     |
| S-01 | ingredient-search-ranked-results        | select ingredients and get recipe results sorted by match score         | —             | US-01, FR-001, FR-003, FR-004 | done     |
| S-02 | recipe-details-navigation               | open recipe details from search results                                 | S-01          | US-01, FR-005                 | ready    |
| S-03 | editable-ingredient-quantities          | edit one ingredient quantity directly in recipe details                 | S-02          | US-01, FR-005, FR-006         | proposed |
| S-04 | proportional-scaling-supported-units    | see all ingredient quantities recalculate proportionally after an edit  | S-03          | US-01, FR-006                 | proposed |
| S-05 | search-and-details-performance-guardrail| use search and details with responsive behavior aligned to MVP guardrails | S-02, S-04  | US-01, FR-003, FR-005         | proposed |

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
- **Status:** ready

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
- **Status:** proposed

### S-04: Proportional scaling for supported units

- **Outcome:** user sees all recipe ingredient quantities recalculate proportionally after editing one ingredient amount, within the supported unit set.
- **Change ID:** proportional-scaling-supported-units
- **PRD refs:** US-01, FR-006
- **Prerequisites:** S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Which exact unit set is considered "supported" in MVP (for example: g, ml, szt)? This must be explicit in the UI contract to keep scope bounded. — Owner: user. Block: no.
- **Risk:** Unit handling edge cases can consume disproportionate time and threaten the deadline if unsupported cases are not explicitly constrained.
- **Status:** proposed

### S-05: Search and details performance guardrail

- **Outcome:** user can search and open details with responsiveness that meets the MVP interaction guardrails in normal usage.
- **Change ID:** search-and-details-performance-guardrail
- **PRD refs:** US-01, FR-003, FR-005
- **Prerequisites:** S-02, S-04
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - What manual test dataset and runbook will be used to verify p95 thresholds consistently across runs? — Owner: user. Block: no.
- **Risk:** Without an explicit validation runbook, performance regressions may be discovered late, near release.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                               | Suggested issue title                                    | Ready for `/10x-plan` | Notes                                              |
|------------|-----------------------------------------|----------------------------------------------------------|-----------------------|----------------------------------------------------|
| F-01       | cloudflare-web-deploy-baseline          | Foundation: Cloudflare Pages + Railway deployment baseline | no                    | Done — absorbed into baseline                      |
| F-02       | minimal-search-api-foundation           | Foundation: Backend search API on Railway                | no                    | Done — absorbed into baseline                      |
| S-01       | ingredient-search-ranked-results        | Slice: Ingredient search with ranked results             | no                    | Done — implemented end-to-end                      |
| S-02       | recipe-details-navigation               | Slice: Open recipe details from result card              | yes                   | Best next move; unlocks all remaining slices       |
| S-03       | editable-ingredient-quantities          | Slice: Edit quantity input in recipe details             | no                    | Depends on S-02                                    |
| S-04       | proportional-scaling-supported-units    | Slice: Recalculate all ingredient quantities proportionally | no                  | Depends on S-03                                    |
| S-05       | search-and-details-performance-guardrail| Slice: Validate and tune search/details responsiveness   | no                    | Depends on S-02 and S-04                           |

## Open Roadmap Questions

1. No blocking roadmap questions at this time.
2. **Full release cycle unverified:** the tag-push → Cloudflare Pages + Railway pipeline exists but has not been production-tested end-to-end. — Owner: user. Block: no (risk, not a planning blocker; surface during S-02 deployment).
3. **Supported units contract:** lock the explicit unit set for MVP scaling before S-04 implementation details are finalized. — Owner: user. Block: no.

## Parked

- **Barcode scanner (FR-008)** — Why parked: PRD Non-Goals; integration risk and mobile-only scope excluded from MVP.
- **Multi-source recipe scraping (FR-007)** — Why parked: PRD Non-Goals; one stable seeded source is sufficient to validate the product loop.
- **Native app distribution hardening** — Why parked: PRD Non-Goals; web-only Cloudflare Pages is the current release path.
- **Ingredient chip removal (FR-002)** — Why parked: demoted to nice-to-have in PRD; full list reset is sufficient for MVP.
- **Observability infrastructure** — Why parked: no PRD NFR mandates monitoring tooling for MVP; absent from scope.

## Done

- **F-01: Cloudflare web deploy baseline** — Implemented as of 2026-06-02. `cloudflare-web-deploy-baseline`. Deploy infra in place (wrangler.api.toml, railway.json, GitHub Actions workflows). Lesson: —.
- **F-02: Minimal search API foundation** — Implemented as of 2026-06-02. `minimal-search-api-foundation`. Hono.js server + `POST /api/search` deployed to Railway. Lesson: —.
- **S-01: Ingredient search with ranked results** — Implemented as of 2026-06-02. `ingredient-search-ranked-results`. Full ingredient selection + ranked recipe results working end-to-end. Lesson: —.
