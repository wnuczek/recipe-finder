import { z } from "zod";

export type RankedRecipe = {
  id: string;
  title: string;
  ingredients: string[];
  favoritesCount: number;
  matchCount: number;
  matchPercent: number;
  rank: number;
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

export type IngredientsResponse = {
  ingredients: string[];
};

export class SearchClientError extends Error {
  status?: number;
  retryable: boolean;

  constructor(
    message: string,
    options: { status?: number; retryable: boolean },
  ) {
    super(message);
    this.name = "SearchClientError";
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

type SearchClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

const defaultApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

const rankedRecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  ingredients: z.array(z.string()),
  favoritesCount: z.number(),
  matchCount: z.number(),
  matchPercent: z.number(),
  rank: z.number(),
});

const searchResponseSchema = z.object({
  query: z.object({
    ingredients: z.array(z.string()),
    ingredientCount: z.number(),
    includeZeroMatches: z.boolean(),
  }),
  metadata: z.object({
    totalCandidates: z.number(),
    returnedCount: z.number(),
    durationMs: z.number(),
  }),
  results: z.array(rankedRecipeSchema),
});

export async function searchRecipes(
  ingredients: string[],
  options: SearchClientOptions = {},
): Promise<SearchResponse> {
  const baseUrl = options.baseUrl ?? defaultApiBaseUrl;
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(`${baseUrl}/api/recipes/search`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ingredients }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        typeof payload?.error === "string"
          ? payload.error
          : "Nie udało się pobrać wyników wyszukiwania.";

      throw new SearchClientError(message, {
        status: response.status,
        retryable: response.status >= 500,
      });
    }

    const parsedPayload = searchResponseSchema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new SearchClientError("Nieprawidłowa odpowiedź wyszukiwania.", {
        retryable: false,
      });
    }

    return parsedPayload.data;
  } catch (error) {
    if (error instanceof SearchClientError) {
      throw error;
    }

    throw new SearchClientError("Błąd połączenia z API. Spróbuj ponownie.", {
      retryable: true,
    });
  }
}

export async function fetchIngredients(
  options: SearchClientOptions = {},
): Promise<string[]> {
  const baseUrl = options.baseUrl ?? defaultApiBaseUrl;
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(`${baseUrl}/api/ingredients`, {
      method: "GET",
    });

    const payload = (await response
      .json()
      .catch(() => null)) as IngredientsResponse | null;

    if (!response.ok) {
      throw new SearchClientError("Nie udało się pobrać listy składników.", {
        status: response.status,
        retryable: response.status >= 500,
      });
    }

    if (!Array.isArray(payload?.ingredients)) {
      throw new SearchClientError("Nieprawidłowa odpowiedź listy składników.", {
        retryable: false,
      });
    }

    return payload.ingredients;
  } catch (error) {
    if (error instanceof SearchClientError) {
      throw error;
    }

    throw new SearchClientError(
      "Błąd połączenia podczas pobierania składników.",
      {
        retryable: true,
      },
    );
  }
}
