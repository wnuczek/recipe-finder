# Stabilize Ingredient Row Height During Scaling — Plan Brief

> Full plan: `context/changes/ingredient-row-height-shift/plan.md`

## What & Why

Recipe-detail ingredient rows grow taller the instant a quantity is scaled, pushing every
row below them down. The `oryg.` original-quantity line only mounts when `factor !== 1`,
so stepping a value adds a second line. This reserves that line's height so the row never
changes size during stepping.

## Starting Point

`recipe-ingredient-row.tsx:55-59` conditionally renders the `oryg.` note only when scaled.
At the original amount a scalable row is one line; once scaled it's two — that's the shift.
Rows render via plain `.map()` (no `FlatList`/`getItemLayout`), so height is intrinsic.

## Desired End State

Stepping an ingredient changes only the amount text — row height is identical at the
original and scaled states and nothing below moves. The original amount is still shown and
announced to screen readers only when actually scaled.

## Key Decisions Made

| Decision            | Choice                                          | Why                                                  | Source |
| ------------------- | ----------------------------------------------- | ---------------------------------------------------- | ------ |
| Reservation method  | Always render, transparent at factor 1          | Exact height match, no magic numbers                 | Plan   |
| Accessibility       | Hidden from a11y tree at factor 1               | Don't announce a meaningless original amount         | Plan   |
| Scope               | Only fix the scaling shift (scalable rows)      | Targets the reported problem; smallest change        | Plan   |
| Existing test       | Update to assert no height shift                | Encodes the real fix intent vs the old "absent" rule | Plan   |

## Scope

**In scope:** reserve the `oryg.` line height on scalable rows; visibility + a11y driven by
`factor`; update the row unit test.

**Out of scope:** normalizing non-scalable rows to a uniform height; scaling math; details
screen layout; hard-coded min-heights.

## Architecture / Approach

Single component change in `recipe-ingredient-row.tsx`: the `oryg.` line is always mounted,
with `opacity` and accessibility toggled by `factor` (`1` → transparent + a11y-hidden,
`!== 1` → visible + announced). The reserved line carries the same text it shows when
scaled, so reserved height equals scaled height. The unit test is updated to match.

## Phases at a Glance

| Phase                                   | What it delivers                          | Key risk                                       |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| 1. Reserve original-quantity line height | Stable row height + updated test          | a11y prop differences across web/iOS/Android   |

**Prerequisites:** none.
**Estimated effort:** ~1 short session (one file + its test).

## Open Risks & Assumptions

- Accessibility-hiding props differ by platform (`accessibilityElementsHidden` /
  `importantForAccessibility` / `aria-hidden`); the implementer applies the right set.
- Assumes reserving exactly one extra line is enough — true today since `oryg.` is always
  a single line.

## Success Criteria (Summary)

- Scaling an ingredient causes no vertical shift of surrounding rows.
- `oryg.` appears/announced only when scaled; row height identical in both states.
- `npm run typecheck`, `lint`, `app:test` all pass.
