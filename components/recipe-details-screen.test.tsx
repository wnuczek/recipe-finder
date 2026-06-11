import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { RecipeDetailsScreen } from "@/components/recipe-details-screen";
import type { RecipeDetails } from "@/services/recipe-details-client";
import type { RecipeDetailsUiState } from "@/services/recipe-details-state";

jest.mock("@/hooks/use-theme-color", () => ({
  useThemeColor: () => "#888",
}));

const details: RecipeDetails = {
  id: "r-001",
  title: "Kurczak curry z ryżem",
  favoritesCount: 42,
  ingredients: [
    { name: "kurczak", amount: 500, unit: "g" },
    { name: "sól", amount: null, unit: null },
  ],
};

describe("RecipeDetailsScreen", () => {
  const onRetry = jest.fn();
  const onBack = jest.fn();
  const onStep = jest.fn();
  const onReset = jest.fn();

  afterEach(() => {
    onRetry.mockReset();
    onBack.mockReset();
    onStep.mockReset();
    onReset.mockReset();
  });

  it("renders quantities and a do-smaku row on success", () => {
    const state: RecipeDetailsUiState = {
      status: "success",
      snapshot: null,
      details,
      errorMessage: null,
    };

    const view = render(
      <RecipeDetailsScreen
        state={state}
        factor={1}
        onRetry={onRetry}
        onBack={onBack}
        onStep={onStep}
        onReset={onReset}
      />,
    );

    const snapshot = JSON.stringify(view.toJSON());
    expect(snapshot).toContain("Kurczak curry z ryżem");
    expect(snapshot).toContain("500");
    expect(snapshot).toContain("do smaku");
    expect(snapshot).toContain("Ulubione: ");
    expect(snapshot).toContain("42");
  });

  it("steps an ingredient and shows reset when scaled", () => {
    const state: RecipeDetailsUiState = {
      status: "success",
      snapshot: null,
      details,
      errorMessage: null,
    };

    // factor 1 → no reset button yet.
    const { rerender } = render(
      <RecipeDetailsScreen
        state={state}
        factor={1}
        onRetry={onRetry}
        onBack={onBack}
        onStep={onStep}
        onReset={onReset}
      />,
    );
    expect(screen.queryByLabelText("Przywróć oryginalne ilości")).toBeNull();

    fireEvent.press(screen.getByLabelText("Zwiększ kurczak"));
    expect(onStep).toHaveBeenCalledWith("kurczak", "increment");

    // scaled → reset button appears and fires onReset.
    rerender(
      <RecipeDetailsScreen
        state={state}
        factor={1.2}
        onRetry={onRetry}
        onBack={onBack}
        onStep={onStep}
        onReset={onReset}
      />,
    );
    fireEvent.press(screen.getByLabelText("Przywróć oryginalne ilości"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("fans one factor out to every row, each unit rounded in its own rule", () => {
    // Risk #1 at the UI: a single shared factor must recalculate EVERY scalable
    // row in its own unit family — not just the tapped one. The screen is
    // controlled (factor is a prop), so we render a heterogeneous list at one
    // non-1 factor and assert each row independently. Every expected display
    // string is hand-computed against the unit's rounding rule, never read back
    // from the scaling module.
    const heterogeneous: RecipeDetails = {
      id: "r-002",
      title: "Sałatka warstwowa",
      favoritesCount: 7,
      ingredients: [
        { name: "mąka", amount: 250, unit: "g" }, // 250 × 1.5 = 375 → whole.
        { name: "mleko", amount: 1, unit: "kg" }, // 1 × 1.5 = 1.5 → 2 dp → "1,5".
        { name: "jajka", amount: 3, unit: "szt" }, // 3 × 1.5 = 4.5 → quarter → "4,5".
        { name: "sól", amount: null, unit: null }, // non-scalable.
      ],
    };
    const state: RecipeDetailsUiState = {
      status: "success",
      snapshot: null,
      details: heterogeneous,
      errorMessage: null,
    };

    render(
      <RecipeDetailsScreen
        state={state}
        factor={1.5}
        onRetry={onRetry}
        onBack={onBack}
        onStep={onStep}
        onReset={onReset}
      />,
    );

    expect(screen.getByText("375")).toBeTruthy(); // g
    expect(screen.getByText("1,5")).toBeTruthy(); // kg, Polish comma
    expect(screen.getByText("4,5")).toBeTruthy(); // szt
    // The non-scalable row keeps its static label, unaffected by the factor.
    expect(screen.getByText("do smaku · nie skaluje się")).toBeTruthy();
  });

  it("renders the not-found state with a working back link", () => {
    const state: RecipeDetailsUiState = {
      status: "not_found",
      snapshot: null,
      details: null,
      errorMessage: null,
    };

    render(
      <RecipeDetailsScreen
        state={state}
        factor={1}
        onRetry={onRetry}
        onBack={onBack}
        onStep={onStep}
        onReset={onReset}
      />,
    );

    expect(screen.getByText("Nie znaleziono przepisu")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Wróć do wyszukiwania"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the error state and fires retry", () => {
    const state: RecipeDetailsUiState = {
      status: "error",
      snapshot: null,
      details: null,
      errorMessage: "Błąd połączenia z API. Spróbuj ponownie.",
    };

    render(
      <RecipeDetailsScreen
        state={state}
        factor={1}
        onRetry={onRetry}
        onBack={onBack}
        onStep={onStep}
        onReset={onReset}
      />,
    );

    expect(
      screen.getByText("Błąd połączenia z API. Spróbuj ponownie."),
    ).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Spróbuj ponownie"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
