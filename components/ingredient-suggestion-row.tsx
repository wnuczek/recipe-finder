import { Pressable, StyleSheet, Text } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { matchRange } from "@/services/ingredient-match";

type IngredientSuggestionRowProps = {
  ingredient: string;
  query: string;
  active: boolean;
  onSelect: (ingredient: string) => void;
};

export function IngredientSuggestionRow({
  ingredient,
  query,
  active,
  onSelect,
}: IngredientSuggestionRowProps) {
  const text = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");
  const range = matchRange(ingredient, query);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.suggestion,
        (pressed || active) && { backgroundColor: tint + "1a" },
      ]}
      onPress={() => onSelect(ingredient)}
    >
      <Text style={[styles.suggestionText, { color: text }]}>
        {range ? (
          <>
            {ingredient.slice(0, range[0])}
            <Text style={[styles.match, { color: tint }]}>
              {ingredient.slice(range[0], range[1])}
            </Text>
            {ingredient.slice(range[1])}
          </>
        ) : (
          ingredient
        )}
      </Text>
      <Text style={[styles.addIcon, { color: tint }]}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionText: {
    fontSize: 15,
  },
  match: {
    fontWeight: "700",
  },
  addIcon: {
    fontSize: 20,
    fontWeight: "600",
  },
});
