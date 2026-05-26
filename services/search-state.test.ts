import { describe, expect, it } from "vitest";

import {
  applyError,
  applyLoading,
  applySuccess,
  createInitialSearchState,
  getRetryIngredients,
} from "./search-state";

describe("search state transitions", () => {
  it("moves from idle to loading", () => {
    const state = createInitialSearchState();

    const next = applyLoading(state);

    expect(next.status).toBe("loading");
    expect(next.errorMessage).toBeNull();
  });

  it("stores success results and status", () => {
    const loading = applyLoading(createInitialSearchState());

    const next = applySuccess(
      loading,
      ["ryż"],
      [
        {
          id: "r-1",
          title: "Ryż z warzywami",
          ingredients: ["ryż"],
          favoritesCount: 95,
          matchCount: 1,
          matchPercent: 100,
          rank: 1,
        },
      ],
    );

    expect(next.status).toBe("success");
    expect(next.results).toHaveLength(1);
    expect(next.lastRequest).toEqual(["ryż"]);
  });

  it("moves to empty when response has no results", () => {
    const next = applySuccess(createInitialSearchState(), ["imbir"], []);

    expect(next.status).toBe("empty");
    expect(next.results).toEqual([]);
  });

  it("moves to error, clears stale results and keeps retry context", () => {
    const success = applySuccess(
      createInitialSearchState(),
      ["ryż"],
      [
        {
          id: "r-1",
          title: "Ryż z warzywami",
          ingredients: ["ryż"],
          favoritesCount: 95,
          matchCount: 1,
          matchPercent: 100,
          rank: 1,
        },
      ],
    );

    const next = applyError(success, ["ryż"], "Błąd API");

    expect(next.status).toBe("error");
    expect(next.results).toEqual([]);
    expect(next.errorMessage).toBe("Błąd API");
    expect(getRetryIngredients(next, ["pomidor"])).toEqual(["ryż"]);
  });
});
