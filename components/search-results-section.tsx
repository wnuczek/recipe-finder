import { StyleSheet, Text, View } from "react-native";

import { RecipeResultCard } from "@/components/recipe-result-card";
import { SearchErrorState } from "@/components/search-error-state";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { RankedRecipe } from "@/services/search-client";
import type { SearchStatus } from "@/services/search-state";

type SearchResultsSectionProps = {
  status: SearchStatus;
  results: RankedRecipe[];
  errorMessage: string | null;
  onRetry: () => void;
};

export function SearchResultsSection({
  status,
  results,
  errorMessage,
  onRetry,
}: SearchResultsSectionProps) {
  const icon = useThemeColor({}, "icon");

  if (status === "success") {
    return (
      <View style={styles.resultsSection}>
        <ThemedText type="defaultSemiBold" style={styles.resultsHeading}>
          Wyniki wyszukiwania
        </ThemedText>
        {results.map((recipe) => (
          <RecipeResultCard key={recipe.id} recipe={recipe} />
        ))}
      </View>
    );
  }

  if (status === "empty") {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <ThemedText style={[styles.emptyText, { color: icon }]}>
          Brak pasujących przepisów dla wybranych składników.
        </ThemedText>
      </View>
    );
  }

  if (status === "error") {
    return (
      <SearchErrorState
        message={errorMessage ?? "Wystąpił błąd wyszukiwania."}
        onRetry={onRetry}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  resultsSection: {
    marginTop: 24,
  },
  resultsHeading: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 48,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 260,
  },
});
