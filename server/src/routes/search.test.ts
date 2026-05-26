import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import type { Recipe } from "../search/types";
import { createSearchRoute } from "./search";

const repositoryRecipes: Recipe[] = [
  {
    id: "r-1",
    title: "A Ryz Curry",
    ingredients: ["ryż", "curry"],
    favoritesCount: 9,
  },
  {
    id: "r-2",
    title: "B Ryz Bowl",
    ingredients: ["ryż"],
    favoritesCount: 9,
  },
  {
    id: "r-3",
    title: "Tomato Soup",
    ingredients: ["pomidor"],
    favoritesCount: 30,
  },
];

function buildTestApp(recipes: Recipe[]) {
  const app = new Hono();
  app.route(
    "/api",
    createSearchRoute({
      listRecipesForSearch: async () => recipes,
    }),
  );

  return app;
}

describe("POST /api/recipes/search", () => {
  it("returns 405 for GET requests", async () => {
    const app = buildTestApp(repositoryRecipes);

    const response = await app.request("/api/recipes/search", {
      method: "GET",
    });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");

    const payload = await response.json();
    expect(payload.error).toContain("Method not allowed");
  });

  it("returns ranked recipes with metadata", async () => {
    const app = buildTestApp(repositoryRecipes);

    const response = await app.request("/api/recipes/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ingredients: ["ryż"] }),
    });

    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(payload.query.ingredientCount).toBe(1);
    expect(payload.metadata.totalCandidates).toBe(3);
    expect(payload.results[0]).toMatchObject({
      matchCount: expect.any(Number),
      matchPercent: expect.any(Number),
      rank: 1,
    });
    expect(payload.results[0].title).toBe("A Ryz Curry");
    expect(payload.results[1].title).toBe("B Ryz Bowl");
    expect(payload.metadata.durationMs).toEqual(expect.any(Number));
  });

  it("returns zero-match recipes when includeZeroMatches=true", async () => {
    const app = buildTestApp(repositoryRecipes);

    const response = await app.request("/api/recipes/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ingredients: ["imbir"],
        includeZeroMatches: true,
      }),
    });

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.metadata.returnedCount).toBe(
      payload.metadata.totalCandidates,
    );
    expect(payload.query.includeZeroMatches).toBe(true);
  });

  it("returns 400 for invalid payload", async () => {
    const app = buildTestApp(repositoryRecipes);

    const response = await app.request("/api/recipes/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ingredients: [] }),
    });

    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.error).toContain("Invalid payload");
  });

  it("returns 500 when repository fails", async () => {
    const app = new Hono();
    app.route(
      "/api",
      createSearchRoute({
        listRecipesForSearch: async () => {
          throw new Error("db down");
        },
      }),
    );

    const response = await app.request("/api/recipes/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ingredients: ["ryż"] }),
    });

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toContain("Search failed");
  });
});
