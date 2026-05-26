import { Hono } from "hono";
import { z } from "zod";

import { listRecipesForSearch } from "../db/repositories/recipe-repository";
import { rankRecipes } from "../search/rank-recipes";
import type { SearchRequest, SearchResponse } from "../search/types";

const searchRequestSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  includeZeroMatches: z.boolean().optional(),
});

export const searchRoute = new Hono();

searchRoute.post("/recipes/search", async (c) => {
  const startedAt = performance.now();
  const payload = await c.req.json().catch(() => null);

  const parsed = searchRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid payload. Expected: { ingredients: string[] }",
      },
      400,
    );
  }

  const request: SearchRequest = {
    ingredients: parsed.data.ingredients,
  };
  const includeZeroMatches = parsed.data.includeZeroMatches ?? false;
  const recipes = await listRecipesForSearch();

  const results = rankRecipes(request.ingredients, recipes, {
    includeZeroMatches,
  });

  const response: SearchResponse = {
    query: {
      ingredients: request.ingredients,
      ingredientCount: request.ingredients.length,
      includeZeroMatches,
    },
    metadata: {
      totalCandidates: recipes.length,
      returnedCount: results.length,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
    },
    results,
  };

  return c.json(response, 200);
});
