# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Split Code Into Reusable Components and Services

- **Context**: components
- **Problem**: all code in one file
- **Rule**: Always split code into reusable components, services etc.
- **Applies to**: implement, impl-review

## Scaling Engine Has No Non-Finite / Upper-Bound Guard (documented, not yet fixed)

- **Context**: `services/recipe-scaling.ts` — the pure scaling functions (`displayedAmount`, `stepFactor`, `canStep`). Surfaced during rollout Phase 1 (`testing-scaling-correctness`).
- **Problem**: The engine has **no `Number.isFinite` guard** — a `NaN`/`Infinity`/wrongly-typed `amount` propagates straight through (`Math.round(NaN)` → `NaN`; `amount * Infinity` → `Infinity`). The only `NaN` protector is the `amount === 0 || amount === null` divide-by-zero short-circuit in `stepFactor` (recipe-scaling.ts:74). There is also **no increment ceiling** (recipe-scaling.ts:95-96): `canStep(…, "increment")` always returns `true`, so the factor grows unbounded. The "amount and unit are both set or both null, and amount is finite" invariant is enforced upstream at seed/route level, **not** re-validated in the engine.
- **Rule**: This gap is **documented, not fixed**. Phase 1 was test-only: the characterization tests in `services/recipe-scaling.test.ts` (`describe("characterizes behavior on non-finite input (no guard today)")` and the unbounded-increment case) **pin current behavior** as an explicit before-state. Do not mistake those tests for intended design. The open policy question — actively guard non-finite input and cap the factor, vs. trust the upstream invariant — is deferred to a future change (research Open Question #3). Anyone adding a guard must update those characterization tests to assert the new behavior.
- **Applies to**: frame, plan, implement, impl-review

## Prefer getByText/getByLabelText Over JSON.stringify(toJSON()) Scans

- **Context**: component tests (`components/**/*.test.tsx`, @testing-library/react-native)
- **Problem**: asserting rendered output via `JSON.stringify(view.toJSON()).toContain(...)` matches substrings anywhere in the tree — it passes on incidental matches (a value in a style prop, an unrelated node), gives no role/label precision, and produces opaque failure output.
- **Rule**: query the rendered tree with `screen.getByText(...)` / `getByLabelText(...)` (exact composed-text match) instead of stringifying the JSON snapshot. Reserve `toJSON()` for intentional snapshot tests only.
- **Applies to**: implement, impl-review
