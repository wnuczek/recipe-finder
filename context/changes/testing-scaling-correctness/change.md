---
change_id: testing-scaling-correctness
title: Scaling & edit-input correctness (test rollout Phase 1)
status: impl_reviewed
created: 2026-06-09
updated: 2026-06-11
archived_at: null
---

## Notes

Rollout Phase 1 of the project test plan (`context/foundation/test-plan.md` §3). Covers **risk #1** (proportional scaling recalculates other ingredient quantities incorrectly) and **risk #2** (a quantity-edit field accepts an invalid/empty/locale value and feeds garbage into the scaling engine). Test types: unit + component.

Opened by the `/10x-research` handoff. See `research.md` for the grounded code surface — note that research found **risk #2's framing does not match the implementation**: there is no free-text quantity-edit field; scaling is driven by discrete `−`/`+` steppers. Per test-plan §1 principle #3, research is ground truth; risk #2 is reframed in `research.md` and must be re-scoped during `/10x-plan`.
