import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import type { RecipeDetails } from "../search/types";
import { createRecipeDetailsRoute } from "./recipe-details";

const recipeDetails: RecipeDetails = {
  id: "r-001",
  title: "Kurczak curry z ryżem",
  favoritesCount: 42,
  ingredients: [
    { name: "curry", amount: 1, unit: "łyżka" },
    { name: "kurczak", amount: 500, unit: "g" },
    { name: "sól", amount: null, unit: null },
  ],
};

function buildTestApp(
  getRecipeById: (id: string) => Promise<RecipeDetails | null>,
) {
  const app = new Hono();
  app.route("/api", createRecipeDetailsRoute({ getRecipeById }));
  return app;
}

describe("GET /api/recipes/:id", () => {
  it("returns 200 with the full ingredient quantity shape", async () => {
    const app = buildTestApp(async () => recipeDetails);

    const response = await app.request("/api/recipes/r-001", {
      method: "GET",
    });

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.recipe).toEqual(recipeDetails);
    expect(payload.recipe.ingredients).toContainEqual({
      name: "sól",
      amount: null,
      unit: null,
    });
    expect(payload.metadata.durationMs).toEqual(expect.any(Number));
  });

  it("returns 404 for an unknown id", async () => {
    const app = buildTestApp(async () => null);

    const response = await app.request("/api/recipes/nope", {
      method: "GET",
    });

    expect(response.status).toBe(404);

    const payload = await response.json();
    expect(payload.error).toBe("Recipe not found");
  });

  it("returns 400 for a blank id", async () => {
    const app = buildTestApp(async () => {
      throw new Error("repository should not be called for blank id");
    });

    const response = await app.request("/api/recipes/%20", {
      method: "GET",
    });

    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.error).toContain("Invalid recipe id");
  });

  it("returns 500 when the repository fails", async () => {
    const app = buildTestApp(async () => {
      throw new Error("db down");
    });

    const response = await app.request("/api/recipes/r-001", {
      method: "GET",
    });

    expect(response.status).toBe(500);

    const payload = await response.json();
    expect(payload.error).toContain("Could not load recipe");
  });
});
