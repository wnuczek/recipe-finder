import { Hono } from "hono";
import { z } from "zod";

import { rankRecipes } from "../search/rank-recipes";
import type { Recipe, SearchRequest, SearchResponse } from "../search/types";

const searchRequestSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  includeZeroMatches: z.boolean().optional(),
});

type SearchRouteDependencies = {
  listRecipesForSearch: () => Promise<Recipe[]>;
};

async function loadRecipesFromRepository() {
  const repository = await import("../db/repositories/recipe-repository.js");
  return repository.listRecipesForSearch();
}

export function createSearchRoute(
  dependencies: Partial<SearchRouteDependencies> = {},
) {
  const searchRoute = new Hono();

  searchRoute.get("/recipes/search", (c) => {
    c.header("allow", "POST");

    return c.json(
      {
        error:
          "Method not allowed. Use POST /api/recipes/search with JSON body: { ingredients: string[] }",
      },
      405,
    );
  });

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
      includeZeroMatches: parsed.data.includeZeroMatches,
    };
    const includeZeroMatches = request.includeZeroMatches ?? false;
    const readRecipes =
      dependencies.listRecipesForSearch ?? loadRecipesFromRepository;

    try {
      const recipes = await readRecipes();

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

      console.info("search.completed", {
        ingredientCount: response.query.ingredientCount,
        includeZeroMatches,
        totalCandidates: response.metadata.totalCandidates,
        returnedCount: response.metadata.returnedCount,
        durationMs: response.metadata.durationMs,
      });

      return c.json(response, 200);
    } catch (error) {
      console.error("search.failed", {
        error,
        ingredients: request.ingredients,
      });

      return c.json(
        {
          error: "Search failed. Try again.",
        },
        500,
      );
    }
  });

  return searchRoute;
}

export const searchRoute = createSearchRoute();
