import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { RankedRecipe } from "@/services/search-client";

type RecipeResultCardProps = {
  recipe: RankedRecipe;
};

export function RecipeResultCard({ recipe }: RecipeResultCardProps) {
  const border = useThemeColor(
    { light: "#d8e2e8", dark: "#30404a" },
    "background",
  );
  const icon = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");

  return (
    <View style={[styles.card, { borderColor: border }]}>
      <View style={styles.row}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {recipe.rank}. {recipe.title}
        </ThemedText>
        <ThemedText style={[styles.matchBadge, { color: tint }]}>
          {recipe.matchPercent}%
        </ThemedText>
      </View>

      <View style={styles.metaRow}>
        <ThemedText style={[styles.metaText, { color: icon }]}>
          Dopasowanie: {recipe.matchCount}
        </ThemedText>
        <ThemedText style={[styles.metaText, { color: icon }]}>
          Ulubione: {recipe.favoritesCount}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  matchBadge: {
    fontWeight: "700",
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaText: {
    fontSize: 13,
  },
});
