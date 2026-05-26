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

export type SearchRequest = {
  ingredients: string[];
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
