# Stabilize Ingredient Row Height During Scaling Implementation Plan

## Overview

Recipe-detail ingredient rows grow taller the moment a quantity is scaled, shoving
every row below them down. The cause is the `oryg.` original-quantity line, which only
mounts when `factor !== 1`. This change always reserves that line's vertical space —
the original amount is visible and announced only when scaled, but at `factor === 1`
the line is rendered transparent and hidden from the accessibility tree so the row
height never changes during stepping.

## Current State Analysis

- In [components/recipe-ingredient-row.tsx:55-59](components/recipe-ingredient-row.tsx#L55-L59),
  the `oryg.` note is conditionally rendered: `{factor !== 1 && (<ThemedText …/>)}`.
  At `factor === 1` the scalable row is a single line (name only); once scaled a second
  line appears → the row gets taller and the list below shifts.
- Non-scalable rows ([recipe-ingredient-row.tsx:32-43](components/recipe-ingredient-row.tsx#L32-L43))
  always render two lines (name + "do smaku · nie skaluje się"), so list heights are
  already mixed — but those rows never shift during interaction.
- Rows are rendered with a plain `.map()` in
  [recipe-details-screen.tsx:104-111](components/recipe-details-screen.tsx#L104-L111) —
  no `FlatList`/`getItemLayout`, so there is no fixed item-height contract to update.
- An existing test asserts the `oryg.` line is **absent** at `factor === 1`
  ([recipe-ingredient-row.test.tsx:33-43](components/recipe-ingredient-row.test.tsx#L33-L43));
  the new contract changes this and the test must be updated.

## Desired End State

Stepping a scalable ingredient up or down changes only the amount text — the row height
is identical at `factor === 1` and `factor !== 1`, and no rows below move. The original
amount still appears (and is announced to screen readers) only when actually scaled.
Verify by scaling any ingredient on the details screen and observing zero vertical shift
of the surrounding rows.

### Key Discoveries:

- Conditional render at [recipe-ingredient-row.tsx:55](components/recipe-ingredient-row.tsx#L55) is the sole cause.
- No `getItemLayout` to keep in sync — `.map()` rendering, height is intrinsic.
- The reserved line must carry the **same text content** it would show when scaled, so the reserved height exactly matches the scaled height.

## What We're NOT Doing

- Not normalizing non-scalable rows to a uniform list height — scope is limited to the
  scaling-induced shift on scalable rows (per the scope decision).
- Not introducing a hard-coded `minHeight` / magic number — space is reserved by the
  line itself, so it tracks font/line-height automatically.
- No changes to scaling math, data, or the details screen layout.

## Implementation Approach

Replace the conditional render with an always-rendered `oryg.` line whose visibility is
driven by `factor`. At `factor === 1` the line is transparent (reserving its space) and
removed from the accessibility tree; otherwise it is fully visible and announced. Update
the unit test to assert the new contract (announced/visible only when scaled, height
stable across states).

## Critical Implementation Details

- **User experience spec** — the reserved line must render the same `oryg. <amount> <unit>` text it would show when scaled (not an empty string), so its reserved height equals the scaled height exactly. Drive visibility with opacity, not conditional mounting.
- **Accessibility** — at `factor === 1` the reserved line must be excluded from the accessibility tree (e.g. `accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`, and `aria-hidden` on web) so screen readers don't announce a meaningless original amount when nothing is scaled.

## Phase 1: Reserve the original-quantity line height

### Overview

Make the `oryg.` line always occupy its space, visible and announced only when scaled,
and update the unit test to the new contract.

### Changes Required:

#### 1. Always-reserved original-quantity line

**File**: `components/recipe-ingredient-row.tsx`

**Intent**: Stop the scalable row from changing height when scaled by always rendering
the `oryg.` line and toggling only its visibility + accessibility based on `factor`.

**Contract**: The block at lines 55-59 changes from conditional mounting
(`{factor !== 1 && …}`) to an always-rendered `ThemedText` whose `opacity` is `1` when
`factor !== 1` and `0` when `factor === 1`, and which is hidden from the accessibility
tree when `factor === 1`. The displayed string remains `oryg. ${formatAmount(original)} ${unit}`
in both states so the reserved height matches. No prop or signature changes to
`RecipeIngredientRow`.

#### 2. Update the row unit test to the new contract

**File**: `components/recipe-ingredient-row.test.tsx`

**Intent**: Encode the new behavior — the original amount is meaningfully present only
when scaled, while its space is reserved at `factor === 1`.

**Contract**: Replace the `queryByText(/oryg\./)` "absent at factor 1" assertion
(lines 33-43) with assertions matching the chosen visibility/accessibility mechanism:
the `oryg.` text is announced/visible at `factor !== 1` and hidden (transparent +
out of a11y tree) at `factor === 1`. Existing scaled-value and stepper tests stay.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npm run typecheck`
- Linting passes: `npm run lint`
- Component tests pass: `npm run app:test`

#### Manual Verification:

- Scaling an ingredient up/down does not move the rows below it (no vertical shift).
- The `oryg. <amount>` line appears only when the ingredient is scaled away from its original amount.
- Row height is visually identical at the original amount and when scaled.
- A screen reader does not announce an original amount when the ingredient is at its original value.

**Implementation Note**: After automated verification passes, pause for manual confirmation before considering the change complete.

---

## Testing Strategy

### Unit Tests:

- `recipe-ingredient-row.test.tsx`: original announced/visible only when scaled; reserved (hidden) at factor 1; scaled value + steppers unchanged.

### Manual Testing Steps:

1. Open a recipe with at least one scalable ingredient.
2. Step the quantity up — confirm rows below do not jump; the `oryg.` line fades in.
3. Step back to the original — confirm the `oryg.` line disappears but the row keeps its height.

## Performance Considerations

None — rendering one extra always-present text node per scalable row is negligible.

## References

- Change notes: `context/changes/ingredient-row-height-shift/change.md`
- Source: `components/recipe-ingredient-row.tsx:55-59`; test at `components/recipe-ingredient-row.test.tsx:33-43`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Reserve the original-quantity line height

#### Automated

- [x] 1.1 Type checking passes: `npm run typecheck`
- [x] 1.2 Linting passes: `npm run lint`
- [x] 1.3 Component tests pass: `npm run app:test`

#### Manual

- [x] 1.4 Scaling an ingredient does not move the rows below it
- [x] 1.5 The `oryg.` line appears only when scaled away from the original amount
- [x] 1.6 Row height is visually identical at original and scaled states
- [x] 1.7 Screen reader does not announce an original amount at factor 1
