import { describe, expect, it } from "vitest";

import { foldPolish, matchIngredients, matchRange } from "./ingredient-match";

describe("foldPolish", () => {
  it("folds Polish diacritics to ASCII and lowercases", () => {
    expect(foldPolish("Łosoś")).toBe("losos");
    expect(foldPolish("papryka ŻÓŁTA")).toBe("papryka zolta");
  });

  it("preserves length so highlight indices stay aligned", () => {
    const word = "śmietana";
    expect(foldPolish(word)).toHaveLength(word.length);
  });
});

describe("matchIngredients", () => {
  const catalog = [
    "łosoś",
    "papryka żółta",
    "papryka",
    "śmietana",
    "ser",
  ];

  it("matches accent-free queries against accented ingredients", () => {
    expect(matchIngredients("losos", catalog, []).items).toEqual(["łosoś"]);
    expect(matchIngredients("zolta", catalog, []).items).toEqual([
      "papryka żółta",
    ]);
  });

  it("ranks prefix matches above mid-string matches", () => {
    // "papryka" (prefix) should lead "papryka żółta"; "ser" doesn't match.
    const { items } = matchIngredients("pa", catalog, []);
    expect(items[0]).toBe("papryka");
    expect(items).toContain("papryka żółta");
  });

  it("excludes already-selected ingredients", () => {
    const { items } = matchIngredients("papryka", catalog, ["papryka"]);
    expect(items).toEqual(["papryka żółta"]);
  });

  it("flags truncation when matches exceed the limit", () => {
    const many = ["pa1", "pa2", "pa3", "pa4"];
    expect(matchIngredients("pa", many, [], 2)).toEqual({
      items: ["pa1", "pa2"],
      truncated: true,
    });
    expect(matchIngredients("pa", many, [], 4).truncated).toBe(false);
  });

  it("returns nothing for an empty query", () => {
    expect(matchIngredients("   ", catalog, [])).toEqual({
      items: [],
      truncated: false,
    });
  });
});

describe("matchRange", () => {
  it("returns the matched range against the original accented string", () => {
    // "papryka żółta": folded match for "zolta" is at index 8..13.
    expect(matchRange("papryka żółta", "zolta")).toEqual([8, 13]);
  });

  it("returns null when there is no match or query is empty", () => {
    expect(matchRange("łosoś", "xyz")).toBeNull();
    expect(matchRange("łosoś", "  ")).toBeNull();
  });
});
