import type { Context } from "hono";
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
  listIngredients: () => Promise<string[]>;
};

async function loadRecipesFromRepository() {
  const repository = await import("../db/repositories/recipe-repository.js");
  return repository.listRecipesForSearch();
}

async function loadIngredientsFromRepository() {
  const repository = await import("../db/repositories/recipe-repository.js");
  return repository.listIngredients();
}

type SearchExecutionInput = {
  ingredients: string[];
  includeZeroMatches: boolean;
};

export function createSearchRoute(
  dependencies: Partial<SearchRouteDependencies> = {},
) {
  const searchRoute = new Hono();

  async function executeSearch(c: Context, input: SearchExecutionInput) {
    const startedAt = performance.now();
    const readRecipes =
      dependencies.listRecipesForSearch ?? loadRecipesFromRepository;

    try {
      const recipes = await readRecipes();

      const results = rankRecipes(input.ingredients, recipes, {
        includeZeroMatches: input.includeZeroMatches,
      });

      const response: SearchResponse = {
        query: {
          ingredients: input.ingredients,
          ingredientCount: input.ingredients.length,
          includeZeroMatches: input.includeZeroMatches,
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
        includeZeroMatches: input.includeZeroMatches,
        totalCandidates: response.metadata.totalCandidates,
        returnedCount: response.metadata.returnedCount,
        durationMs: response.metadata.durationMs,
      });

      return c.json(response, 200);
    } catch (error) {
      console.error("search.failed", {
        error,
        ingredients: input.ingredients,
      });

      return c.json(
        {
          error: "Search failed. Try again.",
        },
        500,
      );
    }
  }

  searchRoute.get("/recipes/search", async (c) => {
    const ingredientsQuery = c.req.queries("ingredients") ?? [];
    const includeZeroMatchesQuery = c.req.query("includeZeroMatches");

    const ingredients = ingredientsQuery
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (ingredients.length === 0) {
      return c.json(
        {
          error:
            "Invalid query. Expected at least one ingredients value, e.g. /api/recipes/search?ingredients=ryż",
        },
        400,
      );
    }

    const includeZeroMatches = includeZeroMatchesQuery === "true";

    return executeSearch(c, {
      ingredients,
      includeZeroMatches,
    });
  });

  searchRoute.post("/recipes/search", async (c) => {
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

    return executeSearch(c, {
      ingredients: request.ingredients,
      includeZeroMatches: request.includeZeroMatches ?? false,
    });
  });

  searchRoute.get("/ingredients", async (c) => {
    const readIngredients =
      dependencies.listIngredients ?? loadIngredientsFromRepository;

    try {
      const ingredients = await readIngredients();
      return c.json({ ingredients }, 200);
    } catch (error) {
      console.error("ingredients.failed", { error });
      return c.json({ error: "Could not load ingredients." }, 500);
    }
  });

  return searchRoute;
}

export const searchRoute = createSearchRoute();
