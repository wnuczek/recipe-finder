import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { IngredientChip } from "@/components/ingredient-chip";
import { IngredientInput } from "@/components/ingredient-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HomeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);

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

          {ingredients.length > 0 && (
            <View style={styles.chipsSection}>
              <View style={styles.chipsHeader}>
                <ThemedText type="defaultSemiBold">
                  Wybrane składniki
                </ThemedText>
                <Pressable onPress={() => setIngredients([])}>
                  <Text style={[styles.clearAll, { color: icon }]}>
                    Wyczyść
                  </Text>
                </Pressable>
              </View>
              <View style={styles.chips}>
                {ingredients.map((ing) => (
                  <IngredientChip
                    key={ing}
                    label={ing}
                    onRemove={() => removeIngredient(ing)}
                  />
                ))}
              </View>
            </View>
          )}

          <Pressable
            style={[
              styles.searchButton,
              { backgroundColor: tint },
              ingredients.length === 0 && styles.searchButtonDisabled,
            ]}
            disabled={ingredients.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Szukaj przepisów"
            accessibilityState={{ disabled: ingredients.length === 0 }}
          >
            <Text style={styles.searchButtonText}>Szukaj przepisów</Text>
          </Pressable>

          {ingredients.length === 0 && (
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
  chipsSection: {
    marginBottom: 24,
  },
  chipsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  clearAll: {
    fontSize: 14,
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
