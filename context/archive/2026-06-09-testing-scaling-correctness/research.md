---
date: 2026-06-09T16:44:00+02:00
researcher: WNUK Paweł
git_commit: 2352c10aeb20a8f2ec1182eb5dcbde73f1dd1b0c
branch: M3L1
repository: recipe-finder
topic: "Phase 1 test rollout — scaling correctness (risk #1) + edit-input validation (risk #2)"
tags: [research, codebase, recipe-scaling, ingredient-row, test-plan, phase-1]
status: complete
last_updated: 2026-06-09
last_updated_by: WNUK Paweł
---

# Research: Phase 1 — scaling correctness (risk #1) + edit-input validation (risk #2)

**Date**: 2026-06-09T16:44:00+02:00
**Researcher**: WNUK Paweł
**Git Commit**: 2352c10aeb20a8f2ec1182eb5dcbde73f1dd1b0c
**Branch**: M3L1
**Repository**: recipe-finder

## Research Question

Ground the code surface for rollout Phase 1 of `context/foundation/test-plan.md` so `/10x-plan` can specify tests against real code, not against the plan's prose. Phase 1 covers:

- **Risk #1** — Proportional scaling recalculates the other ingredient quantities incorrectly; the user cooks with wrong ratios and never notices.
- **Risk #2** — A quantity-edit field accepts an invalid / empty / locale-formatted value and feeds garbage into the scaling engine.

Per test-plan §1 principle #3, where the plan and the code disagree about where the failure lives, **the code is ground truth**.

## Summary

1. **Scaling is a single global multiplicative `factor`, not a per-ingredient recalc.** The user taps `−`/`+` steppers on one ingredient; that derives one `factor` applied to *every* ingredient. "The other quantities recalculate" = the same `factor` re-applied and re-rounded per each ingredient's unit rule. ([services/recipe-scaling.ts:55-83](services/recipe-scaling.ts#L55-L83), [app/recipe/[id].tsx:60-71](app/recipe/[id].tsx#L60-L71))

2. **⚠️ Risk #2's framing does not match the implementation.** There is **no free-text quantity-edit field** anywhere in the scaling path — no `TextInput`, no `keyboardType`, no `parseFloat`/`Number(...)` parse step. Quantity is changed only by two discrete stepper buttons feeding a `StepDirection = "increment" | "decrement"` string. The risk as worded ("typed string → parse → garbage into engine") is **forward-looking, not a current code surface**. The *real* current input-trust surface is different — see "Risk #2 reframed" below.

3. **The oracle problem the plan worries about for risk #1 is NOT present in existing tests.** `services/recipe-scaling.test.ts` asserts independent, hand-computed literal numbers (e.g. `250 × 1.04 = 260`), never values lifted from the scaling module. ([services/recipe-scaling.test.ts:33-55](services/recipe-scaling.test.ts#L33-L55))

4. **There is meaningful existing coverage but real gaps remain**: an untested unit (`łyżeczka`), the `l` family untested in `stepFactor`/`canStep`, the zero-base-amount divide-by-zero guard untested, no rounding-down / `.5`-tie boundary cases, and **no `NaN`/`Infinity`/upper-bound guard anywhere in the engine**.

## Detailed Findings

### Risk #1 — the scaling engine

**Entry points** (pure functions in [services/recipe-scaling.ts](services/recipe-scaling.ts); there is no single `scaleRecipe()`):

- `stepFactor(ingredient, factor, direction): number` — computes the next global factor when a stepper is tapped. ([services/recipe-scaling.ts:68-83](services/recipe-scaling.ts#L68-L83))
- `displayedAmount(ingredient, factor): number` — applies a factor to one ingredient and unit-rounds. ([services/recipe-scaling.ts:55-64](services/recipe-scaling.ts#L55-L64))
- Supporting: `isScalable` ([:47-53](services/recipe-scaling.ts#L47-L53)), `canStep` ([:85-101](services/recipe-scaling.ts#L85-L101)), `formatAmount` ([:103-106](services/recipe-scaling.ts#L103-L106)), `ruleFor` ([:40-45](services/recipe-scaling.ts#L40-L45)).

**Live call path** (the production wiring tests should mirror):

- Single shared factor held in route state: `const [factor, setFactor] = useState(RESET_FACTOR)` — [app/recipe/[id].tsx:29](app/recipe/[id].tsx#L29).
- Stepper tap → `setFactor((current) => stepFactor(ingredient, current, direction))` — [app/recipe/[id].tsx:68](app/recipe/[id].tsx#L68).
- One factor passed to all rows: `factor={factor}` — [components/recipe-details-screen.tsx:108](components/recipe-details-screen.tsx#L108).
- Each row renders `displayedAmount(ingredient, factor)` and the original via `displayedAmount(ingredient, 1)` — [components/recipe-ingredient-row.tsx:70-71](components/recipe-ingredient-row.tsx#L70-L71).
- Reset → `RESET_FACTOR = 1` — [app/recipe/[id].tsx:80](app/recipe/[id].tsx#L80), [services/recipe-scaling.ts:18](services/recipe-scaling.ts#L18).

**Algorithm — no-drift, derived from the tapped ingredient's BASE amount:**

```ts
// displayedAmount — apply factor, round per unit (recipe-scaling.ts:63)
return rule.round(ingredient.amount * factor);

// stepFactor — next factor off the BASE amount, not the current factor (recipe-scaling.ts:78-82)
const current = displayedAmount(ingredient, factor);
const delta = direction === "increment" ? rule.step : -rule.step;
const nextAmount = current + delta;
return nextAmount / ingredient.amount;
```

The factor is recomputed from `ingredient.amount` (the immutable base) so repeated steps never accumulate rounding drift ([services/recipe-scaling.ts:66-67](services/recipe-scaling.ts#L66-L67) comment). **Test-relevant consequence**: the step the user sees applies to the *tapped* ingredient in its own unit, but the resulting factor is re-applied to *other* ingredients and re-rounded per their own unit — other ingredients do not move by the tapped unit's `step`. This is exactly the "wrong ratio" surface risk #1 names, and the test oracle must be computed independently across multiple ingredients/units, not just the tapped one.

**Supported-unit set — fixed allow-list, NO unit conversion** ([services/recipe-scaling.ts:3-12](services/recipe-scaling.ts#L3-L12)):

```ts
SUPPORTED_UNITS = ["g", "kg", "ml", "l", "szt", "łyżka", "łyżeczka", "szklanka"]
```

There is **no g↔kg / ml↔l conversion**. The unit string only selects a step + rounding rule via `UNIT_RULES` ([:29-38](services/recipe-scaling.ts#L29-L38)). Any unit not in the map → `ruleFor` returns `null` → ingredient is non-scalable, renders the static "do smaku · nie skaluje się" label with no steppers ([components/recipe-ingredient-row.tsx:56-67](components/recipe-ingredient-row.tsx#L56-L67)).

**Rounding — per-unit, three rules** ([services/recipe-scaling.ts:20-22, 29-38](services/recipe-scaling.ts#L20-L38)):

| Units | Step | Round to |
|-------|------|----------|
| `g`, `ml` | ±10 | whole (`Math.round`) |
| `kg`, `l` | ±0.1 | 2 decimals |
| `szt` | ±0.5 | nearest 0.25 |
| `łyżka`, `łyżeczka`, `szklanka` | ±0.25 | nearest 0.25 |

A **second** rounding stage exists for display: `formatAmount` does `Math.round(value*100)/100` then `.`→`,` (Polish comma) — [services/recipe-scaling.ts:103-106](services/recipe-scaling.ts#L103-L106), used at [components/recipe-ingredient-row.tsx:96,112-113](components/recipe-ingredient-row.tsx#L96). All rounding uses `Math.round` (.5 rounds toward +∞ — no banker's rounding).

**Edge handling inside the engine:**

- `amount === null` / unknown unit → treated as non-scalable; `displayedAmount` returns `0` ([:60-62](services/recipe-scaling.ts#L60-L62)), `stepFactor` returns factor unchanged ([:74-76](services/recipe-scaling.ts#L74-L76)).
- `amount === 0` → explicitly short-circuited in `stepFactor` to avoid divide-by-zero ([:74](services/recipe-scaling.ts#L74)). **This guard is the only thing preventing `NaN`/divide-by-zero** in the factor math.
- Decrement-to-zero → not clamped; the `−` button is *disabled* when `displayedAmount - step <= 0` via `canStep` ([:99-100](services/recipe-scaling.ts#L99-L100)).
- **No upper bound on increment** ([:95-96](services/recipe-scaling.ts#L95-L96)) — `amount * factor` is unbounded.
- **No `Number.isFinite` guard anywhere** — a `NaN`/`Infinity` base `amount` would propagate (`Math.round(NaN)` → `NaN`).

### Risk #2 — reframed against the code

The plan assumed a free-text amount editor. **It does not exist.** The control is a pair of `StepperButton` `Pressable`s with a read-only amount between them ([components/recipe-ingredient-row.tsx:103-127](components/recipe-ingredient-row.tsx#L103-L127); `StepperButton` at [:141-164](components/recipe-ingredient-row.tsx#L141-L164)). The only `TextInput` in the repo is the unrelated ingredient-search box ([components/ingredient-input.tsx:105](components/ingredient-input.tsx#L105)).

So there is **no parse step, no locale-decimal handling, no fraction handling, and no empty/non-numeric input path** in the scaling flow. The value that reaches the engine is always either a numeric `factor` from `stepFactor` or `RESET_FACTOR = 1`.

**The real, code-supported input-trust surface for Phase 1 is therefore:**

1. **The data trust boundary on `amount`/`unit`.** These flow in from the server/client layer ([services/recipe-details-client.ts](services/recipe-details-client.ts), not read in depth here — flag for the plan). The invariant "amount and unit are both set or both null" is enforced at seed/route level per the editable-quantities plan, *not* re-validated in the engine. If a recipe arrives with a non-finite or wrongly-typed `amount`, the engine has no guard. This is the actual "garbage into the scaling engine" path.
2. **The unbounded increment** ([:95-96](services/recipe-scaling.ts#L95-L96)) — no max-factor / overflow ceiling.
3. **The zero/null divide-by-zero guard** ([:74](services/recipe-scaling.ts#L74)) — currently the sole `NaN` protector, and **untested**.

`/10x-plan` should re-scope risk #2 to these, OR explicitly note that the typed-field risk is deferred until/unless a free-text amount editor ships.

### Existing test coverage audit

| File | Run via | Oracle check | Notes |
|------|---------|--------------|-------|
| [services/recipe-scaling.test.ts](services/recipe-scaling.test.ts) | `npm run client:test` | **Clean** — independent literals | Covers `isScalable`, `displayedAmount` rounding per unit family, `stepFactor` (g/kg/szt + one kitchen decrement), `canStep`, a 10-up/10-down no-drift integration, `formatAmount`. |
| [services/ingredient-match.test.ts](services/ingredient-match.test.ts) | `npm run client:test` | Clean | Autocomplete matching — not a scaling concern. |
| [components/recipe-ingredient-row.test.tsx](components/recipe-ingredient-row.test.tsx) | `npm run app:test` | n/a | Stepper render, scaled value, hidden original at factor 1, `onStep` direction, decrement-disabled-at-min, non-scalable variant. |

**Oracle evidence (risk #1 is clean):** [services/recipe-scaling.test.ts:35](services/recipe-scaling.test.ts#L35) `displayedAmount(ing(250,"g"),1.04) === 260`; [:42](services/recipe-scaling.test.ts#L42) `ing(1,"kg"),1.333 === 1.33`; [:47-49](services/recipe-scaling.test.ts#L47-L49) quarter-rounding literals; no expected value calls `displayedAmount`/`stepFactor`/`UNIT_RULES`.

**Coverage gaps to close in Phase 1:**

- **Risk #1**
  - `łyżeczka` is in `UNIT_RULES` ([:36](services/recipe-scaling.ts#L36)) but **never exercised** — only `łyżka`/`szklanka` represent the quarter family.
  - `l` (litre) untested in `stepFactor`/`canStep` — only `kg` represents the 2-decimal family there.
  - **Zero-base-amount branch** ([:74](services/recipe-scaling.ts#L74)) untested.
  - No **rounding-down / `.5`-tie** boundary case (every quarter example rounds up).
  - No **multi-ingredient cross-check**: assert that after stepping one ingredient, *every other* ingredient's displayed amount equals an independently-computed `round(base × factor)` — this is the literal risk-#1 scenario and is currently only implicit via the single-ingredient `displayedAmount` tests.
  - `formatAmount` untested for negative / very large values ([:103-106](services/recipe-scaling.ts#L103-L106)).
- **Risk #2 (reframed)**
  - No test feeds a non-finite / wrongly-typed `amount` into `displayedAmount`/`stepFactor` to pin current behavior (`NaN` propagation).
  - No test for the unbounded-increment ceiling (by design there is none — the test would *document* the absence or assert a chosen bound if the plan adds one).

## Code References

- `services/recipe-scaling.ts:55-64` — `displayedAmount` (apply factor + unit round)
- `services/recipe-scaling.ts:68-83` — `stepFactor` (next factor off base amount; divide-by-zero guard at :74)
- `services/recipe-scaling.ts:3-12, 29-38` — `SUPPORTED_UNITS` + `UNIT_RULES` (step + rounding; no conversion)
- `services/recipe-scaling.ts:85-101` — `canStep` (decrement disable boundary, no increment ceiling)
- `services/recipe-scaling.ts:103-106` — `formatAmount` (second 2-decimal round + Polish comma)
- `app/recipe/[id].tsx:29,60-71,80` — factor state, `handleStep` → `stepFactor`, reset
- `components/recipe-details-screen.tsx:108` — single factor fanned out to all rows
- `components/recipe-ingredient-row.tsx:70-71,103-127,141-164` — render path, stepper buttons (no text input)
- `services/recipe-scaling.test.ts:19-127` — existing scaling unit tests (oracle-clean)
- `components/recipe-ingredient-row.test.tsx:21-119` — existing row component tests

## Architecture Insights

- **Base-immutable + single factor** is the core invariant: screen holds the fetched recipe + one `factor`; every displayed amount is derived `round(base.amount × factor)`. No scaled state is persisted; navigating away discards the factor. Tests must respect this — there is no per-ingredient mutable quantity to assert against.
- **Rounding is two-staged** (unit-rule round, then `formatAmount` 2-decimal round) and **unit-keyed**. An oracle that ignores the unit family will produce false expectations.
- **Trust boundary lives upstream of the engine.** The engine assumes well-formed `amount: number | null` / `unit`. Validation is at seed/route, not in `recipe-scaling.ts`. This is why risk #2's "garbage in" is really a data-contract question, not a field-parse question.

## Historical Context (from prior changes)

- `context/archive/2026-06-05-editable-ingredient-quantities/plan.md` — origin of the design: **stepper-only (explicitly not free-text)**, base-immutable factor math, the no-drift rule (`newFactor = newAmount / baseAmount`, never `factor × delta`), the per-unit step/round table, the decrement-disable (not clamp) decision, and `doublePrecision` so JSON carries `number | null`. Also states the scaling test matrix must cover all unit families and that **new test files must be added to `package.json` `client:test`/`app:test` or they silently never run.**
- `context/archive/2026-06-09-ingredient-row-height-shift/plan.md` — the original-amount line must always reserve space (opacity-toggled, not conditionally mounted) so row height is constant during stepping; hidden from a11y tree at `factor === 1`. Relevant if Phase 1 adds component tests around the original-amount reveal.
- `context/changes/recipe-details-navigation/` and `context/changes/ingredient-search-ranked-results/` — deferred all scaling/quantity decisions to the editable-quantities change; no scaling logic of their own.

## Related Research

- None prior for the test rollout. This is the first `research.md` under `context/changes/testing-scaling-correctness/`.
- Upstream design rationale: `context/archive/2026-06-05-editable-ingredient-quantities/` (research.md + plan.md).

## Open Questions

1. **Risk #2 disposition** — `/10x-plan` must decide: reframe to the data-contract / non-finite-`amount` surface, or formally defer the typed-field risk until a free-text editor exists. The plan should not write tests for a UI that isn't there.
2. **`services/recipe-details-client.ts` trust boundary** — not read in depth this pass. If the plan adopts the data-contract framing of risk #2, research the client parse + the route response shape to find exactly where a non-finite/mistyped `amount` could enter. (This also overlaps Phase 3's risk #5/#6.)
3. **NaN/upper-bound policy** — does the team want the engine to actively guard non-finite input and cap the factor, or is the upstream invariant considered sufficient? This determines whether Phase 1 tests *document* current behavior or *drive* a new guard (which would push work beyond the test-only lesson boundary).
