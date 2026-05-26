import type { RankedRecipe, Recipe } from "./types";

type RankOptions = {
  includeZeroMatches?: boolean;
};

function normalizeIngredient(value: string) {
  return value.trim().toLocaleLowerCase("pl-PL");
}

export function rankRecipes(
  selectedIngredients: string[],
  recipes: Recipe[],
  options: RankOptions = {},
): RankedRecipe[] {
  const includeZeroMatches = options.includeZeroMatches ?? false;
  const normalizedSelected = new Set(
    selectedIngredients.map(normalizeIngredient).filter(Boolean),
  );

  const selectedCount = normalizedSelected.size;

  return recipes
    .map((recipe) => {
      const recipeIngredientSet = new Set(
        recipe.ingredients.map(normalizeIngredient).filter(Boolean),
      );

      let matchCount = 0;
      for (const ingredient of normalizedSelected) {
        if (recipeIngredientSet.has(ingredient)) {
          matchCount += 1;
        }
      }

      const matchPercent =
        selectedCount === 0 ? 0 : Math.round((matchCount / selectedCount) * 100);

      return {
        ...recipe,
        matchCount,
        matchPercent,
        rank: 0,
      };
    })
    .filter((recipe) => includeZeroMatches || recipe.matchCount > 0)
    .sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }

      if (b.favoritesCount !== a.favoritesCount) {
        return b.favoritesCount - a.favoritesCount;
      }

      return a.title.localeCompare(b.title, "pl-PL");
    })
    .map((recipe, index) => ({
      ...recipe,
      rank: index + 1,
    }));
}
