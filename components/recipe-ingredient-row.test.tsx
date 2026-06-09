import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { RecipeIngredientRow } from "@/components/recipe-ingredient-row";
import type { RecipeDetailsIngredient } from "@/services/recipe-details-client";

jest.mock("@/hooks/use-theme-color", () => ({
  useThemeColor: () => "#888",
}));

const ing = (
  amount: number | null,
  unit: string | null,
  name = "makaron",
): RecipeDetailsIngredient => ({ name, amount, unit });

describe("RecipeIngredientRow", () => {
  const onStep = jest.fn();

  afterEach(() => {
    onStep.mockReset();
  });

  it("renders the scaled value with per-unit rounding", () => {
    render(
      <RecipeIngredientRow ingredient={ing(250, "g")} factor={1.2} onStep={onStep} />,
    );

    // 250 * 1.2 = 300, rounded to a whole number for g.
    expect(screen.getByText("300 g")).toBeTruthy();
  });

  it("shows the original amount only when scaled", () => {
    const { rerender } = render(
      <RecipeIngredientRow ingredient={ing(250, "g")} factor={1} onStep={onStep} />,
    );
    expect(screen.queryByText(/oryg\./)).toBeNull();

    rerender(
      <RecipeIngredientRow ingredient={ing(250, "g")} factor={1.2} onStep={onStep} />,
    );
    expect(screen.getByText("oryg. 250 g")).toBeTruthy();
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
