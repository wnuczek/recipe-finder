import { FlatList, StyleSheet, Text, View } from "react-native";

import { IngredientSuggestionRow } from "@/components/ingredient-suggestion-row";
import { useThemeColor } from "@/hooks/use-theme-color";

type IngredientSuggestionListProps = {
  suggestions: string[];
  query: string;
  activeIndex: number;
  truncated: boolean;
  onSelect: (ingredient: string) => void;
};

export function IngredientSuggestionList({
  suggestions,
  query,
  activeIndex,
  truncated,
  onSelect,
}: IngredientSuggestionListProps) {
  const icon = useThemeColor({}, "icon");
  const border = useThemeColor(
    { light: "#d1d5db", dark: "#374151" },
    "background",
  );
  const suggestionBg = useThemeColor(
    { light: "#ffffff", dark: "#1f2937" },
    "background",
  );

  return (
    <View
      style={[
        styles.dropdown,
        { backgroundColor: suggestionBg, borderColor: border },
      ]}
    >
      {suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <IngredientSuggestionRow
              ingredient={item}
              query={query}
              active={index === activeIndex}
              onSelect={onSelect}
            />
          )}
          ListFooterComponent={
            truncated ? (
              <Text style={[styles.hint, { color: icon }]}>
                Wpisz więcej, aby zawęzić…
              </Text>
            ) : null
          }
        />
      ) : (
        <Text style={[styles.empty, { color: icon }]}>Brak składników</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 220,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hint: {
    fontSize: 13,
    fontStyle: "italic",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  empty: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
