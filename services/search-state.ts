import type { RankedRecipe } from "@/services/search-client";

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

export type SearchUiState = {
  status: SearchStatus;
  results: RankedRecipe[];
  errorMessage: string | null;
  lastRequest: string[] | null;
};

export function createInitialSearchState(): SearchUiState {
  return {
    status: "idle",
    results: [],
    errorMessage: null,
    lastRequest: null,
  };
}

export function applyLoading(state: SearchUiState): SearchUiState {
  return {
    ...state,
    status: "loading",
    errorMessage: null,
  };
}

export function applySuccess(
  state: SearchUiState,
  requestIngredients: string[],
  results: RankedRecipe[],
): SearchUiState {
  return {
    ...state,
    status: results.length === 0 ? "empty" : "success",
    results,
    errorMessage: null,
    lastRequest: requestIngredients,
  };
}

export function applyError(
  state: SearchUiState,
  requestIngredients: string[],
  message: string,
): SearchUiState {
  return {
    ...state,
    status: "error",
    results: [],
    errorMessage: message,
    lastRequest: requestIngredients,
  };
}

export function getRetryIngredients(
  state: SearchUiState,
  selectedIngredients: string[],
): string[] {
  return state.lastRequest ?? selectedIngredients;
}
