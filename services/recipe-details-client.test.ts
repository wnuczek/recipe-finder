import { describe, expect, it, vi } from "vitest";

import { fetchRecipeDetails } from "./recipe-details-client";

const successPayload = {
  recipe: {
    id: "r-001",
    title: "Kurczak curry z ryżem",
    favoritesCount: 42,
    ingredients: [
      { name: "curry", amount: 1, unit: "łyżka" },
      { name: "kurczak", amount: 500, unit: "g" },
      { name: "sól", amount: null, unit: null },
    ],
  },
  metadata: { durationMs: 12 },
};

describe("fetchRecipeDetails", () => {
  it("returns the parsed recipe for a successful response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => successPayload,
    });

    const recipe = await fetchRecipeDetails("r-001", {
      baseUrl: "http://localhost:8787",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:8787/api/recipes/r-001",
      expect.objectContaining({ method: "GET" }),
    );
    expect(recipe.title).toBe("Kurczak curry z ryżem");
    expect(recipe.ingredients).toContainEqual({
      name: "sól",
      amount: null,
      unit: null,
    });
  });

  it("maps 404 to a non-retryable not-found error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Recipe not found" }),
    });

    await expect(
      fetchRecipeDetails("nope", {
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      status: 404,
      retryable: false,
    });
  });

  it("maps 5xx responses to a retryable error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Could not load recipe." }),
    });

    await expect(
      fetchRecipeDetails("r-001", {
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      status: 500,
      retryable: true,
    });
  });

  it("maps network failures to a retryable error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      fetchRecipeDetails("r-001", {
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      retryable: true,
    });
  });

  it("maps malformed 200 payloads to a non-retryable error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recipe: { id: "r-001" } }),
    });

    await expect(
      fetchRecipeDetails("r-001", {
        baseUrl: "http://localhost:8787",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "SearchClientError",
      message: "Nieprawidłowa odpowiedź przepisu.",
      retryable: false,
    });
  });
});
