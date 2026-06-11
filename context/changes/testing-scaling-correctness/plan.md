# Scaling & Edit-Input Correctness — Phase 1 Test Rollout Implementation Plan

## Overview

This is **rollout Phase 1** of the project test plan (`context/foundation/test-plan.md` §3). It closes the coverage gaps for the two highest-priority risks:

- **Risk #1** — proportional scaling recalculates the *other* ingredient quantities incorrectly; the user cooks with wrong ratios and never notices.
- **Risk #2 (reframed)** — bad data reaches the scaling engine. Research established there is **no free-text quantity field** in the code (only `−`/`+` steppers), so the original "typed string → parse → garbage" framing does not match reality. Per test-plan §1 principle #3, risk #2 is re-scoped to the **data-contract trust boundary**: a non-finite / mistyped `amount` flowing into the pure engine functions.

The work is **test-authoring only**. We pin (characterize) current behavior and do **not** add new engine guards — the absence of a `Number.isFinite` guard and an increment ceiling is recorded as a finding for a separate change, keeping Phase 1 inside the test-rollout boundary.

## Current State Analysis

The scaling engine is a set of pure functions in [services/recipe-scaling.ts](services/recipe-scaling.ts). The screen ([components/recipe-details-screen.tsx](components/recipe-details-screen.tsx)) is a **controlled** component — it takes a single `factor` prop and fans it out to every `RecipeIngredientRow`. The route ([app/recipe/[id].tsx:29,60-71](app/recipe/[id].tsx#L29-L71)) owns the `factor` state and calls `stepFactor` on each tap.

Existing tests are **oracle-clean** — they assert independent, hand-computed literals and never lift expected values from the module ([services/recipe-scaling.test.ts:35,42,47-49](services/recipe-scaling.test.ts#L35-L49)). The oracle problem risk #1 worries about is therefore not present today; the job is to extend coverage without introducing it.

### Key Discoveries:

- **Base-immutable, single global factor** is the core invariant. `displayedAmount` derives `round(base.amount × factor)`; `stepFactor` recomputes the factor off the *base* amount (`nextAmount / ingredient.amount`), never `factor × delta`, so repeated steps don't drift ([services/recipe-scaling.ts:66-82](services/recipe-scaling.ts#L66-L82)). Tests must respect this — there is no per-ingredient mutable quantity to assert against.
- **Two-stage, unit-keyed rounding**: per-unit rule round (`roundWhole` / `roundTwoDecimals` / `roundQuarter`, [recipe-scaling.ts:20-38](services/recipe-scaling.ts#L20-L38)), then a display round in `formatAmount` (`Math.round(v*100)/100` + `.`→`,`, [recipe-scaling.ts:103-106](services/recipe-scaling.ts#L103-L106)). An oracle that ignores the unit family produces false expectations.
- **The only `NaN` protector** is the `amount === 0 || amount === null` short-circuit in `stepFactor` ([recipe-scaling.ts:74](services/recipe-scaling.ts#L74)) — currently untested. There is **no `Number.isFinite` guard** and **no increment ceiling** ([recipe-scaling.ts:95-96](services/recipe-scaling.ts#L95-L96)).
- **Specific gaps** research enumerated: `łyżeczka` never exercised; `l` untested in `stepFactor`/`canStep`; zero-base branch untested; no `.5`-tie / round-down boundary; no multi-ingredient cross-check; `formatAmount` untested for negative / very large values.
- **Live constraint**: new test files must be registered in `package.json`'s `client:test` / `app:test` globs or they **silently never run** (per the editable-quantities archive). Both current target files are already listed; any *new* file is not.
- The screen is controlled (`factor` is a prop), so a component test proves the single-factor fan-out by rendering a heterogeneous ingredient list at a chosen factor and asserting each row independently — no Expo Router needed.

## Desired End State

`npm run client:test` and `npm run app:test` pass with new tests that:

1. Exercise every supported unit family in `displayedAmount`, `stepFactor`, and `canStep`, including the previously-uncovered `łyżeczka` and `l`.
2. Assert the **multi-ingredient cross-check**: under one shared factor, every ingredient's displayed amount equals an independently-computed `round(base × factor)` for its own unit — the literal risk-#1 scenario, at both the unit layer (math) and the screen layer (fan-out wiring).
3. Pin (characterize) the engine's behavior on non-finite / mistyped `amount` and document the unbounded increment.
4. Prove the row component stays stable when handed a garbage amount and renders the Polish-comma format correctly.
5. The test-plan §6.1 / §6.2 cookbook entries are filled, and the absent-guard finding is recorded.

## What We're NOT Doing

- **Not adding engine guards.** No `Number.isFinite` validation, no factor cap. Phase 1 documents current behavior; the gap is flagged for a follow-up change. (User decision: "document, flag for follow-up".)
- **Not testing a typed/free-text quantity field.** It does not exist; the typed-field framing of risk #2 is formally deferred until/unless such an editor ships.
- **Not researching or testing the client-parse trust boundary** (`services/recipe-details-client.ts`). Where malformed data could *enter* is deferred to Phase 3 (risk #5/#6 contract work). Phase 1 pins the engine at its own function boundary.
- **Not adding snapshot/pixel tests** (test-plan §7 exclusion).
- **Not touching the route** (`app/recipe/[id].tsx`); the controlled screen is sufficient for the fan-out signal.

## Implementation Approach

Four phases, each independently verifiable. Phases 1–2 extend [services/recipe-scaling.test.ts](services/recipe-scaling.test.ts) (unit, `client:test`). Phase 3 extends [components/recipe-details-screen.test.tsx](components/recipe-details-screen.test.tsx) and [components/recipe-ingredient-row.test.tsx](components/recipe-ingredient-row.test.tsx) (component, `app:test`). Phase 4 is wiring + documentation. No new test files are required (all targets already exist and are registered), which removes the silent-skip risk — Phase 4 verifies this explicitly.

The discipline throughout: **every expected value is computed independently** (by hand, in the test), never read back from `recipe-scaling.ts`. New `describe` blocks follow the existing file's `ing(amount, unit, name)` helper and `toBeCloseTo(…, 10)` convention for factor assertions.

## Critical Implementation Details

**Oracle independence (load-bearing).** The single thing that makes these tests meaningful for risk #1 is that no expected value calls `displayedAmount` / `stepFactor` / `UNIT_RULES`. For the multi-ingredient cross-check, compute each expected amount by hand against the unit's rounding rule (e.g. `g` → whole, `kg` → 2 dp, `szt`/kitchen → nearest 0.25). If a test computes the factor via `stepFactor` and then feeds it back through `displayedAmount` to get the expectation, it proves nothing — the factor may be *applied* by the module, but the expected *result* must be an independent literal.

**Characterization vs. assertion of correctness (risk #2).** The non-finite-amount tests document *what the engine does today* (`Math.round(NaN)` → `NaN` propagates; `amount * Infinity` → `Infinity`). Name these tests so it is unambiguous they pin current behavior, not desired behavior (e.g. `"propagates NaN for a non-finite amount (no guard today — see finding)"`). This prevents a future reader from mistaking the documented gap for intended design.

## Phase 1: Risk #1 — Scaling-Correctness Unit Coverage

### Overview

Close the enumerated unit-family and boundary gaps in the scaling engine, and add the multi-ingredient cross-check that is the literal risk-#1 scenario.

### Changes Required:

#### 1. Unit-family completeness

**File**: `services/recipe-scaling.test.ts`

**Intent**: Exercise the two unit families that have no coverage today so every entry in `UNIT_RULES` is tested. Add `łyżeczka` to the `displayedAmount` quarter-rounding cases, and add `l` (litre) to both the `stepFactor` and `canStep` describe blocks alongside the existing `kg`.

**Contract**: New `it` cases inside the existing `describe("displayedAmount rounding per unit family")`, `describe("stepFactor …")`, and `describe("canStep")` blocks. Expected values are independent literals (e.g. `displayedAmount(ing(2, "łyżeczka"), 1.3)` → `2.5`; `stepFactor(ing(1, "l"), 1, "increment")` ≈ `1.1`).

#### 2. Boundary & guard coverage

**File**: `services/recipe-scaling.test.ts`

**Intent**: Pin the zero-base divide-by-zero short-circuit and add a `.5`-tie / round-*down* case (all existing quarter examples round up, so the rounding direction is half-tested).

**Contract**: A test that `stepFactor(ing(0, "g"), 1.5, "increment")` returns the factor **unchanged** (`1.5`), exercising the `amount === 0` branch at [recipe-scaling.ts:74](services/recipe-scaling.ts#L74). A `displayedAmount` case whose product rounds down and one sitting on a `.5`/quarter tie (documenting `Math.round`'s round-half-up, no banker's rounding).

#### 3. Multi-ingredient cross-check (the risk-#1 scenario)

**File**: `services/recipe-scaling.test.ts`

**Intent**: Prove that one shared factor, applied across a heterogeneous ingredient list, recalculates *every* ingredient correctly in its own unit — not just the tapped one. This is the failure risk #1 names ("the *other* quantities").

**Contract**: A new `describe("a shared factor recalculates every ingredient independently")`. Build a list spanning unit families (e.g. `g`, `kg`, `szt`, `łyżka`, plus a non-scalable `null/null`). Derive one factor by stepping a single ingredient via `stepFactor`, then assert each other ingredient's `displayedAmount` equals a hand-computed `round(base × factor)` for its unit — and that the non-scalable ingredient stays at `0` / its raw amount. Every expectation is an independent literal.

#### 4. `formatAmount` extremes

**File**: `services/recipe-scaling.test.ts`

**Intent**: Cover `formatAmount` for negative and very large values, currently only tested for small positives.

**Contract**: New `it` cases in the existing `describe("formatAmount …")`: a negative value (sign preserved, comma separator) and a large value (e.g. `12345.5` → `"12345,5"`).

### Success Criteria:

#### Automated Verification:

- [ ] Client unit tests pass: `npm run client:test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Lint passes: `npm run lint`
- [ ] Every key in `UNIT_RULES` (incl. `łyżeczka`, `l`) is exercised by at least one new or existing assertion

#### Manual Verification:

- [ ] Spot-check that no new expected value is derived by calling `displayedAmount` / `stepFactor` / `UNIT_RULES` (oracle independence holds)
- [ ] The multi-ingredient cross-check reads as the risk-#1 scenario, not a single-ingredient repeat

**Implementation Note**: After automated verification passes, pause for human confirmation before Phase 2.

---

## Phase 2: Risk #2 (Reframed) — Data-Contract Characterization

### Overview

Characterize the engine's behavior at its data-trust boundary: what happens when a non-finite / mistyped `amount` reaches the pure functions, and the absence of an increment ceiling. These tests **document current behavior**; they do not assert a guard exists.

### Changes Required:

#### 1. Non-finite / mistyped `amount` characterization

**File**: `services/recipe-scaling.test.ts`

**Intent**: Pin how `displayedAmount` and `stepFactor` behave when `amount` is `NaN`, `Infinity`, or a non-finite value — the real "garbage into the engine" path now that the typed-field framing is dropped. Make the test names state that this is documented current behavior pending the guard finding.

**Contract**: A new `describe("characterizes behavior on non-finite input (no guard today)")`. Assert the actual current outputs — e.g. `displayedAmount(ing(NaN, "g"), 2)` is `NaN` (via `Number.isNaN`), `displayedAmount(ing(Infinity, "g"), 2)` is `Infinity`. Since `RecipeDetailsIngredient.amount` is typed `number | null`, feeding `NaN`/`Infinity` is type-legal; a deliberately wrong-typed value needs a localized cast — keep it minimal and commented.

#### 2. Unbounded-increment documentation

**File**: `services/recipe-scaling.test.ts`

**Intent**: Record that `canStep(…, "increment")` always returns `true` (no ceiling) and that repeated increments grow `displayedAmount` without bound — so a future guard change has an explicit before-state.

**Contract**: A test asserting `canStep(ing(1_000_000, "g"), 1000, "increment") === true` and that a large factor yields a correspondingly large `displayedAmount`. Comment links the absence to the Phase 4 finding.

### Success Criteria:

#### Automated Verification:

- [ ] Client unit tests pass: `npm run client:test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Lint passes: `npm run lint`

#### Manual Verification:

- [ ] Characterization test names make clear they pin *current* behavior, not desired behavior
- [ ] The deferral of the typed-field framing is obvious from the test comments / describe text

**Implementation Note**: After automated verification passes, pause for human confirmation before Phase 3.

---

## Phase 3: Component Layer — Fan-Out & Row Resilience

### Overview

One screen-level test proving the single factor fans out to every row (risk #1 at the UI), plus risk-targeted row additions for garbage-amount resilience and Polish-comma display (risk #2 at the UI).

### Changes Required:

#### 1. Single-factor fan-out across a heterogeneous list

**File**: `components/recipe-details-screen.test.tsx`

**Intent**: Prove that rendering the screen at one `factor` recalculates *every* scalable row in its own unit, while non-scalable rows show their static label. The existing `details` fixture has only one scalable ingredient; extend the fixture (or add a local one) to span units.

**Contract**: A new `it` rendering `RecipeDetailsScreen` with `factor` set to a non-1 value and an ingredient list across `g` / `kg` / `szt` (+ a `null/null` "do smaku" row). Assert each scaled amount via `screen.getByText` against a hand-computed literal, and that the non-scalable row still shows `"do smaku · nie skaluje się"`. Follows the existing mock of `@/hooks/use-theme-color`.

#### 2. Row stays stable on a garbage amount

**File**: `components/recipe-ingredient-row.test.tsx`

**Intent**: Risk #2 at the UI — feeding a non-finite `amount` must not crash the row or render a misleading control state.

**Contract**: A new `it` rendering `RecipeIngredientRow` with `ing(NaN, "g")`. Assert `render` does not throw and the row renders without presenting a valid steppable quantity (document the actual rendered text — e.g. the `formatAmount(NaN)` output). Pins current behavior; does not assert a guard.

#### 3. Polish-comma display in the row

**File**: `components/recipe-ingredient-row.test.tsx`

**Intent**: Confirm a fractional scaled value renders with the Polish comma at the component layer, closing the `formatAmount` → render path.

**Contract**: An `it` rendering a row whose scaled amount is fractional (e.g. `ing(1, "kg")` at `factor` 1.5 → `"1,5"`); assert `screen.getByText("1,5")`. Uses the existing `ing` helper.

### Success Criteria:

#### Automated Verification:

- [ ] Component tests pass: `npm run app:test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Lint passes: `npm run lint`

#### Manual Verification:

- [ ] The fan-out test visibly spans multiple unit families and includes a non-scalable row
- [ ] The garbage-amount row test confirms no crash and documents the rendered output

**Implementation Note**: After automated verification passes, pause for human confirmation before Phase 4.

---

## Phase 4: Wiring & Cookbook

### Overview

Verify the new tests actually run, fill the test-plan cookbook, and record the absent-guard finding so Phase 1's documented gap is not lost.

### Changes Required:

#### 1. Confirm test registration

**File**: `package.json` (verify only)

**Intent**: All new tests live in files already listed in `client:test` / `app:test`. Confirm `npm run client:test` and `npm run app:test` actually execute the new `describe` blocks (guard against the silent-skip pitfall). No edit expected; if a new file *was* introduced, add it to the relevant glob.

**Contract**: Run both scripts and confirm the new test counts appear in the output. `package.json` `scripts.client:test` / `scripts.app:test`.

#### 2. Fill cookbook §6.1 and §6.2

**File**: `context/foundation/test-plan.md`

**Intent**: Replace the "TBD — see §3 Phase 1" placeholders with the concrete how-to for this project: location, naming, a reference test, the run command, and the oracle-independence rule for §6.1; the controlled-component render + `getByText`/`getByLabelText` pattern and the garbage-input resilience pattern for §6.2.

**Contract**: §6.1 and §6.2 prose updated; reference [services/recipe-scaling.test.ts](services/recipe-scaling.test.ts) (multi-ingredient cross-check) and [components/recipe-details-screen.test.tsx](components/recipe-details-screen.test.tsx) / [components/recipe-ingredient-row.test.tsx](components/recipe-ingredient-row.test.tsx) as the canonical examples. Run commands: `npm run client:test`, `npm run app:test`.

#### 3. Record the absent-guard finding

**File**: `context/foundation/lessons.md` (or a new follow-up change via `/10x-new`)

**Intent**: Capture that the scaling engine has no `Number.isFinite` guard and no increment ceiling, that Phase 1 deliberately only *documented* this, and that a future change should decide whether to add guards. Prevents the gap from being silently forgotten.

**Contract**: A short lessons entry (or change stub) naming the gap, the characterization tests that pin current behavior, and the open policy question (guard vs. trust upstream invariant). Cross-reference research Open Question #3.

#### 4. Update §3 rollout status

**File**: `context/foundation/test-plan.md`

**Intent**: Mark the Phase 1 row complete once all above lands, so the orchestrator advances to Phase 2 on the next `/10x-test-plan` run.

**Contract**: §3 Phase 1 `Status` → `complete`; update the header "Last updated" line.

### Success Criteria:

#### Automated Verification:

- [ ] Full validate passes: `npm run validate`
- [ ] `npm run client:test` and `npm run app:test` output shows the new test cases executing

#### Manual Verification:

- [ ] §6.1 / §6.2 read as actionable how-tos, not placeholders
- [ ] The absent-guard finding is recorded and discoverable
- [ ] §3 Phase 1 status is `complete`

**Implementation Note**: Final phase — after verification, the change is ready to archive.

---

## Testing Strategy

### Unit Tests (`npm run client:test` → `services/recipe-scaling.test.ts`):

- Every `UNIT_RULES` family in `displayedAmount` / `stepFactor` / `canStep`, incl. `łyżeczka`, `l`
- Zero-base divide-by-zero short-circuit; `.5`-tie and round-down boundaries
- Multi-ingredient cross-check with independent oracles
- `formatAmount` negative / large values
- Non-finite-amount characterization; unbounded-increment documentation

### Component Tests (`npm run app:test`):

- Single-factor fan-out across a heterogeneous ingredient list + non-scalable row (`recipe-details-screen.test.tsx`)
- Garbage-amount row resilience; Polish-comma render (`recipe-ingredient-row.test.tsx`)

### Manual Testing Steps:

1. Run `npm run client:test` and `npm run app:test`; confirm new case counts appear.
2. Read the diff and confirm no expected value is lifted from the scaling module.
3. Confirm characterization tests are named as documenting current behavior.

## Performance Considerations

None — pure-function and component-render tests; negligible runtime.

## Migration Notes

No production code changes, no schema changes, no data migration. Tests only, plus documentation edits to `test-plan.md` and `lessons.md`.

## References

- Research: `context/changes/testing-scaling-correctness/research.md`
- Test plan: `context/foundation/test-plan.md` (§2 risk map, §3 rollout, §6 cookbook)
- Engine: `services/recipe-scaling.ts:55-106`
- Existing unit tests (oracle-clean reference): `services/recipe-scaling.test.ts:33-127`
- Existing component tests: `components/recipe-ingredient-row.test.tsx:40-119`, `components/recipe-details-screen.test.tsx`
- Upstream design rationale: `context/archive/2026-06-05-editable-ingredient-quantities/plan.md` (stepper-only, no-drift math, silent-skip pitfall)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Risk #1 — Scaling-Correctness Unit Coverage

#### Automated

- [x] 1.1 Client unit tests pass: `npm run client:test`
- [x] 1.2 Type checking passes: `npm run typecheck`
- [x] 1.3 Lint passes: `npm run lint`
- [x] 1.4 Every `UNIT_RULES` key (incl. `łyżeczka`, `l`) exercised

#### Manual

- [x] 1.5 Oracle independence holds (no expected value lifted from the module)
- [x] 1.6 Multi-ingredient cross-check reads as the risk-#1 scenario

### Phase 2: Risk #2 (Reframed) — Data-Contract Characterization

#### Automated

- [ ] 2.1 Client unit tests pass: `npm run client:test`
- [ ] 2.2 Type checking passes: `npm run typecheck`
- [ ] 2.3 Lint passes: `npm run lint`

#### Manual

- [ ] 2.4 Characterization test names make clear they pin current behavior
- [ ] 2.5 Typed-field deferral is obvious from comments / describe text

### Phase 3: Component Layer — Fan-Out & Row Resilience

#### Automated

- [ ] 3.1 Component tests pass: `npm run app:test`
- [ ] 3.2 Type checking passes: `npm run typecheck`
- [ ] 3.3 Lint passes: `npm run lint`

#### Manual

- [ ] 3.4 Fan-out test spans multiple unit families + a non-scalable row
- [ ] 3.5 Garbage-amount row test confirms no crash and documents output

### Phase 4: Wiring & Cookbook

#### Automated

- [ ] 4.1 Full validate passes: `npm run validate`
- [ ] 4.2 `client:test` / `app:test` output shows new cases executing

#### Manual

- [ ] 4.3 §6.1 / §6.2 cookbook entries are actionable how-tos
- [ ] 4.4 Absent-guard finding recorded and discoverable
- [ ] 4.5 §3 Phase 1 status set to `complete`
