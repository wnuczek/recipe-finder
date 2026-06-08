import { z } from "zod";

import { SearchClientError } from "./search-client";

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

type RecipeDetailsClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

const productionApiBaseUrl =
  "https://recipe-finder-production-943b.up.railway.app";

const defaultApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "production"
    ? productionApiBaseUrl
    : "http://localhost:8787");

const recipeDetailsIngredientSchema = z.object({
  name: z.string(),
  amount: z.number().nullable(),
  unit: z.string().nullable(),
});

const recipeDetailsResponseSchema = z.object({
  recipe: z.object({
    id: z.string(),
    title: z.string(),
    favoritesCount: z.number(),
    ingredients: z.array(recipeDetailsIngredientSchema),
  }),
  metadata: z.object({
    durationMs: z.number(),
  }),
});

export async function fetchRecipeDetails(
  id: string,
  options: RecipeDetailsClientOptions = {},
): Promise<RecipeDetails> {
  const baseUrl = options.baseUrl ?? defaultApiBaseUrl;
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(
      `${baseUrl}/api/recipes/${encodeURIComponent(id)}`,
      { method: "GET" },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 404) {
        throw new SearchClientError("Nie znaleziono przepisu.", {
          status: 404,
          retryable: false,
        });
      }

      const message =
        typeof payload?.error === "string"
          ? payload.error
          : "Nie udało się pobrać przepisu.";

      throw new SearchClientError(message, {
        status: response.status,
        retryable: response.status >= 500,
      });
    }

    const parsed = recipeDetailsResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new SearchClientError("Nieprawidłowa odpowiedź przepisu.", {
        retryable: false,
      });
    }

    return parsed.data.recipe;
  } catch (error) {
    if (error instanceof SearchClientError) {
      throw error;
    }

    throw new SearchClientError("Błąd połączenia z API. Spróbuj ponownie.", {
      retryable: true,
    });
  }
}
