import { describe, expect, test } from "vitest";
import { dimensionWeights } from "../constants/weights.js";
import {
  calculateRawScore,
  getTopFactors,
  isDimensionApplicable,
  scoreDimension,
  tensionValueToLabel,
} from "./scoring.js";

describe("dimension weights", () => {
  test.each(Object.entries(dimensionWeights))("%s weights sum to 1", (_name, weights) => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

describe("scoring", () => {
  const weights = dimensionWeights.social;

  test("all-zero factors give a raw score of 0 and no top factors", () => {
    const scored = scoreDimension({}, weights);
    expect(scored.rawScore).toBe(0);
    expect(isDimensionApplicable(scored)).toBe(false);
  });

  test("max factors give a raw score of 5", () => {
    const factors = Object.fromEntries(Object.keys(weights).map((k) => [k, 5]));
    expect(calculateRawScore(factors, weights)).toBeCloseTo(5, 5);
  });

  test("top factors are ordered by weighted contribution", () => {
    expect(getTopFactors({ parasocial: 5, judgement: 5, skillLoss: 1 }, weights)).toEqual([
      "parasocial",
      "judgement",
    ]);
  });

  test("labels map to low / moderate / high", () => {
    expect(tensionValueToLabel(0.1)).toBe("Low");
    expect(tensionValueToLabel(0.5)).toBe("Moderate");
    expect(tensionValueToLabel(0.9)).toBe("High");
  });

  test("one maxed factor is not diluted to Low", () => {
  const scored = scoreDimension({ harm: 5 }, dimensionWeights.ethical);
  expect(scored.label).toBe("High");
});
});