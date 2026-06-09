import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

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

// Width (px) consumed beside the name in the inline layout: list content padding
// (~40) + row padding (24) + row gap (12) + stepper block (− + qty + +, ~156).
const INLINE_NAME_CHROME_PX = 232;
// Rough advance width of one name character at fontSize 15 / weight 500.
const APPROX_CHAR_PX = 8.5;

/**
 * Decide whether a row should stack vertically (name on its own line, controls
 * below) because the name wouldn't fit beside the stepper at this window width.
 * Deterministic on purpose — avoids onLayout/onTextLayout (the latter is a no-op
 * on react-native-web) and the layout thrash of measure-then-reflow.
 */
export function shouldStackRow(name: string, windowWidth: number): boolean {
  const available = windowWidth - INLINE_NAME_CHROME_PX;
  return name.length * APPROX_CHAR_PX > available;
}

export function RecipeIngredientRow({
  ingredient,
  factor,
  onStep,
}: RecipeIngredientRowProps) {
  const { width: windowWidth } = useWindowDimensions();
  const border = useThemeColor(
    { light: "#d8e2e8", dark: "#30404a" },
    "background",
  );
  const icon = useThemeColor({}, "icon");
  const tint = useThemeColor({}, "tint");

  if (!isScalable(ingredient)) {
    return (
      <View style={[styles.row, styles.rowInline, { borderColor: border }]}>
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
  const stacked = shouldStackRow(ingredient.name, windowWidth);

  return (
    <View
      style={[
        styles.row,
        stacked ? styles.rowStacked : styles.rowInline,
        { borderColor: border },
      ]}
    >
      <View style={stacked ? undefined : styles.nameColumn}>
        <ThemedText style={styles.name}>{ingredient.name}</ThemedText>
        {/* Always rendered so the row keeps its height while scaling; the line
            is transparent and hidden from the a11y tree at the original amount. */}
        <ThemedText
          style={[styles.note, { color: icon }, factor === 1 && styles.hidden]}
          aria-hidden={factor === 1}
          accessibilityElementsHidden={factor === 1}
          importantForAccessibility={
            factor === 1 ? "no-hide-descendants" : "auto"
          }
        >
          {`oryg. ${formatAmount(original)} ${unit}`}
        </ThemedText>
      </View>

      <View
        style={[styles.stepperColumn, stacked && styles.stepperColumnStacked]}
      >
        <StepperButton
          label="−"
          tint={tint}
          disabled={!canDecrement}
          accessibilityLabel={`Zmniejsz ${ingredient.name}`}
          onPress={() => onStep("decrement")}
        />
        <View style={styles.amount}>
          <ThemedText style={styles.amountValue} numberOfLines={1}>
            {formatAmount(current)}
          </ThemedText>
          <ThemedText
            style={[styles.amountUnit, { color: icon }]}
            numberOfLines={1}
          >
            {unit}
          </ThemedText>
        </View>
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
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rowInline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rowStacked: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
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
  hidden: {
    opacity: 0,
  },
  stepperColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepperColumnStacked: {
    alignSelf: "flex-end",
  },
  amount: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  amountValue: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  amountUnit: {
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
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
