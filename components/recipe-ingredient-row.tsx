import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { RecipeDetailsIngredient } from "@/services/recipe-details-client";

type RecipeIngredientRowProps = {
  ingredient: RecipeDetailsIngredient;
};

function formatQuantity(ingredient: RecipeDetailsIngredient): string {
  if (ingredient.amount === null) {
    return "do smaku";
  }

  return ingredient.unit
    ? `${ingredient.amount} ${ingredient.unit}`
    : `${ingredient.amount}`;
}

export function RecipeIngredientRow({ ingredient }: RecipeIngredientRowProps) {
  const border = useThemeColor(
    { light: "#e2e8ed", dark: "#283038" },
    "background",
  );
  const icon = useThemeColor({}, "icon");

  return (
    <View style={[styles.row, { borderBottomColor: border }]}>
      <ThemedText style={styles.name}>{ingredient.name}</ThemedText>
      <ThemedText style={[styles.quantity, { color: icon }]}>
        {formatQuantity(ingredient)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  name: {
    flex: 1,
  },
  quantity: {
    fontSize: 14,
  },
});
