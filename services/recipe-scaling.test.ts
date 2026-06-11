import { describe, expect, it } from "vitest";

import type { RecipeDetailsIngredient } from "./recipe-details-client";
import {
  RESET_FACTOR,
  canStep,
  displayedAmount,
  formatAmount,
  isScalable,
  stepFactor,
} from "./recipe-scaling";

const ing = (
  amount: number | null,
  unit: string | null,
  name = "x",
): RecipeDetailsIngredient => ({ name, amount, unit });

describe("isScalable", () => {
  it("is true for a supported unit with an amount", () => {
    expect(isScalable(ing(250, "g"))).toBe(true);
  });

  it("is false for a null amount/unit pair (non-scalable)", () => {
    expect(isScalable(ing(null, null, "bazylia"))).toBe(false);
  });

  it("is false for an unsupported unit", () => {
    expect(isScalable(ing(1, "puszka"))).toBe(false);
  });
});

describe("displayedAmount rounding per unit family", () => {
  it("rounds g/ml to whole numbers", () => {
    expect(displayedAmount(ing(250, "g"), 1.04)).toBe(260);
    expect(displayedAmount(ing(250, "g"), 1.333)).toBe(333);
    expect(displayedAmount(ing(400, "ml"), 0.5)).toBe(200);
  });

  it("rounds kg/l to two decimals", () => {
    expect(displayedAmount(ing(1, "kg"), 1.5)).toBe(1.5);
    expect(displayedAmount(ing(1, "kg"), 1.333)).toBe(1.33);
    expect(displayedAmount(ing(1, "l"), 0.756)).toBe(0.76);
  });

  it("rounds szt and kitchen measures to the nearest quarter", () => {
    expect(displayedAmount(ing(2, "szt"), 1.1)).toBe(2.25);
    expect(displayedAmount(ing(2, "łyżka"), 0.6)).toBe(1.25);
    expect(displayedAmount(ing(1, "szklanka"), 1.3)).toBe(1.25);
    // łyżeczka shares the quarter rule but was never exercised before.
    expect(displayedAmount(ing(2, "łyżeczka"), 1.3)).toBe(2.5);
  });

  it("rounds down and breaks .5 ties toward +infinity (Math.round, no banker's rounding)", () => {
    // 250 × 1.009 = 252.25 → rounds down to 252.
    expect(displayedAmount(ing(250, "g"), 1.009)).toBe(252);
    // 250 × 1.01 = 252.5 → half-tie rounds up to 253.
    expect(displayedAmount(ing(250, "g"), 1.01)).toBe(253);
    // Quarter half-tie: 1 × 1.125 = 1.125 → ×4 = 4.5 → rounds up to 1.25.
    expect(displayedAmount(ing(1, "szt"), 1.125)).toBe(1.25);
  });

  it("returns the raw amount for non-scalable ingredients", () => {
    expect(displayedAmount(ing(null, null), 2)).toBe(0);
  });
});

describe("stepFactor derives a new factor from the base amount", () => {
  it("increments g by its step", () => {
    expect(stepFactor(ing(250, "g"), 1, "increment")).toBeCloseTo(1.04, 10);
  });

  it("increments kg by its step", () => {
    expect(stepFactor(ing(1, "kg"), 1, "increment")).toBeCloseTo(1.1, 10);
  });

  it("increments l by its step", () => {
    // l shares the 2-decimal family with kg but was untested here.
    // 1 l + 0.1 step → factor 1.1.
    expect(stepFactor(ing(1, "l"), 1, "increment")).toBeCloseTo(1.1, 10);
  });

  it("increments szt by its step", () => {
    expect(stepFactor(ing(2, "szt"), 1, "increment")).toBeCloseTo(1.25, 10);
  });

  it("decrements a kitchen measure by its step", () => {
    expect(stepFactor(ing(2, "łyżka"), 1, "decrement")).toBeCloseTo(0.875, 10);
  });

  it("leaves the factor untouched for non-scalable ingredients", () => {
    expect(stepFactor(ing(null, null), 1.5, "increment")).toBe(1.5);
  });

  it("leaves the factor untouched for a zero base amount (divide-by-zero guard)", () => {
    // amount === 0 short-circuits before nextAmount / amount would yield Infinity.
    expect(stepFactor(ing(0, "g"), 1.5, "increment")).toBe(1.5);
  });
});

describe("canStep", () => {
  it("allows increment for scalable ingredients", () => {
    expect(canStep(ing(10, "g"), 1, "increment")).toBe(true);
  });

  it("disables decrement when the next step would reach zero", () => {
    expect(canStep(ing(10, "g"), 1, "decrement")).toBe(false);
    expect(canStep(ing(0.5, "szt"), 1, "decrement")).toBe(false);
  });

  it("allows decrement while it stays above zero", () => {
    expect(canStep(ing(20, "g"), 1, "decrement")).toBe(true);
  });

  it("applies the same decrement boundary to the l family", () => {
    // 1 l − 0.1 step = 0.9 > 0 → allowed; 0.1 l − 0.1 = 0 → disabled.
    expect(canStep(ing(1, "l"), 1, "decrement")).toBe(true);
    expect(canStep(ing(0.1, "l"), 1, "decrement")).toBe(false);
  });

  it("never allows stepping a non-scalable ingredient", () => {
    expect(canStep(ing(null, null), 1, "increment")).toBe(false);
    expect(canStep(ing(null, null), 1, "decrement")).toBe(false);
  });
});

describe("no-drift on repeated steps", () => {
  it("returns to the original display after 10 increments then 10 decrements", () => {
    const makaron = ing(250, "g");
    let factor = RESET_FACTOR;

    for (let i = 0; i < 10; i += 1) {
      factor = stepFactor(makaron, factor, "increment");
    }
    expect(displayedAmount(makaron, factor)).toBe(350);

    for (let i = 0; i < 10; i += 1) {
      factor = stepFactor(makaron, factor, "decrement");
    }
    expect(displayedAmount(makaron, factor)).toBe(250);
  });
});

describe("a shared factor recalculates every ingredient independently", () => {
  it("applies one factor across a heterogeneous list, each unit rounded in its own rule", () => {
    // Derive ONE factor by stepping a single g ingredient: 200 → 210 → 1.05.
    // The factor is the INPUT under test; every expectation below is an
    // independent hand-computed literal, never read back from the module.
    const factor = stepFactor(ing(200, "g"), 1, "increment");
    expect(factor).toBeCloseTo(1.05, 10);

    // g: 200 × 1.05 = 210 → whole.
    expect(displayedAmount(ing(200, "g"), factor)).toBe(210);
    // kg: 1 × 1.05 = 1.05 → 2 decimals.
    expect(displayedAmount(ing(1, "kg"), factor)).toBe(1.05);
    // szt: 2 × 1.05 = 2.1 → ×4 = 8.4 → 8 → 2.0.
    expect(displayedAmount(ing(2, "szt"), factor)).toBe(2);
    // łyżka: 4 × 1.05 = 4.2 → ×4 = 16.8 → 17 → 4.25.
    expect(displayedAmount(ing(4, "łyżka"), factor)).toBe(4.25);
    // Non-scalable stays at 0 regardless of factor.
    expect(displayedAmount(ing(null, null, "sól"), factor)).toBe(0);
  });
});

describe("formatAmount uses a Polish comma separator without trailing zeros", () => {
  it("formats whole numbers without a separator", () => {
    expect(formatAmount(375)).toBe("375");
    expect(formatAmount(2)).toBe("2");
  });

  it("formats fractional values with a comma", () => {
    expect(formatAmount(1.5)).toBe("1,5");
    expect(formatAmount(0.25)).toBe("0,25");
    expect(formatAmount(1.33)).toBe("1,33");
  });

  it("preserves the sign for negative values", () => {
    expect(formatAmount(-1.5)).toBe("-1,5");
  });

  it("formats large values with the comma separator", () => {
    expect(formatAmount(12345.5)).toBe("12345,5");
  });
});

// CHARACTERIZATION TESTS — these document the engine's CURRENT behavior at its
// data-trust boundary. They do NOT assert that a guard exists or should exist.
// The engine has no `Number.isFinite` guard today (see recipe-scaling.ts:74,95);
// the open policy question (guard vs. trust upstream invariant) is recorded as a
// Phase 4 finding / lessons entry. If a future change adds a guard, these tests
// are EXPECTED to change — they pin the before-state, not desired behavior.
describe("characterizes behavior on non-finite input (no guard today)", () => {
  it("propagates NaN through displayedAmount for a NaN amount (no guard today)", () => {
    // Math.round(NaN * factor) === NaN; nothing short-circuits a non-finite amount.
    expect(Number.isNaN(displayedAmount(ing(NaN, "g"), 2))).toBe(true);
  });

  it("propagates Infinity through displayedAmount for an Infinite amount (no guard today)", () => {
    // Math.round(Infinity * 2) === Infinity.
    expect(displayedAmount(ing(Infinity, "g"), 2)).toBe(Infinity);
  });

  it("yields NaN from stepFactor on a NaN amount (no guard today)", () => {
    // amount === 0 is the ONLY divide-by-zero short-circuit; NaN !== 0, so it
    // flows through: NaN / NaN === NaN.
    expect(Number.isNaN(stepFactor(ing(NaN, "g"), 1, "increment"))).toBe(true);
  });

  it("yields NaN from stepFactor on an Infinite amount (no guard today)", () => {
    // current = Infinity, nextAmount = Infinity + 10 = Infinity, Infinity / Infinity === NaN.
    expect(Number.isNaN(stepFactor(ing(Infinity, "g"), 1, "increment"))).toBe(true);
  });

  it("propagates NaN for a mistyped (non-number) amount (no guard today)", () => {
    // RecipeDetailsIngredient.amount is typed `number | null`; a wrong-typed value
    // (e.g. a string that slipped past a contract boundary) needs a localized cast.
    // The arithmetic coerces "abc" to NaN, which then propagates unguarded.
    const mistyped = ing("abc" as unknown as number, "g");
    expect(Number.isNaN(displayedAmount(mistyped, 2))).toBe(true);
  });
});

describe("documents the unbounded increment (no ceiling today)", () => {
  it("always allows increment regardless of how large the amount already is (no ceiling today)", () => {
    // canStep returns true for increment unconditionally (recipe-scaling.ts:95-96).
    // A future increment-ceiling guard would change this — see the Phase 4 finding.
    expect(canStep(ing(1_000_000, "g"), 1000, "increment")).toBe(true);
  });

  it("grows displayedAmount without bound under a large factor (no ceiling today)", () => {
    // 1_000_000 g × 1000 = 1_000_000_000 → whole. No upper clamp.
    expect(displayedAmount(ing(1_000_000, "g"), 1000)).toBe(1_000_000_000);
  });
});
