export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  favoritesCount: number;
};

export type RankedRecipe = Recipe & {
  matchCount: number;
  matchPercent: number;
  rank: number;
};

export type RecipeDetailsIngredient = {
  name: string;
  amount: number | null;
  unit: string | null;
};

export type RecipeDetails = {
  id: string;
  title: string;
  favoritesCount: number;
  ingredients: RecipeDetailsIngredient[];
};

export type SearchRequest = {
  ingredients: string[];
  includeZeroMatches?: boolean;
};

export type SearchResponse = {
  query: {
    ingredients: string[];
    ingredientCount: number;
    includeZeroMatches: boolean;
  };
  metadata: {
    totalCandidates: number;
    returnedCount: number;
    durationMs: number;
  };
  results: RankedRecipe[];
};
