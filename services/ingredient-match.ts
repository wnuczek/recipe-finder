// Pure matching/ranking for the ingredient autocomplete.
//
// Folding uses a 1:1 Polish character map (NOT Unicode NFD): `ł` has no
// combining-mark decomposition, and a 1:1 map preserves string length so a
// match range computed on the folded string can be applied directly to the
// original for highlighting.

const POLISH_FOLD_MAP: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

export function foldPolish(value: string): string {
  let out = "";
  for (const ch of value.toLowerCase()) {
    out += POLISH_FOLD_MAP[ch] ?? ch;
  }
  return out;
}

export type IngredientMatchResult = {
  items: string[];
  truncated: boolean;
};

/**
 * Diacritic-insensitive, prefix-first ranked match over the ingredient catalog.
 * Prefix matches rank above mid-string matches; ties break alphabetically (pl).
 * Already-selected ingredients are excluded. `truncated` is true when more
 * ingredients matched than `limit`.
 */
export function matchIngredients(
  query: string,
  available: string[],
  selected: string[],
  limit = 10,
): IngredientMatchResult {
  const folded = foldPolish(query.trim());
  if (folded.length === 0) {
    return { items: [], truncated: false };
  }

  const selectedSet = new Set(selected);
  const matches: { ingredient: string; prefix: boolean }[] = [];

  for (const ingredient of available) {
    if (selectedSet.has(ingredient)) continue;
    const index = foldPolish(ingredient).indexOf(folded);
    if (index === -1) continue;
    matches.push({ ingredient, prefix: index === 0 });
  }

  matches.sort((a, b) => {
    if (a.prefix !== b.prefix) return a.prefix ? -1 : 1;
    return a.ingredient.localeCompare(b.ingredient, "pl");
  });

  return {
    items: matches.slice(0, limit).map((match) => match.ingredient),
    truncated: matches.length > limit,
  };
}

/**
 * The [start, end) range within `ingredient` that matches `query`, or null if
 * there is no match. Indices are valid against the ORIGINAL string because
 * `foldPolish` is length-preserving.
 */
export function matchRange(
  ingredient: string,
  query: string,
): [number, number] | null {
  const folded = foldPolish(query.trim());
  if (folded.length === 0) return null;
  const index = foldPolish(ingredient).indexOf(folded);
  if (index === -1) return null;
  return [index, index + folded.length];
}
