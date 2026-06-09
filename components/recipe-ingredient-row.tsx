import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { RecipeDetailsIngredient } from "@/services/recipe-details-client";
import {
  canStep,
  displayedAmount,
  formatAmount,
  isScalable,
  type StepDirection,
} from "@/services/recipe-scaling";

type RecipeIngredientRowProps = {
  ingredient: RecipeDetailsIngredient;
  factor: number;
  onStep: (direction: StepDirection) => void;
};

export function RecipeIngredientRow({
  ingredient,
  factor,
  onStep,
}: RecipeIngredientRowProps) {
  const border = useThemeColor(
    { light: "#d8e2e8", dark: "#30404a" },
    "background",
  );
  const icon = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");

  if (!isScalable(ingredient)) {
    return (
      <View style={[styles.row, { borderColor: border }]}>
        <View style={styles.nameColumn}>
          <ThemedText style={styles.name}>{ingredient.name}</ThemedText>
          <ThemedText style={[styles.note, { color: icon }]}>
            do smaku · nie skaluje się
          </ThemedText>
        </View>
      </View>
    );
  }

  const unit = ingredient.unit ?? "";
  const current = displayedAmount(ingredient, factor);
  const original = displayedAmount(ingredient, 1);
  const canDecrement = canStep(ingredient, factor, "decrement");
  const canIncrement = canStep(ingredient, factor, "increment");

  return (
    <View style={[styles.row, { borderColor: border }]}>
      <View style={styles.nameColumn}>
        <ThemedText style={styles.name}>{ingredient.name}</ThemedText>
        {factor !== 1 && (
          <ThemedText style={[styles.note, { color: icon }]}>
            {`oryg. ${formatAmount(original)} ${unit}`}
          </ThemedText>
        )}
      </View>

      <View style={styles.stepperColumn}>
        <StepperButton
          label="−"
          tint={tint}
          disabled={!canDecrement}
          accessibilityLabel={`Zmniejsz ${ingredient.name}`}
          onPress={() => onStep("decrement")}
        />
        <ThemedText style={styles.amount}>
          {`${formatAmount(current)} ${unit}`}
        </ThemedText>
        <StepperButton
          label="+"
          tint={tint}
          disabled={!canIncrement}
          accessibilityLabel={`Zwiększ ${ingredient.name}`}
          onPress={() => onStep("increment")}
        />
      </View>
    </View>
  );
}

type StepperButtonProps = {
  label: string;
  tint: string;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

function StepperButton({
  label,
  tint,
  disabled,
  accessibilityLabel,
  onPress,
}: StepperButtonProps) {
  return (
    <Pressable
      style={[
        styles.stepperButton,
        { borderColor: tint },
        disabled && styles.stepperButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.stepperLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  nameColumn: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
  },
  note: {
    fontSize: 12,
    marginTop: 2,
  },
  stepperColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  amount: {
    minWidth: 72,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.35,
  },
  stepperLabel: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
});
