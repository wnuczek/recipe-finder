import { Hono } from "hono";

import type { RecipeDetails } from "../search/types";

type RecipeDetailsRouteDependencies = {
  getRecipeById: (id: string) => Promise<RecipeDetails | null>;
};

async function loadRecipeByIdFromRepository(id: string) {
  const repository = await import("../db/repositories/recipe-repository.js");
  return repository.getRecipeById(id);
}

export function createRecipeDetailsRoute(
  dependencies: Partial<RecipeDetailsRouteDependencies> = {},
) {
  const recipeDetailsRoute = new Hono();

  recipeDetailsRoute.get("/recipes/:id", async (c) => {
    const rawId = c.req.param("id");
    const recipeId = rawId?.trim() ?? "";

    if (recipeId.length === 0) {
      return c.json(
        {
          error: "Invalid recipe id.",
        },
        400,
      );
    }

    const readRecipeById =
      dependencies.getRecipeById ?? loadRecipeByIdFromRepository;

    const startedAt = performance.now();

    try {
      const recipe = await readRecipeById(recipeId);
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;

      console.info("details.completed", {
        recipeId,
        found: recipe !== null,
        durationMs,
      });

      if (!recipe) {
        return c.json(
          {
            error: "Recipe not found",
          },
          404,
        );
      }

      return c.json(
        {
          recipe,
          metadata: { durationMs },
        },
        200,
      );
    } catch (error) {
      console.error("details.failed", {
        error,
        recipeId,
      });

      return c.json(
        {
          error: "Could not load recipe.",
        },
        500,
      );
    }
  });

  return recipeDetailsRoute;
}

export const recipeDetailsRoute = createRecipeDetailsRoute();
