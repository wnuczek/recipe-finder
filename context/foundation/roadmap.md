---
project: RecipeFinder
version: 1
status: draft
created: 2026-05-25
updated: 2026-05-25
prd_version: 1
main_goal: speed
top_blocker: time
---

# Roadmap: RecipeFinder

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

RecipeFinder helps a home cook quickly find recipes from available ingredients and avoid manual quantity math during cooking. The MVP value is not just listing recipes, but combining ranked matching and proportional scaling in one practical flow. This roadmap sequences work to deliver that end-to-end loop early while keeping scope tight to a 3-week, after-hours window.

## North star

**S-02: Scale ingredients from recipe details** - This is the first proof point because it closes the full user loop (find recipe -> open details -> adapt quantities), which is the core product promise under a speed-first goal.

> "North star" here means the smallest end-to-end slice whose delivery proves the main product assumption in practice, so it is pulled as early as prerequisites allow.

## At a glance

| ID   | Change ID                        | Outcome (user can ...)                                                               | Prerequisites | PRD refs                              | Status   |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------ | ------------- | ------------------------------------- | -------- |
| F-01 | cloudflare-web-deploy-baseline   | (foundation) web deployment baseline on Cloudflare is wired for this project         | -             | NFR-01, NFR-02                        | ready    |
| F-02 | minimal-search-api-foundation    | (foundation) minimal backend API contract for recipe search is scaffolded            | F-01          | FR-003, FR-004, NFR-01                | proposed |
| S-01 | ingredient-search-ranked-results | user can select ingredients and get ranked recipe results                            | -             | US-01, FR-001, FR-003, FR-004         | ready    |
| S-02 | recipe-details-scaling-loop      | user can open recipe details and scale ingredient quantities with full recalculation | S-01          | US-01, FR-005, FR-006                 | proposed |
| S-03 | cloud-backed-search-rollout      | user can run recipe search against the cloud-backed API on web deployment            | F-02, S-01    | US-01, FR-003, FR-004, NFR-01, NFR-02 | proposed |

## Streams

Navigation aid - groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                  | Chain                      | Note                                                             |
| ------ | ---------------------- | -------------------------- | ---------------------------------------------------------------- |
| A      | Core cooking loop      | `S-01` -> `S-02`           | Fastest path to user-visible MVP value under `main_goal: speed`. |
| B      | Web rollout enablement | `F-01` -> `F-02` -> `S-03` | Deployment target is now locked to Cloudflare web for MVP.       |

## Baseline

What's already in place in the codebase as of 2026-05-25 (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present - per tech-stack.md: Expo + Expo Router mobile app scaffold.
- **Backend / API:** absent - no server runtime, route handlers, or API entrypoint found.
- **Data:** absent - no ORM/DB driver/schema/migrations found.
- **Auth:** absent - per tech-stack.md (`has_auth: false`) and no auth middleware/token/session code found.
- **Deploy / infra:** partial - deployment direction is now locked to web-only Cloudflare for MVP, but implementation baseline is not wired yet.
- **Observability:** absent - no error tracking, metrics, or telemetry instrumentation found.

## Foundations

### F-01: Cloudflare web deploy baseline

- **Outcome:** (foundation) web deployment baseline on Cloudflare is configured and release path is documented for this repo.
- **Change ID:** cloudflare-web-deploy-baseline
- **PRD refs:** NFR-01, NFR-02
- **Unlocks:** S-03
- **Prerequisites:** -
- **Parallel with:** S-01, S-02
- **Blockers:** -
- **Unknowns:** -
- **Risk:** If Cloudflare web baseline is under-scoped, follow-up backend rollout can drift across runtime assumptions.
- **Status:** ready

### F-02: Minimal search API foundation

- **Outcome:** (foundation) minimal backend API contract for recipe search is scaffolded with a single normalized recipe shape.
- **Change ID:** minimal-search-api-foundation
- **PRD refs:** FR-003, FR-004, NFR-01
- **Unlocks:** S-03
- **Prerequisites:** F-01
- **Parallel with:** S-02
- **Blockers:** -
- **Unknowns:** Backend activation gate is conditional: introduce backend only if local-flow validation misses NFR guardrails (Owner: user. Block: no.)
- **Risk:** Triggering backend too early can consume the 3-week budget before the core user loop is validated.
- **Status:** proposed

## Slices

### S-01: Ingredient search with ranked results

- **Outcome:** user can select ingredients from autocomplete and get recipe results sorted by match.
- **Change ID:** ingredient-search-ranked-results
- **PRD refs:** FR-001, FR-003, FR-004, US-01
- **Prerequisites:** -
- **Parallel with:** F-01
- **Blockers:** -
- **Unknowns:** -
- **Risk:** Ranking quality may feel random unless matching rules are simple and explicit in MVP.
- **Status:** ready

### S-02: Recipe details and scaling loop

- **Outcome:** user can open recipe details and adjust ingredient quantities with full proportional recalculation for supported units.
- **Change ID:** recipe-details-scaling-loop
- **PRD refs:** FR-005, FR-006, US-01
- **Prerequisites:** S-01
- **Parallel with:** F-02
- **Blockers:** -
- **Unknowns:** -
- **Risk:** Unit-conversion edge cases can reduce trust if unsupported units are not clearly constrained in UX.
- **Status:** proposed

### S-03: Cloud-backed search rollout

- **Outcome:** user can execute recipe search against a cloud-backed API in the web deployment target.
- **Change ID:** cloud-backed-search-rollout
- **PRD refs:** FR-003, FR-004, US-01, NFR-01, NFR-02
- **Prerequisites:** F-02, S-01
- **Parallel with:** -
- **Blockers:** -
- **Unknowns:**
  - Backend for MVP is conditional and should be activated only if local-flow validation misses NFR guardrails (Owner: user. Block: no.)
- **Risk:** If backend is activated without a clear trigger, API work may dilute speed-focused MVP delivery.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                        | Suggested issue title                           | Ready for `/10x-plan` | Notes                                                    |
| ---------- | -------------------------------- | ----------------------------------------------- | --------------------- | -------------------------------------------------------- |
| F-01       | cloudflare-web-deploy-baseline   | Foundation: Cloudflare web deployment baseline  | yes                   | Decision resolved: web-only Cloudflare is locked for MVP |
| F-02       | minimal-search-api-foundation    | Foundation: Minimal backend search API contract | no                    | Sequence after F-01 and after core loop validation       |
| S-01       | ingredient-search-ranked-results | Slice: Ingredient search with ranked results    | yes                   | Run `/10x-plan ingredient-search-ranked-results`         |
| S-02       | recipe-details-scaling-loop      | Slice: Recipe details and scaling loop          | no                    | Unlocks as soon as S-01 is done                          |
| S-03       | cloud-backed-search-rollout      | Slice: Cloud-backed search rollout              | no                    | Depends on F-02 and conditional backend activation gate  |

This table is the clean handoff to Jira/Linear or any MCP-backed backlog. Include one row for every `F-NN` and `S-NN`. It should be compact enough to copy into issues, but it must not duplicate the detailed roadmap body.

## Open Roadmap Questions

1. **No blocking roadmap questions at this time.**
2. **Backend remains conditional:** activate only if local-flow validation misses NFR guardrails. - Owner: user. Block: none.

## Parked

- **Barcode scanner in MVP** - Why parked: PRD Non-Goals explicitly excludes barcode integration in MVP.
- **Multi-source scraping in MVP** - Why parked: PRD Non-Goals keeps one stable source for initial validation.
- **Native app distribution hardening** - Why parked: user currently prefers web-only Cloudflare deployment for MVP.

## Done

(Empty on first generation. `/10x-archive` appends an entry here - and flips that item's `Status` to `done` - when a change whose `Change ID` matches the item is archived. Do NOT pre-populate. Format:)

- **<Slice ID>: <Outcome>** - Archived <YYYY-MM-DD> -> `context/archive/<YYYY-MM-DD-change-id>/`. Lesson: <pointer to lessons.md if any, or `-`>.
