import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import {
  RecipeIngredientRow,
  shouldStackRow,
} from "@/components/recipe-ingredient-row";
import type { RecipeDetailsIngredient } from "@/services/recipe-details-client";

jest.mock("@/hooks/use-theme-color", () => ({
  useThemeColor: () => "#888",
}));

const ing = (
  amount: number | null,
  unit: string | null,
  name = "makaron",
): RecipeDetailsIngredient => ({ name, amount, unit });

describe("shouldStackRow", () => {
  it("keeps a normal-length name inline on a phone-width screen", () => {
    // Longest real ingredient name ("oliwa z oliwek", 14 chars) on a 390px screen.
    expect(shouldStackRow("oliwa z oliwek", 390)).toBe(false);
  });

  it("stacks when a long name cannot fit beside the stepper", () => {
    expect(shouldStackRow("passata pomidorowa z bazylią i oliwą", 390)).toBe(
      true,
    );
  });

  it("stacks the same name on a very narrow screen but not on a wide one", () => {
    const name = "mleko kokosowe light";
    expect(shouldStackRow(name, 320)).toBe(true);
    expect(shouldStackRow(name, 900)).toBe(false);
  });
});

describe("RecipeIngredientRow", () => {
  const onStep = jest.fn();

  afterEach(() => {
    onStep.mockReset();
  });

  it("renders the scaled value with per-unit rounding", () => {
    render(
      <RecipeIngredientRow ingredient={ing(250, "g")} factor={1.2} onStep={onStep} />,
    );

    // 250 * 1.2 = 300, rounded to a whole number for g. Value and unit are
    // rendered as stacked nodes (number over unit), so assert them separately.
    expect(screen.getByText("300")).toBeTruthy();
    expect(screen.getByText("g")).toBeTruthy();
  });

  it("reserves the original-amount line but reveals it only when scaled", () => {
    const { rerender } = render(
      <RecipeIngredientRow ingredient={ing(250, "g")} factor={1} onStep={onStep} />,
    );

    // At the original amount the line is still rendered (so the row keeps its
    // height) but transparent and removed from the accessibility tree — hence
    // it is only found with includeHiddenElements.
    expect(screen.queryByText("oryg. 250 g")).toBeNull();
    const reserved = screen.getByText("oryg. 250 g", {
      includeHiddenElements: true,
    });
    expect(reserved.props.accessibilityElementsHidden).toBe(true);
    expect(StyleSheet.flatten(reserved.props.style)).toMatchObject({ opacity: 0 });

    // Once scaled, the same line becomes visible and announced.
    rerender(
      <RecipeIngredientRow ingredient={ing(250, "g")} factor={1.2} onStep={onStep} />,
    );
    const shown = screen.getByText("oryg. 250 g");
    expect(shown.props.accessibilityElementsHidden).toBe(false);
    expect(StyleSheet.flatten(shown.props.style).opacity).not.toBe(0);
  });

  it("fires onStep with the direction when a stepper is pressed", () => {
    render(
      <RecipeIngredientRow ingredient={ing(250, "g")} factor={1} onStep={onStep} />,
    );

    fireEvent.press(screen.getByLabelText("Zwiększ makaron"));
    expect(onStep).toHaveBeenCalledWith("increment");

    fireEvent.press(screen.getByLabelText("Zmniejsz makaron"));
    expect(onStep).toHaveBeenCalledWith("decrement");
  });

  it("disables decrement at the minimum step", () => {
    render(
      <RecipeIngredientRow ingredient={ing(10, "g")} factor={1} onStep={onStep} />,
    );

    const decrement = screen.getByLabelText("Zmniejsz makaron");
    expect(decrement.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(decrement);
    expect(onStep).not.toHaveBeenCalled();
  });

  it("renders a non-scalable ingredient without controls", () => {
    render(
      <RecipeIngredientRow
        ingredient={ing(null, null, "bazylia")}
        factor={1}
        onStep={onStep}
      />,
    );

    expect(screen.getByText("do smaku · nie skaluje się")).toBeTruthy();
    expect(screen.queryByLabelText("Zwiększ bazylia")).toBeNull();
    expect(screen.queryByLabelText("Zmniejsz bazylia")).toBeNull();
  });
});
