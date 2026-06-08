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
import { getRecipeSnapshot } from "@/services/recipe-snapshot-cache";
import { SearchClientError } from "@/services/search-client";

export default function RecipeDetailsRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [state, setState] = useState(() =>
    createInitialDetailsState(id ? (getRecipeSnapshot(id) ?? null) : null),
  );

  const loadDetails = useCallback(async () => {
    if (!id) {
      return;
    }

    setState((prev) => applyDetailsLoading(prev));

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

  return (
    <RecipeDetailsScreen
      state={state}
      onRetry={() => void loadDetails()}
      onBack={() => router.replace("/")}
    />
  );
}
