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

  it("increments szt by its step", () => {
    expect(stepFactor(ing(2, "szt"), 1, "increment")).toBeCloseTo(1.25, 10);
  });

  it("decrements a kitchen measure by its step", () => {
    expect(stepFactor(ing(2, "łyżka"), 1, "decrement")).toBeCloseTo(0.875, 10);
  });

  it("leaves the factor untouched for non-scalable ingredients", () => {
    expect(stepFactor(ing(null, null), 1.5, "increment")).toBe(1.5);
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
});
