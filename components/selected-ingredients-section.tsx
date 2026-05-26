import { Pressable, StyleSheet, Text, View } from "react-native";

import { IngredientChip } from "@/components/ingredient-chip";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

type SelectedIngredientsSectionProps = {
  ingredients: string[];
  onClear: () => void;
  onRemove: (ingredient: string) => void;
};

export function SelectedIngredientsSection({
  ingredients,
  onClear,
  onRemove,
}: SelectedIngredientsSectionProps) {
  const icon = useThemeColor({}, "icon");

  if (ingredients.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">Wybrane składniki</ThemedText>
        <Pressable onPress={onClear}>
          <Text style={[styles.clearAll, { color: icon }]}>Wyczyść</Text>
        </Pressable>
      </View>

      <View style={styles.chips}>
        {ingredients.map((ingredient) => (
          <IngredientChip
            key={ingredient}
            label={ingredient}
            onRemove={() => onRemove(ingredient)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearAll: {
    fontSize: 14,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
