# Scaling & Edit-Input Correctness (Phase 1 Test Rollout) — Plan Brief

> Full plan: `context/changes/testing-scaling-correctness/plan.md`
> Research: `context/changes/testing-scaling-correctness/research.md`

## What & Why

Phase 1 of the project test rollout (`test-plan.md` §3). It closes the coverage gaps for the two highest-priority risks: **risk #1** — scaling silently produces wrong ingredient ratios — and **risk #2**, reframed. Research established there is no free-text quantity field (only steppers), so risk #2 is re-scoped from "typed input parsing" to the **data-contract trust boundary**: a non-finite / mistyped `amount` reaching the pure scaling engine.

## Starting Point

The scaling engine ([services/recipe-scaling.ts](services/recipe-scaling.ts)) is pure functions; the screen is controlled by a single `factor` prop fanned out to every row. Existing tests are oracle-clean (independent literals), but several unit families and boundaries are untested, there's no multi-ingredient cross-check, and the engine's behavior on bad data is uncharacterized.

## Desired End State

`client:test` and `app:test` carry new tests proving one shared factor recalculates *every* ingredient correctly per its unit (the literal risk-#1 scenario), pinning the engine's current behavior on non-finite input, and confirming the row stays stable on garbage data. The §6 cookbook is filled and the absent-guard gap is recorded for a follow-up.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Risk #2 disposition | Reframe to data-contract; defer typed-field | Tests the real code surface, not a UI that doesn't exist | Plan |
| Guard policy | Document current behavior, flag for follow-up | Keeps Phase 1 inside the test-only rollout boundary | Plan |
| Client-parse boundary | Pin engine at function boundary; defer to Phase 3 | Avoids overlapping Phase 3's contract work | Plan |
| Multi-ingredient cross-check | Both unit (math) + one screen test (fan-out) | Complete risk-#1 coverage: arithmetic AND wiring | Plan |
| Component scope | Risk-targeted row additions only | Every new component test maps to a named risk | Plan |

## Scope

**In scope:** unit-family completeness (`łyżeczka`, `l`); zero-base & rounding boundaries; multi-ingredient oracle cross-check; non-finite-input characterization; screen fan-out test; row garbage-resilience + Polish-comma; cookbook §6.1/§6.2; absent-guard finding.

**Out of scope:** adding engine guards; testing a typed quantity field; client-parse boundary (Phase 3); snapshot/pixel tests; route changes.

## Architecture / Approach

Phases 1–2 extend `services/recipe-scaling.test.ts` (unit). Phase 3 extends `recipe-details-screen.test.tsx` + `recipe-ingredient-row.test.tsx` (component). Phase 4 verifies registration, fills the cookbook, records the finding. The load-bearing discipline: every expected value is computed independently in the test, never read back from the module.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Risk #1 unit coverage | Unit-family + boundary gaps closed; multi-ingredient oracle cross-check | Accidentally lifting expected values from the module |
| 2. Risk #2 characterization | Non-finite-input behavior pinned; unbounded increment documented | Reader mistakes documented gap for intended design |
| 3. Component layer | Screen fan-out test; row garbage-resilience + comma display | Over-broad render coverage that duplicates unit tests |
| 4. Wiring & cookbook | Tests confirmed running; §6.1/§6.2 filled; guard finding recorded | Silent-skip if a new file isn't registered |

**Prerequisites:** research complete (done); target test files already exist and are registered in `package.json`.
**Estimated effort:** ~1–2 sessions across 4 phases; test-authoring only, no production code.

## Open Risks & Assumptions

- The absent `Number.isFinite` guard and increment ceiling remain in production until a future change picks up the Phase 4 finding.
- Feeding `NaN`/`Infinity` is type-legal (`amount: number | null`); a deliberately mistyped value needs a small, commented cast.
- The full malformed-payload → engine path is only proven once Phase 3 of the rollout lands.

## Success Criteria (Summary)

- A shared factor demonstrably recalculates every ingredient correctly across all supported units, verified against independent arithmetic.
- The engine's behavior on bad data is documented, and the row never crashes on it.
- The cookbook tells the next contributor exactly how to add a scaling unit test and a component test.
