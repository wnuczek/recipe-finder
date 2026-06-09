---
change_id: editable-ingredient-quantities
title: Editable ingredient quantities with proportional recalculation
status: archived
created: 2026-06-05
updated: 2026-06-09
archived_at: 2026-06-09T09:30:22Z
---

## Notes

Implements PRD FR-005/FR-006 (roadmap slice S-02 outcome): recipe details screen with per-ingredient stepper editing and full proportional recalculation for supported units. Planned 2026-06-05 via /10x-plan with 9 questions answered; key divergence from defaults: stepper input (not free-text) with fixed per-unit steps.

## Reconciliation note (2026-06-09)

This change was originally planned and built as a standalone recipe-details feature (its own client `recipe-client.ts`, route `routes/recipes.ts`, migration, and screen) — see plan.md, which reflects that pre-rebase design. Meanwhile **master merged S-02 ("recipe-details-navigation")**, which already shipped the details screen, navigation, endpoint (`routes/recipe-details.ts`), client (`recipe-details-client.ts`), state reducers, snapshot cache, schema columns, and migration.

On rebasing onto master we chose to **layer this feature's editing onto S-02's foundation** rather than ship a parallel implementation. The surviving, merged shape is therefore narrower than plan.md:

- **Kept from S-02 (master):** all server code, `recipe-details-client.ts` / `recipe-details-state.ts` / `recipe-snapshot-cache.ts`, `app/recipe/[id].tsx`, `recipe-details-screen.tsx`.
- **Added by this change:** `services/recipe-scaling.ts` (pure base-immutable scaling engine), the editable stepper `components/recipe-ingredient-row.tsx` (replacing S-02's display-only row), factor state + reset wired into the existing screen and route.
- **Dropped (redundant with S-02):** our `recipe-client.ts`, `routes/recipes.ts`, `server/src/search/units.ts`, and the duplicate migration. The scaling engine now types against S-02's `RecipeDetailsIngredient`.
