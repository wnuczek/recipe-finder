import { useEffect, useRef, useState } from "react";
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { IngredientSuggestionList } from "@/components/ingredient-suggestion-list";
import { INGREDIENTS } from "@/constants/ingredients";
import { useThemeColor } from "@/hooks/use-theme-color";
import { matchIngredients } from "@/services/ingredient-match";
import { fetchIngredients } from "@/services/search-client";

type IngredientInputProps = {
  selected: string[];
  onAdd: (ingredient: string) => void;
};

export function IngredientInput({ selected, onAdd }: IngredientInputProps) {
  const [query, setQuery] = useState("");
  const [availableIngredients, setAvailableIngredients] =
    useState<string[]>(INGREDIENTS);
  const [activeIndex, setActiveIndex] = useState(0);
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
  const icon = useThemeColor({}, "icon");
  const border = useThemeColor(
    { light: "#d1d5db", dark: "#374151" },
    "background",
  );
  const suggestionBg = useThemeColor(
    { light: "#ffffff", dark: "#1f2937" },
    "background",
  );

  const hasQuery = query.trim().length > 0;
  const { items: suggestions, truncated } = matchIngredients(
    query,
    availableIngredients,
    selected,
  );

  // Reset the keyboard cursor whenever the result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function handleSelect(ingredient: string) {
    onAdd(ingredient);
    setQuery("");
    inputRef.current?.focus();
  }

  function handleKeyPress(
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) {
    const { key } = event.nativeEvent;
    if (key === "ArrowDown") {
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (key === "ArrowUp") {
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
  }

  function handleSubmit() {
    const active = suggestions[activeIndex];
    if (active) {
      handleSelect(active);
    }
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
          onKeyPress={handleKeyPress}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      {hasQuery && (
        <IngredientSuggestionList
          suggestions={suggestions}
          query={query}
          activeIndex={activeIndex}
          truncated={truncated}
          onSelect={handleSelect}
        />
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
});
