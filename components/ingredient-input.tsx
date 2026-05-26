import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { INGREDIENTS } from "@/constants/ingredients";
import { useThemeColor } from "@/hooks/use-theme-color";
import { fetchIngredients } from "@/services/search-client";

type IngredientInputProps = {
  selected: string[];
  onAdd: (ingredient: string) => void;
};

export function IngredientInput({ selected, onAdd }: IngredientInputProps) {
  const [query, setQuery] = useState("");
  const [availableIngredients, setAvailableIngredients] =
    useState<string[]>(INGREDIENTS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let canceled = false;

    async function loadIngredients() {
      try {
        const ingredients = await fetchIngredients();
        if (!canceled && ingredients.length > 0) {
          setAvailableIngredients(ingredients);
        }
      } catch {
        if (!canceled) {
          setAvailableIngredients(INGREDIENTS);
        }
      }
    }

    void loadIngredients();

    return () => {
      canceled = true;
    };
  }, []);

  const text = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");
  const icon = useThemeColor({}, "icon");
  const border = useThemeColor(
    { light: "#d1d5db", dark: "#374151" },
    "background",
  );
  const suggestionBg = useThemeColor(
    { light: "#ffffff", dark: "#1f2937" },
    "background",
  );

  const suggestions =
    query.trim().length > 0
      ? availableIngredients
          .filter(
            (ing) =>
              ing.toLowerCase().includes(query.toLowerCase()) &&
              !selected.includes(ing),
          )
          .slice(0, 6)
      : [];

  function handleSelect(ingredient: string) {
    onAdd(ingredient);
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputRow,
          { borderColor: border, backgroundColor: suggestionBg },
        ]}
      >
        <Text style={[styles.searchIcon, { color: icon }]}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: text }]}
          placeholder="Dodaj składnik…"
          placeholderTextColor={icon}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      {suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: suggestionBg, borderColor: border },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.suggestion,
                  pressed && { backgroundColor: tint + "1a" },
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.suggestionText, { color: text }]}>
                  {item}
                </Text>
                <Text style={[styles.addIcon, { color: tint }]}>+</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
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
  addIcon: {
    fontSize: 20,
    fontWeight: "600",
  },
});
