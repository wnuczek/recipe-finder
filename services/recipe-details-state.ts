import type { RecipeDetails } from "@/services/recipe-details-client";
import type { RankedRecipe } from "@/services/search-client";

export type RecipeDetailsStatus =
  | "loading"
  | "success"
  | "not_found"
  | "error";

export type RecipeDetailsUiState = {
  status: RecipeDetailsStatus;
  snapshot: RankedRecipe | null;
  details: RecipeDetails | null;
  errorMessage: string | null;
};

export function createInitialDetailsState(
  snapshot: RankedRecipe | null,
): RecipeDetailsUiState {
  return {
    status: "loading",
    snapshot,
    details: null,
    errorMessage: null,
  };
}

export function applyDetailsLoading(
  state: RecipeDetailsUiState,
): RecipeDetailsUiState {
  return {
    ...state,
    status: "loading",
    errorMessage: null,
  };
}

export function applyDetailsSuccess(
  state: RecipeDetailsUiState,
  details: RecipeDetails,
): RecipeDetailsUiState {
  return {
    ...state,
    status: "success",
    details,
    errorMessage: null,
  };
}

export function applyDetailsNotFound(
  state: RecipeDetailsUiState,
): RecipeDetailsUiState {
  return {
    ...state,
    status: "not_found",
    details: null,
    errorMessage: null,
  };
}

export function applyDetailsError(
  state: RecipeDetailsUiState,
  message: string,
): RecipeDetailsUiState {
  return {
    ...state,
    status: "error",
    errorMessage: message,
  };
}
