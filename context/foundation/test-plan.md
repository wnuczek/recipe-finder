# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-06-11 (Phase 1 complete)

## 1. Strategy

Tests follow three non-negotiable principles for this project:

1. **Cost × signal.** The cheapest test that gives a real signal for the
   risk wins. Do not promote to e2e because e2e "feels safer." Do not put a
   vision model on top of a deterministic visual diff that already catches
   the regression.
2. **User concerns are first-class evidence.** Risks anchored in "the team
   is worried about X, and the failure would surface somewhere in <area>"
   carry the same weight as PRD lines or hot-spot data.
3. **Risks are scenarios, not code locations.** This plan documents *what
   could fail* and *why we believe it's likely* — drawn from documents,
   interview, and codebase *signal* (churn, structure, test base). It does
   NOT claim to know which line owns the failure. That knowledge is
   produced by `/10x-research` during each rollout phase. If the plan and
   research disagree about where the failure lives, research is the
   ground truth.

Hot-spot scope used for likelihood weighting: `app components services server/src hooks constants`.

## 2. Risk Map

The top failure scenarios this project must protect against, ordered by
risk = impact × likelihood. Risks are failure scenarios in user / business
terms, not test names. The Source column cites the *evidence that surfaced
this risk* — never a specific file as "where the failure lives" (that is
research's job, see §1 principle #3).

| # | Risk (failure scenario) | Impact | Likelihood | Source (evidence — not anchor) |
|---|---|---|---|---|
| 1 | Proportional scaling recalculates the other ingredient quantities incorrectly; the user cooks with wrong ratios and never notices the silent error | High | High | PRD FR-006 / US-01; roadmap S-04 (north-star, in progress); interview Q1; hot-spot dir `components/` (36 commits/30d) |
| 2 | A quantity-edit field accepts an invalid / empty / locale-formatted value and feeds garbage into the scaling engine | High | High | interview Q2; archive `editable-ingredient-quantities`, `ingredient-row-height-shift`; hot-spot dir `components/` (recipe-ingredient-row churn) |
| 3 | A recipe-repository query or data-shape change drops, duplicates, or mistypes fields, breaking the search or details payload downstream | High | Medium | interview Q3; PRD FR-003 / FR-005; hot-spot dir `server/src/db` (7 commits/30d) |
| 4 | Search ranking returns wrong order, empty, or fewer than the guaranteed minimum results for a valid ingredient set | High | Medium | PRD FR-004 + NFR (≥10 results, top-5 relevance ≥70%); hot-spot dirs `server/src/search` (10), `server/src/routes` (11 commits/30d) |
| 5 | The client↔server contract drifts across the full search → details → scale flow; nothing exercises client and server together | High | Medium | interview Q4; hot-spot dirs `services/` (17), `server/src/routes` (11 commits/30d) |
| 6 | The public search/details API trusts client input — a malformed or oversized payload yields a 500 or unbounded work instead of a clean 4xx | Medium | Medium | abuse lens (untrusted input); PRD public `POST /api/search`; tech-stack.md: `zod` available |

**Impact × Likelihood rubric.** Score both axes on a coarse High / Medium /
Low scale so two readers agree on the same row. Do not invent finer
gradations — the goal is ordering, not false precision.

| Rating | Impact | Likelihood |
|--------|--------|------------|
| High   | user loses access, data, or money; failure is publicly visible | area changes weekly, or we have already been burned here |
| Medium | feature degrades, a workaround exists, only some users affected | touched occasionally, has been a source of bugs |
| Low    | cosmetic, easily reverted, no data effect | stable code, rarely touched |

Order rows by impact × likelihood. Protect High × High first; High-impact ×
Low-likelihood scenarios (e.g. a cloud-provider outage) usually belong to
observability/alerting, not a test — say so rather than padding the map.

### Risk Response Guidance

| Risk | What would prove protection | Must challenge | Context `/10x-research` must ground | Likely cheapest layer | Anti-pattern to avoid |
|------|-----------------------------|----------------|--------------------------------------|-----------------------|-----------------------|
| #1 | Editing one ingredient changes every other quantity by the same proportion, verified against independent arithmetic, for each supported unit | "The recalc is correct because it matches what the code outputs" (oracle problem) | The scaling entry point, the supported-unit set, the rounding/precision rule | unit | Lifting expected values from the scaling module instead of computing them independently |
| #2 | Empty / non-numeric / fractional / very large inputs are rejected or clamped before scaling runs; the UI stays in a stable state | "The field is numeric, so its input is always valid" | How the edit field parses and validates, and what it passes downstream | unit + component | Happy-path-only; testing only well-formed numbers |
| #3 | A seeded recipe round-trips through the repository with all fields and units intact for both the search and the details shape | "The ORM returns exactly the schema shape" | The actual repository query, the search-vs-details payload contracts, the seed source-of-truth | integration | Mirroring the ORM; asserting against the same query that produced the data |
| #4 | A known ingredient set yields results in correct match-count order, never below the minimum-result guarantee, with the empty set handled cleanly | "A match was found, so the ranking is correct" | The ranking rule, the minimum-result guarantee, empty / partial-match handling | integration | Asserting the current order without an independent expected ranking |
| #5 | A real request through the client parser against the real route returns a shape the details + scale screen can consume end-to-end | "Both sides are TypeScript, so the contract holds" | The client request/parse code, the route response shape, where the two can diverge | contract / integration | Over-mocking the server; testing client and server only in isolation |
| #6 | Malformed / oversized / missing-field payloads return a clean 4xx and bounded work, never a 500 or a runaway query | "The client validates, so the server is safe" | Whether and where server-side validation (`zod`) is actually applied at the route | integration | Testing only well-formed request bodies |

## 3. Phased Rollout

Each row is a discrete rollout phase that will open its own change folder
via `/10x-new`. Status moves left-to-right through the values below; the
orchestrator updates Status as artifacts appear on disk.

| # | Phase name | Goal (one line) | Risks covered | Test types | Status | Change folder |
|---|---|---|---|---|---|---|
| 1 | Scaling & edit-input correctness | Prove a quantity edit recalculates every ingredient correctly and rejects bad input | #1, #2 | unit + component | complete | context/changes/testing-scaling-correctness/ |
| 2 | Search & data-layer integrity | Catch regressions in the churn-heavy repository, ranking, and search route | #3, #4 | integration | not started | — |
| 3 | End-to-end contract & input validation | Prove the full search→details→scale flow holds and the API rejects bad input | #5, #6 | contract / integration | not started | — |
| 4 | Quality-gates wiring | Lock the floor in CI and add a perf-guardrail smoke | cross-cutting | gates | not started | — |

**Status vocabulary** (fixed — parser literals):

| Value          | Meaning                                                                          |
|----------------|----------------------------------------------------------------------------------|
| `not started`  | No change folder for this rollout phase yet.                                     |
| `change opened` | `context/changes/<id>/` exists with `change.md`; research not done.             |
| `researched`   | `research.md` exists in the change folder.                                       |
| `planned`      | `plan.md` exists with a `## Progress` section.                                   |
| `implementing` | Progress section has at least one `[x]` and at least one `[ ]`.                  |
| `complete`     | Progress section is fully `[x]`.                                                 |

## 4. Stack

The classic test base for this project. AI-native tools (if any) carry a
`checked:` date so future readers can see which lines need re-verification.

| Layer | Tool | Version | Notes |
|-------|------|---------|-------|
| unit + integration (server) | Vitest | ^2.1.8 | `server/vitest.config.ts`; includes `server/src/**/*.test.ts`, node env |
| unit + integration (client) | Vitest | ^2.1.8 | Runs `services/**/*.test.ts` via `npm run client:test` |
| component (app) | Jest + jest-expo | ^29.7.0 / ~54.0.8 | `jest.config.js`; `@testing-library/react-native`; matches `{app,components}/**/*.test.tsx` |
| API mocking | none yet — see Phase 2/3 | — | No MSW/edge-mock library present; integration tests call routes directly today |
| e2e | none yet — optional, see Phase 3 | — | chrome-devtools MCP available for a thin web-build e2e if cheaper layers miss the signal |
| accessibility | none | — | Not in MVP scope |
| (optional) AI-native | chrome-devtools MCP — checked: 2026-06-09 | n/a | Use only for a real web-build smoke; do NOT layer over deterministic unit/integration signal |

**Stack grounding tools (current session):**
- Docs: Context7 / framework docs MCP — not available in current session; `WebFetch` available as fallback for official Expo/Hono/Drizzle/Vitest docs; checked: 2026-06-09
- Search: Exa.ai — not available in current session; `WebSearch` available for current-status discovery; checked: 2026-06-09
- Runtime/browser: chrome-devtools MCP — available; possible thin web-build e2e/smoke layer for the Expo web target, not used unless a risk needs the full deployed shape; checked: 2026-06-09
- Provider/platform: GitHub / Cloudflare / Railway MCP — none exposed in current session; CI gate wiring in Phase 4 relies on GitHub Actions config in-repo; checked: 2026-06-09

## 5. Quality Gates

The full set of gates that must pass before a change reaches production.
"Required for §3 Phase <N>" means the gate is enforced once that rollout
phase lands; before that, the gate is `planned`.

| Gate | Where | Required? | Catches |
|------|-------|-----------|---------|
| lint + typecheck (`npm run lint`, `npm run typecheck`, `server:typecheck`, `server:lint`) | local + CI | required | syntactic / type drift |
| unit + component (`client:test`, `app:test`) | local + CI | required after §3 Phase 1 | scaling + edit-input logic regressions |
| integration (`server:test`) | local + CI | required after §3 Phase 2 | repository / ranking / route regressions |
| full `npm run validate` as a pre-merge gate | CI on PR | required after §3 Phase 4 | any regression across the chained suites before merge |
| thin web-build smoke | CI or local | optional | environment-specific failures the unit/integration layers cannot see |
| perf-guardrail smoke (NFR p95) | between merge + prod | optional after §3 Phase 4 | search/details responsiveness drift (owned by roadmap S-05) |

## 6. Cookbook Patterns

How to add new tests in this project. Each sub-section is filled in once
the relevant rollout phase ships; before that, the sub-section reads
"TBD — see §3 Phase <N>."

### 6.1 Adding a unit test (scaling / matching logic)

- **Location & runner**: `services/<module>.test.ts`, Vitest. Run with `npm run client:test`.
- **Registration (load-bearing)**: `client:test` runs an explicit file list, not a glob — a *new* `*.test.ts` file silently never runs until you add its path to `scripts.client:test` in `package.json`. Verify the file's test count appears in the run output.
- **Naming & helpers**: group with `describe("<behavior>")` / `it("<observable outcome>")`. Reuse the local `ing(amount, unit, name)` fixture helper; use `toBeCloseTo(…, 10)` for factor float comparisons.
- **Oracle independence (the rule that makes scaling tests meaningful)**: never lift an expected value by calling the module under test (`displayedAmount` / `stepFactor` / `UNIT_RULES`). Compute each expectation **by hand** against the unit's rounding rule (`g`/`ml` → whole, `kg`/`l` → 2 dp, `szt`/kitchen → nearest 0.25). A test that derives the factor via `stepFactor` and feeds it back through `displayedAmount` proves nothing.
- **Reference test**: `services/recipe-scaling.test.ts` → `describe("a shared factor recalculates every ingredient independently")` — the multi-ingredient cross-check that pins risk #1: one shared factor applied across a heterogeneous list, each row verified against an independent literal. For characterization of out-of-contract input, see `describe("characterizes behavior on non-finite input (no guard today)")` and name such tests so they read as *pinning current behavior*, not asserting a guard.

### 6.2 Adding a component test (app / components)

- **Location & runner**: `components/<component>.test.tsx`, Jest + `jest-expo` + `@testing-library/react-native`. Run with `npm run app:test`.
- **Registration (load-bearing)**: like `client:test`, `app:test` lists files explicitly — add a new `*.test.tsx` path to `scripts.app:test` in `package.json` or it never runs.
- **Render & query pattern**: render the controlled component at a chosen prop value (e.g. a non-1 `factor`) and assert with `screen.getByText(...)` against a **hand-computed** literal; use `getByLabelText` for stepper controls. Mock theme plumbing the way the existing files do — `jest.mock("@/hooks/use-theme-color", …)`. The screen is controlled (`factor` is a prop), so no Expo Router is needed.
- **Fan-out reference**: `components/recipe-details-screen.test.tsx` → `it("fans one factor out to every row, each unit rounded in its own rule")` — renders a heterogeneous ingredient list (`g`/`kg`/`szt` + a non-scalable `null/null` "do smaku" row) at one factor and asserts each scaled amount independently. This is risk #1 at the UI layer.
- **Garbage-input resilience pattern**: feed a non-finite `amount` and assert the component does not crash and renders no misleading control state — see `components/recipe-ingredient-row.test.tsx` → `it("stays stable when handed a non-finite (garbage) amount — pins current output")` and the Polish-comma render case `it("renders a fractional scaled value with the Polish comma separator")`. Pin current output; do not assert a guard that does not exist (see §6.6 / lessons.md).

### 6.3 Adding an integration test (repository / ranking)

- TBD — see §3 Phase 2 (seeded recipe round-trip + ranking-order pattern). Reference candidates today: `server/src/search/rank-recipes.test.ts`, `server/src/routes/search.test.ts`.

### 6.4 Adding a test for a new API endpoint

- TBD — see §3 Phase 3 (client↔server contract + server-side input-validation pattern). Reference candidates today: `server/src/routes/recipe-details.test.ts`, `services/recipe-details-client.test.ts`.

### 6.5 Adding an end-to-end / contract test across client + server

- TBD — see §3 Phase 3 (full search→details→scale contract pattern).

### 6.6 Per-rollout-phase notes

(Optional. After each phase lands, `/10x-implement` appends a 2–3 line note here capturing anything surprising the rollout phase taught.)

- **Phase 1 — Scaling & edit-input correctness** (`testing-scaling-correctness`, 2026-06-11): risk #2's typed-field framing did not match the code (steppers only, no free-text field), so it was re-scoped to the engine's data-contract boundary and the tests *characterize* current behavior (NaN/Infinity propagate; increment is unbounded) rather than assert a guard — the absent-guard gap is recorded in `lessons.md` for a follow-up change. Also found: `npm run validate` was the first gate to run `server:lint`, which tripped on a stale git-ignored `server/dist/` build artifact because the eslint ignore was `dist/*` (root-only); widened to `**/dist/*`.

## 7. What We Deliberately Don't Test

Exclusions agreed during the rollout (Phase 2 interview, Q5). Future
contributors should respect these unless the underlying assumption changes.

- **Parked / nice-to-have features** (barcode scanner FR-008, multi-source scraping FR-007, ingredient-chip removal FR-002) — out of MVP scope; testing them spends budget on flows that may never ship. Re-evaluate if any is promoted into a roadmap slice. (Source: Phase 2 interview Q5; PRD Non-Goals.)
- **UI snapshot / pixel tests for screens** — brittle, break on every style tweak, catch little of the actual risk (which is logic, not pixels). Re-evaluate only if a rendering regression becomes a recurring incident. (Source: Phase 2 interview Q5.)
- **Theme / styling primitives and Expo Router wiring** (implied) — framework-owned plumbing with low payoff. Re-evaluate if custom navigation logic is added. (Source: Phase 2 interview Q5, by extension.)

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-06-09
- Stack versions last verified: 2026-06-09
- AI-native tool references last verified: 2026-06-09

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from the roadmap or archive,
- a recommended tool's `checked:` date is older than three months,
- the project's tech stack changes (new framework, new test runner),
- §7 negative-space no longer matches what the team believes.
