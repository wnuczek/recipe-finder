import { render, screen } from "@testing-library/react-native";
import React from "react";

import { SearchResultsSection } from "@/components/search-results-section";
import type { RankedRecipe } from "@/services/search-client";

jest.mock("@/hooks/use-theme-color", () => ({
  useThemeColor: () => "#888",
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("SearchResultsSection", () => {
  const onRetry = jest.fn();

  afterEach(() => {
    onRetry.mockReset();
  });

  it("renders empty-state message for empty search", () => {
    render(
      <SearchResultsSection
        status="empty"
        results={[]}
        errorMessage={null}
        onRetry={onRetry}
      />,
    );

    expect(
      screen.getByText("Brak pasujących przepisów dla wybranych składników."),
    ).toBeTruthy();
  });

  it("renders error-state fallback message", () => {
    render(
      <SearchResultsSection
        status="error"
        results={[]}
        errorMessage={null}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Wystąpił błąd wyszukiwania.")).toBeTruthy();
    expect(screen.getByText("Spróbuj ponownie")).toBeTruthy();
  });

  it("renders result cards for success state", () => {
    const results: RankedRecipe[] = [
      {
        id: "r1",
        title: "Sałatka",
        ingredients: ["pomidor"],
        favoritesCount: 4,
        matchCount: 1,
        matchPercent: 100,
        rank: 1,
      },
    ];

    const view = render(
      <SearchResultsSection
        status="success"
        results={results}
        errorMessage={null}
        onRetry={onRetry}
      />,
    );

    const snapshot = JSON.stringify(view.toJSON());
    expect(snapshot).toContain("Sałatka");
    expect(snapshot).toContain("100");
  });
});
