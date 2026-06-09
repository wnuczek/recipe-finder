import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { IngredientSuggestionRow } from "@/components/ingredient-suggestion-row";

jest.mock("@/hooks/use-theme-color", () => ({
  useThemeColor: () => "#888",
}));

describe("IngredientSuggestionRow", () => {
  const onSelect = jest.fn();

  afterEach(() => {
    onSelect.mockReset();
  });

  it("highlights the matched segment against the accented original", () => {
    render(
      <IngredientSuggestionRow
        ingredient="papryka żółta"
        query="zolta"
        active={false}
        onSelect={onSelect}
      />,
    );

    // The matched accented segment is rendered as its own Text node.
    expect(screen.getByText("żółta")).toBeTruthy();
  });

  it("fires onSelect with the ingredient when pressed", () => {
    render(
      <IngredientSuggestionRow
        ingredient="łosoś"
        query="losos"
        active={false}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(screen.getByText("łosoś"));
    expect(onSelect).toHaveBeenCalledWith("łosoś");
  });
});
