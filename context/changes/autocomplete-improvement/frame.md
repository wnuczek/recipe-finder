# Frame Brief: Ingredient Autocomplete Improvement

> Framing step before /10x-plan. This document captures what is *actually*
> at issue, separated from what was initially assumed.

## Reported Observation

The ingredient autocomplete dropdown "feels clunky." No specific failed search —
a general polish pass. The user expects the ingredient list to be large/growing.

## Initial Framing (preserved)

- **User's stated cause or approach**: The dropdown UX is the weak spot — missing
  keyboard navigation, no highlighting of the matched text, no "no results" state,
  only 6 items shown.
- **User's proposed direction**: Improve the dropdown affordances.
- **Pre-dispatch narrowing**: Leading concern = "Dropdown UX is clunky"; trigger =
  "General improvement" (no specific incident); scale = "Large / growing".

## Dimension Map

The observation could originate at any of these dimensions:

1. **UI affordances** — keyboard nav, match highlighting, empty state, result count. ← initial framing
2. **Match quality** — substring (`includes`) vs prefix; no diacritic folding on a Polish list; no typo tolerance.
3. **Ranking** — results in source order, hard cap of 6 silently drops relevant matches; no relevance scoring.
4. **Data/transport at scale** — client loads the *entire* list once and filters in-memory; no server-side suggest endpoint.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| 1. UI affordances are the root | `ingredient-input.tsx:99-126` — tap-only dropdown, no keyboard nav / highlight / empty state. Real, but cosmetic; doesn't explain "right item missing." | WEAK (valid polish, not root) |
| 2. Match quality is inadequate | `ingredient-input.tsx:64-69` substring `includes`, `toLowerCase()` only — no diacritic folding. `constants/ingredients.ts` has 110 Polish items with ł/ó/ż/ą/ś (e.g. `łosoś`, `papryka żółta`, `śmietana`). Typing `losos`/`zolta` won't match. | STRONG |
| 3. Ranking / cap drops results | `ingredient-input.tsx:69` hard `.slice(0, 6)` after source-order filter; no `.sort()` or prefix priority anywhere in the path. Relevant items beyond the first 6 substring hits vanish silently. | STRONG |
| 4. Transport won't scale | `search-client.ts:134-175` GET `/api/ingredients` returns whole list; `server/src/routes/search.ts:178` "return all" route, no `?q=` suggest; in-memory filter. Confirmed full-list load. | STRONG (architecture) but see scale note |

## Narrowing Signals

- User explicitly selected *only* "Dropdown UX is clunky" — affordances — yet could
  not tie it to a concrete failed search. Felt-but-unlocalized clunkiness is the
  signature of poor match quality (the right item silently not appearing), not of
  missing keyboard shortcuts.
- User assumes "large/growing" scale, which makes transport (dim. 4) look urgent —
  but that assumption is contradicted by the PRD (see below).

## Cross-System Convention

PRD scopes this directly: `target_scale: data_volume: small` ([prd.md:8-11](../../foundation/prd.md)),
and FR-001's resolution states *"autocomplete zostaje, ale tylko dla wspieranych
składników v1"* — autocomplete is intentionally limited to a supported ingredient
set in v1 ([prd.md:60-61](../../foundation/prd.md)). At today's ~110 curated items,
in-memory substring filtering is adequate; the felt problem is *which* items surface
and *how*, not the cost of filtering. Server-side suggest / pagination is premature
against the stated v1 scope.

## Reframed Problem Statement

> **The actual problem to plan around is**: the autocomplete surfaces the *wrong or
> missing* ingredient because matching is diacritic-blind and unranked with a silent
> 6-item cap — not because the dropdown lacks affordances, and not because the data
> transport can't scale.

At the PRD-intended v1 scale (small, supported-only catalog), the load-all/filter
architecture is fine. The clunkiness the user feels is the result quality: a Polish
user typing without accents (`losos`, `zolta`) gets nothing, and even valid queries
return an unranked slice of 6 with no prefix priority and no signal that more were
dropped. Fixing match quality is the high-leverage change; affordance polish
(highlighting, empty state, keyboard nav) is welcome but secondary.

## Confidence

**HIGH** — strong, file-referenced evidence for match-quality + ranking as the root;
the "large/growing" scale premise is directly contradicted by the PRD. The one
judgment call is priority, not direction: the user named affordances, but the
evidence puts match quality first. Surfaced for the user to confirm at handoff.

## What Changes for /10x-plan

Plan should target **match quality in `ingredient-input.tsx`**: diacritic-insensitive
(accent-folding) matching for the Polish catalog, prefix-first relevance ranking, and
handling the result cap (raise it and/or signal "refine to narrow"). Treat affordance
polish (match highlighting, empty/"no results" state, keyboard navigation) as
secondary scope. **Do NOT** plan a server-side suggest endpoint, pagination, or list
virtualization — out of scope per PRD `data_volume: small` and FR-001 v1 limitation.

## References

- Source files: `components/ingredient-input.tsx:61-70`, `:99-126`; `constants/ingredients.ts:1-110`; `services/search-client.ts:134-175`; `server/src/routes/search.ts:178`; `server/src/db/repositories/recipe-repository.ts:125-134`
- Product intent: `context/foundation/prd.md:8-11`, `:60-61`
- Related research: none on disk for this change
