import { describe, expect, it } from "vitest";

import { rankRecipes } from "./rank-recipes";
import { RECIPES } from "./recipes.fixture";

describe("rankRecipes", () => {
  it("sorts by match count desc, favorites desc, then title asc", () => {
    const results = rankRecipes(["ryż", "papryka", "marchew"], RECIPES);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Ryż z warzywami");

    const tied = rankRecipes(["ryż"], RECIPES);
    expect(tied[0].favoritesCount).toBe(95);
    expect(tied[1].favoritesCount).toBe(95);
    expect(tied[0].title.localeCompare(tied[1].title, "pl-PL")).toBeLessThan(0);
  });

  it("assigns rank positions in sorted order", () => {
    const results = rankRecipes(["pomidor", "czosnek"], RECIPES);

    expect(results.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("filters out zero-match recipes by default", () => {
    const results = rankRecipes(["imbir", "chilli"], RECIPES);

    expect(results.length).toBe(0);
  });

  it("keeps zero-match recipes when includeZeroMatches is enabled", () => {
    const results = rankRecipes(["imbir", "chilli"], RECIPES, {
      includeZeroMatches: true,
    });

    expect(results.length).toBe(RECIPES.length);
    expect(results.every((result) => result.matchCount === 0)).toBe(true);
  });
});
