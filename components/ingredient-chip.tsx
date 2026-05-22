import { Pressable, StyleSheet, Text } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

type IngredientChipProps = {
  label: string;
  onRemove: () => void;
};

export function IngredientChip({ label, onRemove }: IngredientChipProps) {
  const tint = useThemeColor({}, "tint");
  const background = useThemeColor(
    { light: "#e6f4f9", dark: "#1a3a45" },
    "background",
  );

  return (
    <Pressable
      style={[styles.chip, { backgroundColor: background, borderColor: tint }]}
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
    >
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      <Text style={[styles.remove, { color: tint }]}>×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  remove: {
    fontSize: 18,
    marginLeft: 6,
    lineHeight: 20,
  },
});
