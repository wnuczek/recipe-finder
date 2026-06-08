import { describe, expect, it } from "vitest";

import type { RecipeDetails } from "./recipe-details-client";
import {
  applyDetailsError,
  applyDetailsLoading,
  applyDetailsNotFound,
  applyDetailsSuccess,
  createInitialDetailsState,
} from "./recipe-details-state";
import type { RankedRecipe } from "./search-client";

const snapshot: RankedRecipe = {
  id: "r-001",
  title: "Kurczak curry z ryżem",
  ingredients: ["kurczak", "ryż"],
  favoritesCount: 42,
  matchCount: 2,
  matchPercent: 100,
  rank: 1,
};

const details: RecipeDetails = {
  id: "r-001",
  title: "Kurczak curry z ryżem",
  favoritesCount: 42,
  ingredients: [{ name: "kurczak", amount: 500, unit: "g" }],
};

describe("recipe details state transitions", () => {
  it("starts in loading with the provided snapshot", () => {
    const state = createInitialDetailsState(snapshot);

    expect(state.status).toBe("loading");
    expect(state.snapshot).toEqual(snapshot);
    expect(state.details).toBeNull();
  });

  it("starts in loading with no snapshot on a deep link", () => {
    const state = createInitialDetailsState(null);

    expect(state.status).toBe("loading");
    expect(state.snapshot).toBeNull();
  });

  it("fills details on success while keeping the snapshot", () => {
    const next = applyDetailsSuccess(createInitialDetailsState(snapshot), details);

    expect(next.status).toBe("success");
    expect(next.details).toEqual(details);
    expect(next.snapshot).toEqual(snapshot);
    expect(next.errorMessage).toBeNull();
  });

  it("derives not-found and drops stale details", () => {
    const success = applyDetailsSuccess(
      createInitialDetailsState(null),
      details,
    );

    const next = applyDetailsNotFound(success);

    expect(next.status).toBe("not_found");
    expect(next.details).toBeNull();
  });

  it("stores an error message on failure", () => {
    const next = applyDetailsError(
      createInitialDetailsState(snapshot),
      "Błąd API",
    );

    expect(next.status).toBe("error");
    expect(next.errorMessage).toBe("Błąd API");
    expect(next.snapshot).toEqual(snapshot);
  });

  it("clears the error message when returning to loading", () => {
    const errored = applyDetailsError(
      createInitialDetailsState(null),
      "Błąd API",
    );

    const next = applyDetailsLoading(errored);

    expect(next.status).toBe("loading");
    expect(next.errorMessage).toBeNull();
  });
});
