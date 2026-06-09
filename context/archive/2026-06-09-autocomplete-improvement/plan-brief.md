# Ingredient Autocomplete Match-Quality Improvement — Plan Brief

> Full plan: `context/changes/autocomplete-improvement/plan.md`
> Frame brief: `context/changes/autocomplete-improvement/frame.md`

## What & Why

The ingredient autocomplete surfaces the *wrong or missing* ingredient because matching
is diacritic-blind and unranked with a silent 6-item cap — not because the dropdown lacks
affordances, and not because the data transport can't scale. This change fixes match
quality (the confirmed root cause) and adds the dropdown affordances on top.

## Starting Point

All match logic is 5 inline lines in `ingredient-input.tsx` — case-insensitive substring
`includes`, source-list order, hard `.slice(0, 6)`. No diacritic folding exists anywhere
in the repo, so a Polish user typing `losos` never finds `łosoś`. The catalog is 110
curated Polish ingredients; the component is 185 lines (near the 200-line cap).

## Desired End State

Accent-free typing matches accented ingredients, the closest (prefix) match leads, up to
ten results show with a "keep typing to narrow" hint when truncated, a no-match query
shows a "Brak składników" row, matched text is highlighted, and arrow keys + Enter
navigate. Match/rank logic lives in a unit-tested pure module.

## Key Decisions Made

| Decision              | Choice                                              | Why                                                              | Source |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| Root problem          | Match quality, not affordances or transport         | Evidence: diacritic-blind + unranked + silent cap                | Frame  |
| Scale / server work   | Out of scope                                        | PRD `data_volume: small`, FR-001 v1 supported-only               | Frame  |
| Matching algorithm    | Accent-fold + prefix-first rank (no fuzzy)          | Fixes both confirmed causes; fuzzy not evidenced, risks over-build | Plan   |
| Diacritic method      | 1:1 char map (not Unicode NFD)                      | `ł` has no NFD decomposition; 1:1 preserves highlight indices    | Plan   |
| Result cap            | Raise to ~10 + truncation hint                      | Stops silently hiding relevant items                             | Plan   |
| Affordances           | Empty state + highlighting + keyboard nav (all)     | User opted into full polish                                      | Plan   |
| Structure             | Pure `services/ingredient-match.ts` + row subcomponent | lessons.md "split into services"; stay under 200-line cap     | Plan   |
| Phasing               | Single combined phase                               | User chose to ship logic + affordances together                 | Plan   |

## Scope

**In scope:** diacritic folding, prefix-first ranking, raised cap + truncation hint,
no-results state, match highlighting, keyboard navigation, extracted pure module +
suggestion-row component, unit tests.

**Out of scope:** server-side suggest/pagination/virtualization, fuzzy/typo tolerance,
changes to the ingredient data source or `INGREDIENTS` constant.

## Architecture / Approach

New `services/ingredient-match.ts` (pure: `foldPolish`, `matchIngredients` →
`{ items, truncated }`) is unit-tested via vitest and consumed by `ingredient-input.tsx`.
The dropdown row is extracted to `ingredient-suggestion-row.tsx` (owns highlighting), and
the input adds active-index keyboard state, truncation hint, and empty state.

## Phases at a Glance

| Phase                                        | What it delivers                                       | Key risk                                                   |
| -------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| 1. Match engine + dropdown affordances       | Pure matching module + tests, rewired input, full polish | Highlight index alignment if folding isn't 1:1; keyboard nav on RN/web |

**Prerequisites:** none — all work is client-side in existing files.
**Estimated effort:** ~1 session.

## Open Risks & Assumptions

- Match highlighting relies on the 1:1 folding invariant (folded and original strings
  share indices) — using NFD would break it.
- Keyboard navigation has real value mainly on web/hardware-keyboard; touch is unaffected.
- Assumes the catalog stays small per PRD; if it later grows large, revisit transport
  (explicitly deferred).

## Success Criteria (Summary)

- `losos`→`łosoś` and `zolta`→`papryka żółta`; closest match leads.
- No-match shows an empty-state row instead of vanishing; truncation hint appears when results exceed the cap.
- `npm run typecheck`, `lint`, `client:test`, `app:test` all pass.
