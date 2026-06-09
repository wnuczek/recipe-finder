import type { RecipeDetailsIngredient } from "@/services/recipe-details-client";

export const SUPPORTED_UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "szt",
  "łyżka",
  "łyżeczka",
  "szklanka",
] as const;

export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export type StepDirection = "increment" | "decrement";

export const RESET_FACTOR = 1;

const roundWhole = (value: number) => Math.round(value);
const roundTwoDecimals = (value: number) => Math.round(value * 100) / 100;
const roundQuarter = (value: number) => Math.round(value * 4) / 4;

type UnitRule = {
  step: number;
  round: (value: number) => number;
};

export const UNIT_RULES: Record<SupportedUnit, UnitRule> = {
  g: { step: 10, round: roundWhole },
  ml: { step: 10, round: roundWhole },
  kg: { step: 0.1, round: roundTwoDecimals },
  l: { step: 0.1, round: roundTwoDecimals },
  szt: { step: 0.5, round: roundQuarter },
  łyżka: { step: 0.25, round: roundQuarter },
  łyżeczka: { step: 0.25, round: roundQuarter },
  szklanka: { step: 0.25, round: roundQuarter },
};

function ruleFor(unit: string | null): UnitRule | null {
  if (unit !== null && unit in UNIT_RULES) {
    return UNIT_RULES[unit as SupportedUnit];
  }
  return null;
}

export function isScalable(ingredient: RecipeDetailsIngredient): boolean {
  return (
    ingredient.amount !== null &&
    ingredient.unit !== null &&
    ruleFor(ingredient.unit) !== null
  );
}

export function displayedAmount(
  ingredient: RecipeDetailsIngredient,
  factor: number,
): number {
  const rule = ruleFor(ingredient.unit);
  if (ingredient.amount === null || rule === null) {
    return ingredient.amount ?? 0;
  }
  return rule.round(ingredient.amount * factor);
}

// Derive the next factor from the ingredient's BASE amount so repeated steps
// never accumulate rounding drift (see plan: no-drift factor math).
export function stepFactor(
  ingredient: RecipeDetailsIngredient,
  factor: number,
  direction: StepDirection,
): number {
  const rule = ruleFor(ingredient.unit);
  if (ingredient.amount === null || ingredient.amount === 0 || rule === null) {
    return factor;
  }

  const current = displayedAmount(ingredient, factor);
  const delta = direction === "increment" ? rule.step : -rule.step;
  const nextAmount = current + delta;

  return nextAmount / ingredient.amount;
}

export function canStep(
  ingredient: RecipeDetailsIngredient,
  factor: number,
  direction: StepDirection,
): boolean {
  const rule = ruleFor(ingredient.unit);
  if (ingredient.amount === null || rule === null) {
    return false;
  }

  if (direction === "increment") {
    return true;
  }

  // Decrement is disabled (not clamped) when it would reach zero or below.
  return displayedAmount(ingredient, factor) - rule.step > 0;
}

export function formatAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString().replace(".", ",");
}
