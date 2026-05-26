import { describe, expect, it, vi } from "vitest";

import { fetchIngredients, searchRecipes } from "./search-client";

describe("searchRecipes", () => {
  it("returns parsed payload for successful responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          ingredients: ["ryż"],
          ingredientCount: 1,
          includeZeroMatches: false,
        },
        metadata: {
          totalCandidates: 2,
          returnedCount: 1,
          durationMs: 12,
        },
        results: [
          {
            id: "r-1",
            title: "Ryż z warzywami",
            ingredients: ["ryż"],
            favoritesCount: 95,
            matchCount: 1,
            matchPercent: 100,
            rank: 1,
          },
        ],
      }),
    });

    const payload = await searchRecipes(["ryż"], {
      baseUrl: "http://localhost:8787",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:8787/api/recipes/search",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(payload.query.ingredientCount).toBe(1);
    expect(payload.results[0].rank).toBe(1);
  });

  it("maps 4xx responses to non-retryable SearchClientError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Invalid payload",
      }),
    });

    await expect(
      searchRecipes(["ryż"], {
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      message: "Invalid payload",
      retryable: false,
      status: 400,
    });
  });

  it("maps network failures to retryable SearchClientError", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      searchRecipes(["ryż"], {
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      retryable: true,
    });
  });

  it("maps malformed 200 responses to non-retryable SearchClientError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bad: true,
      }),
    });

    await expect(
      searchRecipes(["ryż"], {
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      message: "Nieprawidłowa odpowiedź wyszukiwania.",
      retryable: false,
    });
  });
});

describe("fetchIngredients", () => {
  it("returns ingredient list for successful response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ingredients: ["ryż", "pomidor"],
      }),
    });

    const ingredients = await fetchIngredients({
      baseUrl: "http://localhost:8787",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:8787/api/ingredients",
      expect.objectContaining({ method: "GET" }),
    );
    expect(ingredients).toEqual(["ryż", "pomidor"]);
  });

  it("throws SearchClientError for invalid response body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bad: true }),
    });

    await expect(
      fetchIngredients({
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      retryable: false,
    });
  });
});
