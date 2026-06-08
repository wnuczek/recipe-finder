import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RecipeIngredientRow } from "@/components/recipe-ingredient-row";
import { SearchErrorState } from "@/components/search-error-state";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { RecipeDetailsIngredient } from "@/services/recipe-details-client";
import type { RecipeDetailsUiState } from "@/services/recipe-details-state";

type RecipeDetailsScreenProps = {
  state: RecipeDetailsUiState;
  onRetry: () => void;
  onBack: () => void;
};

function snapshotIngredients(names: string[]): RecipeDetailsIngredient[] {
  return names.map((name) => ({ name, amount: null, unit: null }));
}

export function RecipeDetailsScreen({
  state,
  onRetry,
  onBack,
}: RecipeDetailsScreenProps) {
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");

  if (state.status === "not_found") {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <ThemedText type="defaultSemiBold" style={styles.notFoundTitle}>
            Nie znaleziono przepisu
          </ThemedText>
          <ThemedText style={[styles.notFoundText, { color: icon }]}>
            Ten przepis nie istnieje lub został usunięty.
          </ThemedText>
          <Pressable
            style={[styles.backButton, { borderColor: tint }]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Wróć do wyszukiwania"
          >
            <Text style={[styles.backText, { color: tint }]}>
              Wróć do wyszukiwania
            </Text>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (state.status === "error") {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <SearchErrorState
            message={state.errorMessage ?? "Nie udało się pobrać przepisu."}
            onRetry={onRetry}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const title = state.details?.title ?? state.snapshot?.title ?? "Przepis";
  const favoritesCount =
    state.details?.favoritesCount ?? state.snapshot?.favoritesCount ?? null;
  const ingredients =
    state.details?.ingredients ??
    (state.snapshot ? snapshotIngredients(state.snapshot.ingredients) : []);
  const isLoading = state.status === "loading";

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          {favoritesCount !== null && (
            <ThemedText style={[styles.favorites, { color: icon }]}>
              Ulubione: {favoritesCount}
            </ThemedText>
          )}

          <ThemedText type="defaultSemiBold" style={styles.sectionHeading}>
            Składniki
          </ThemedText>
          <View>
            {ingredients.map((ingredient) => (
              <RecipeIngredientRow
                key={ingredient.name}
                ingredient={ingredient}
              />
            ))}
          </View>

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={tint} />
              <ThemedText style={[styles.loadingText, { color: icon }]}>
                Wczytywanie ilości…
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    flexGrow: 1,
  },
  title: {
    marginBottom: 6,
  },
  favorites: {
    marginBottom: 20,
    fontSize: 14,
  },
  sectionHeading: {
    marginBottom: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 56,
  },
  notFoundTitle: {
    fontSize: 18,
  },
  notFoundText: {
    textAlign: "center",
    maxWidth: 260,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  backText: {
    fontWeight: "600",
  },
});
