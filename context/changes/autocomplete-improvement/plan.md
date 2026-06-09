# Ingredient Autocomplete Match-Quality Improvement Implementation Plan

## Overview

Fix the ingredient autocomplete so it surfaces the *right* ingredient for a Polish
catalog: fold diacritics so accent-free typing matches, rank prefix matches above
substring matches, stop silently dropping results behind a hard cap, and add the
dropdown affordances (no-results state, match highlighting, keyboard navigation).
The match/rank logic is extracted into a pure, unit-tested service module; the
dropdown UI is split into subcomponents to respect the 200-line cap.

## Current State Analysis

- All match logic lives inline in [components/ingredient-input.tsx:61-70](components/ingredient-input.tsx#L61-L70):
  `availableIngredients.filter(ing => ing.toLowerCase().includes(query.toLowerCase()) && !selected.includes(ing)).slice(0, 6)`.
  - Case-insensitive substring only — **no diacritic folding**. Repo-wide grep found
    zero `normalize`/locale helpers.
  - Source-list order — **no relevance ranking**; prefix matches are not floated up.
  - Hard `.slice(0, 6)` — relevant items beyond the first six **vanish with no signal**.
- Catalog is 110 curated Polish ingredients with ł/ó/ż/ą/ś etc. ([constants/ingredients.ts](constants/ingredients.ts)),
  loaded once via `fetchIngredients()` with that constant as fallback ([components/ingredient-input.tsx:26-47](components/ingredient-input.tsx#L26-L47)).
- The dropdown is tap-only: no keyboard nav, no match highlighting, no empty state
  ([components/ingredient-input.tsx:99-126](components/ingredient-input.tsx#L99-L126)).
- The component is 185 lines — adding affordances will exceed the 200-line cap from AGENTS.md.
- Established pattern to follow: [services/recipe-scaling.ts](services/recipe-scaling.ts) is a
  pure module with `recipe-scaling.test.ts` run by the `client:test` vitest script; component
  tests run via the `app:test` jest script (`package.json`).

This is grounded in `context/changes/autocomplete-improvement/frame.md` (Confidence: HIGH).

## Desired End State

Typing in the ingredient field returns diacritic-insensitive, prefix-ranked results:
`losos` finds `łosoś`, `zolta` finds `papryka żółta`, and the closest match appears
first. Up to ten results show; when more match, a subtle "keep typing to narrow" hint
appears. A no-match query shows a "Brak składników" row rather than vanishing. The
matched text is highlighted in each suggestion, and arrow keys + Enter navigate and
select. Match/rank logic is a pure module with passing unit tests.

### Key Discoveries:

- No diacritic folding exists anywhere — must be built ([components/ingredient-input.tsx:66](components/ingredient-input.tsx#L66)).
- Pure-module + vitest pattern is established and wired ([services/recipe-scaling.ts](services/recipe-scaling.ts), `package.json` `client:test`).
- Polish folding must be a **1:1 char map**, not Unicode NFD — `ł` has no combining-mark
  decomposition, and a 1:1 map preserves string length so highlight indices stay aligned.
- Component is at the 200-line boundary — extraction is required, not optional (lessons.md, AGENTS.md).

## What We're NOT Doing

- No server-side suggest/search endpoint, pagination, or list virtualization — out of
  scope per PRD `data_volume: small` and FR-001 v1 limitation (frame.md Cross-System Convention).
- No fuzzy/typo tolerance (e.g. Levenshtein) — accent + position handling only, per the
  matching decision; true typos like `pomdior` are out of scope.
- No change to the ingredient data source, `fetchIngredients()`, or the `INGREDIENTS` constant.

## Implementation Approach

Extract a pure `services/ingredient-match.ts` that owns folding, ranking, and capping,
returning both the visible results and a `truncated` flag. Rewire `ingredient-input.tsx`
to call it and to render the new affordances, extracting the suggestion row into its own
component so highlighting logic is isolated and the parent stays under 200 lines.
Single phase — logic and affordances ship together.

## Critical Implementation Details

- **Diacritic folding must be a 1:1 character map** (`ł→l, ó→o, ż→z, ź→z, ą→a, ę→e, ś→s, ć→c, ń→n` and uppercase), applied after `toLowerCase()`. Do **not** use `.normalize("NFD")` — it does not decompose `ł`, and length-changing normalization would break the index alignment that match highlighting depends on. Because the map is 1:1, the folded string and the original share character indices, so a match range computed on the folded string can be applied directly to the original for highlighting.
- **Ranking order**: prefix matches (folded candidate `startsWith` folded query) rank above non-prefix substring matches; ties broken alphabetically (`localeCompare("pl")`). Already-selected ingredients are excluded before ranking.

## Phase 1: Match-quality engine and dropdown affordances

### Overview

Build the pure matching module with tests, rewire the input to use it, and add the
no-results state, truncation hint, match highlighting, and keyboard navigation.

### Changes Required:

#### 1. Pure matching module

**File**: `services/ingredient-match.ts` (new)

**Intent**: Own all autocomplete matching so it is testable in isolation and the
component stays thin — diacritic folding, prefix-first ranking, exclusion of selected
items, and capping with a truncation signal.

**Contract**: Exports `foldPolish(value: string): string` (1:1 diacritic map, see
Critical Implementation Details) and `matchIngredients(query, available, selected, limit = 10): { items: string[]; truncated: boolean }`. `truncated` is true when the number of matches exceeds `limit`. Empty/whitespace query yields `{ items: [], truncated: false }`.

#### 2. Matching module unit tests

**File**: `services/ingredient-match.test.ts` (new)

**Intent**: Lock the confirmed-fix behaviors so they cannot regress.

**Contract**: vitest cases covering — accent-free query matches accented ingredient
(`losos`→`łosoś`, `zolta`→`papryka żółta`); prefix match ranks above mid-string match;
selected items excluded; `truncated` true when matches exceed the limit and false otherwise;
empty query returns no items.

#### 3. Wire the new test into the client test script

**File**: `package.json`

**Intent**: Ensure the new module runs under `npm run client:test` / `validate`.

**Contract**: Append `services/ingredient-match.test.ts` to the `client:test` script's file list.

#### 4. Suggestion row subcomponent with highlighting

**File**: `components/ingredient-suggestion-row.tsx` (new)

**Intent**: Isolate per-row rendering — the matched substring is highlighted, and the
row reflects keyboard-active state — keeping the parent under the 200-line cap.

**Contract**: Props `{ ingredient: string; query: string; active: boolean; onSelect: (ingredient: string) => void }`. Computes the match range via `foldPolish` on both row and query (indices align with the original string per Critical Implementation Details) and renders the matched segment emphasized. Reuses existing theme colors and suggestion styles.

#### 5. Rewire input: ranked results, affordances, keyboard nav

**File**: `components/ingredient-input.tsx`

**Intent**: Replace the inline filter with `matchIngredients(...)`; render up to 10
`IngredientSuggestionRow`s; show a "keep typing to narrow" footer when `truncated`; show a
"Brak składników" row when the query is non-empty but yields no matches; support
arrow-up/down to move an active index and Enter to add the active suggestion.

**Contract**: Adds `activeIndex` state reset on query/result change; `onKeyPress`
(arrow up/down) and `onSubmitEditing`/Enter select the active row via the existing
`handleSelect`. Inline filter at lines 61-70 is removed in favor of the module call. No
prop changes to `IngredientInput`'s public signature (`selected`, `onAdd`).

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npm run typecheck`
- Linting passes: `npm run lint`
- Matching module tests pass: `npm run client:test`
- Component tests pass: `npm run app:test`

#### Manual Verification:

- Typing `losos` (no accents) surfaces `łosoś`; `zolta` surfaces `papryka żółta`.
- For a query with many matches, the closest/prefix match appears first and the "keep typing to narrow" hint shows.
- A query matching nothing shows the "Brak składników" empty row instead of the dropdown disappearing.
- The matched portion of each suggestion is visibly highlighted.
- Arrow keys move the highlighted suggestion and Enter adds it (hardware keyboard / web).
- Selecting an ingredient still clears the input and refocuses; already-selected items don't reappear.

**Implementation Note**: After automated verification passes, pause for manual confirmation before considering the change complete.

---

## Testing Strategy

### Unit Tests:

- `services/ingredient-match.test.ts` (vitest): folding, prefix-vs-substring ranking, selected-exclusion, truncation flag, empty query.
- `components/ingredient-suggestion-row.test.tsx` (jest, optional but recommended): highlight range renders for an accent-folded match.

### Manual Testing Steps:

1. Launch the app, open the ingredient input.
2. Type accent-free Polish queries (`losos`, `zolta`, `smietana`) and confirm accented ingredients match.
3. Type a broad query (e.g. `pa`) and confirm prefix matches lead and the truncation hint appears.
4. Type gibberish and confirm the empty-state row.
5. With a keyboard, arrow through and Enter-select.

## Performance Considerations

In-memory filtering over ~110 items per keystroke is negligible; folding is O(n) per
candidate with a tiny constant. No memoization needed at this scale.

## References

- Frame brief: `context/changes/autocomplete-improvement/frame.md`
- Pattern to follow: `services/recipe-scaling.ts` + `services/recipe-scaling.test.ts`
- Source: `components/ingredient-input.tsx:61-70`, `:99-126`; `constants/ingredients.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Match-quality engine and dropdown affordances

#### Automated

- [x] 1.1 Type checking passes: `npm run typecheck` — 9d75b37
- [x] 1.2 Linting passes: `npm run lint` — 9d75b37
- [x] 1.3 Matching module tests pass: `npm run client:test` — 9d75b37
- [x] 1.4 Component tests pass: `npm run app:test` — 9d75b37

#### Manual

- [x] 1.5 Accent-free query matches accented ingredient (`losos`→`łosoś`, `zolta`→`papryka żółta`) — 9d75b37
- [x] 1.6 Prefix match leads and truncation hint shows for many matches — 9d75b37
- [x] 1.7 No-match query shows the "Brak składników" empty row — 9d75b37
- [x] 1.8 Matched portion of each suggestion is highlighted — 9d75b37
- [x] 1.9 Arrow keys move the active suggestion and Enter adds it — 9d75b37
- [x] 1.10 Selecting clears + refocuses input; selected items don't reappear — 9d75b37
