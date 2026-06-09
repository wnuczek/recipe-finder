import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { RecipeDetailsScreen } from "@/components/recipe-details-screen";
import { fetchRecipeDetails } from "@/services/recipe-details-client";
import {
  applyDetailsError,
  applyDetailsLoading,
  applyDetailsNotFound,
  applyDetailsSuccess,
  createInitialDetailsState,
} from "@/services/recipe-details-state";
import {
  RESET_FACTOR,
  type StepDirection,
  stepFactor,
} from "@/services/recipe-scaling";
import { getRecipeSnapshot } from "@/services/recipe-snapshot-cache";
import { SearchClientError } from "@/services/search-client";

export default function RecipeDetailsRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [state, setState] = useState(() =>
    createInitialDetailsState(id ? (getRecipeSnapshot(id) ?? null) : null),
  );
  const [factor, setFactor] = useState(RESET_FACTOR);

  const loadDetails = useCallback(async () => {
    if (!id) {
      return;
    }

    setState((prev) => applyDetailsLoading(prev));
    setFactor(RESET_FACTOR);

    try {
      const details = await fetchRecipeDetails(id);
      setState((prev) => applyDetailsSuccess(prev, details));
    } catch (error) {
      if (error instanceof SearchClientError && error.status === 404) {
        setState((prev) => applyDetailsNotFound(prev));
        return;
      }

      const message =
        error instanceof SearchClientError
          ? error.message
          : "Nie udało się pobrać przepisu.";
      setState((prev) => applyDetailsError(prev, message));
    }
  }, [id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const handleStep = useCallback(
    (ingredientName: string, direction: StepDirection) => {
      const ingredient = state.details?.ingredients.find(
        (item) => item.name === ingredientName,
      );
      if (!ingredient) {
        return;
      }
      setFactor((current) => stepFactor(ingredient, current, direction));
    },
    [state.details],
  );

  return (
    <RecipeDetailsScreen
      state={state}
      factor={factor}
      onRetry={() => void loadDetails()}
      onBack={() => router.replace("/")}
      onStep={handleStep}
      onReset={() => setFactor(RESET_FACTOR)}
    />
  );
}
