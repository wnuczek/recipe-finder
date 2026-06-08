import { IngredientInput } from "@/components/ingredient-input";
import { SearchResultsSection } from "@/components/search-results-section";
import { SelectedIngredientsSection } from "@/components/selected-ingredients-section";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { setRecipeSnapshots } from "@/services/recipe-snapshot-cache";
import { SearchClientError, searchRecipes } from "@/services/search-client";
import {
  applyError,
  applyLoading,
  applySuccess,
  createInitialSearchState,
  getRetryIngredients,
} from "@/services/search-state";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
export default function HomeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [searchState, setSearchState] = useState(createInitialSearchState());
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");

  function addIngredient(ingredient: string) {
    if (!ingredients.includes(ingredient)) {
      setIngredients((prev) => [...prev, ingredient]);
    }
  }

  function removeIngredient(ingredient: string) {
    setIngredients((prev) => prev.filter((i) => i !== ingredient));
  }

  async function runSearch(requestIngredients: string[]) {
    if (requestIngredients.length === 0) {
      return;
    }
    setSearchState((prev) => applyLoading(prev));
    try {
      const response = await searchRecipes(requestIngredients);
      setRecipeSnapshots(response.results);
      setSearchState((prev) =>
        applySuccess(prev, requestIngredients, response.results),
      );
    } catch (error) {
      if (error instanceof SearchClientError) {
        setSearchState((prev) =>
          applyError(prev, requestIngredients, error.message),
        );
        return;
      }
      setSearchState((prev) =>
        applyError(
          prev,
          requestIngredients,
          "Nie udało się pobrać wyników wyszukiwania.",
        ),
      );
    }
  }

  function handleRetry() {
    const retryIngredients = getRetryIngredients(searchState, ingredients);
    if (retryIngredients.length > 0) {
      void runSearch(retryIngredients);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              RecipeFinder
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Wpisz składniki, które masz pod ręką
            </ThemedText>
          </View>

          <View style={styles.inputSection}>
            <IngredientInput selected={ingredients} onAdd={addIngredient} />
          </View>

          <SelectedIngredientsSection
            ingredients={ingredients}
            onClear={() => setIngredients([])}
            onRemove={removeIngredient}
          />

          <Pressable
            style={[
              styles.searchButton,
              { backgroundColor: tint },
              (ingredients.length === 0 || searchState.status === "loading") &&
                styles.searchButtonDisabled,
            ]}
            disabled={
              ingredients.length === 0 || searchState.status === "loading"
            }
            onPress={() => void runSearch(ingredients)}
            accessibilityRole="button"
            accessibilityLabel="Szukaj przepisów"
            accessibilityState={{
              disabled:
                ingredients.length === 0 || searchState.status === "loading",
            }}
          >
            {searchState.status === "loading" ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.searchButtonText}>Szukaj przepisów</Text>
            )}
          </Pressable>

          <SearchResultsSection
            status={searchState.status}
            results={searchState.results}
            errorMessage={searchState.errorMessage}
            onRetry={handleRetry}
          />

          {searchState.status === "idle" && ingredients.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🥗</Text>
              <ThemedText style={[styles.emptyText, { color: icon }]}>
                Dodaj co najmniej jeden składnik, aby znaleźć pasujące przepisy
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 32,
    flexGrow: 1,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    opacity: 0.6,
  },
  inputSection: {
    marginBottom: 20,
    zIndex: 10,
  },
  searchButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  searchButtonDisabled: {
    opacity: 0.4,
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
