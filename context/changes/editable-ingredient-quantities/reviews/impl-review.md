<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Editable Ingredient Quantities

- **Plan**: context/changes/editable-ingredient-quantities/plan.md
- **Scope**: All 4 phases
- **Date**: 2026-06-09
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Highlights

- Scaling no-drift claim verified empirically (g/250, g/333 odd base, kg/1, szt/3 all return to baseline after N up + N down steps).
- Search response contract stays `ingredients: string[]` — no regression to the search path.
- `recipe-client` / `recipes` route / row components mirror their siblings exactly (error class shape, error envelope, theme idioms); all arithmetic isolated in `services/recipe-scaling.ts`.
- Migration `0001_silky_hammerhead.sql` adds two NULLABLE columns (`IF NOT EXISTS`) — additive, backward-compatible, no data loss.
- `npm run validate` → exit 0; manual checks 4.3–4.8 verified end-to-end on web. Re-verified after F1 fix (app:test/lint/typecheck all exit 0).
- Lessons prior honored ("split code into reusable components/services" — separate row/section components + client/scaling services).

## Findings

### F1 — Increment stepper bypasses the symmetric canStep gate

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: components/recipe-ingredient-row.tsx:75
- **Detail**: Decrement called `canStep(...,"decrement")` but the increment button was hardcoded `disabled={false}`. No behavior change today (canStep always returns true for increment), but the per-direction gate was asymmetric, so a future increment-clamp rule would silently not take effect.
- **Fix**: Replace `disabled={false}` with `disabled={!canStep(ingredient, factor, "increment")}`, mirroring the decrement button.
- **Decision**: FIXED via Fix now

### F2 — Unplanned-but-reasonable placement: getRecipeById + route guards

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: server/src/db/repositories/recipe-repository.ts:86, server/src/routes/recipes.ts:22-39
- **Detail**: Plan named `server/src/search/*` for the detail fetch, but `getRecipeById` correctly landed in `recipe-repository.ts` (home of its siblings `listRecipesForSearch`/`listIngredients`). Route also added defensive 400 (empty id) and 500 branches (+ tests) not in the plan. All benign and consistent with the mirrored search route.
- **Fix**: Add a one-line addendum to plan.md Phase 2 noting the repository placement and the 400/500 guards, so future reviews don't re-flag them.
- **Decision**: FIXED via Fix now (plan.md Phase 2 addendum added)
