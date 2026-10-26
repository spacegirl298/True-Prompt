import { describe, expect, test } from "vitest";
import { aggregateCachedCosts, aggregateSession } from "./aggregation.js";

function entry({ cachedAnswer = false, cachedAnalysis = false, energy, econ, tokens }) {
  return {
    fromCache: { answer: cachedAnswer, analysis: cachedAnalysis },
    env: { energy, carbon: energy, water: energy },
    econ,
    tokens: { totalTokenCount: tokens },
    revealSteps: [{ kind: "env" }, { kind: "econ" }],
  };
}

describe("session cost aggregation", () => {
  test("separates cached-answer estimates from costs sent to the AI service", () => {
    const log = [
      entry({ cachedAnswer: true, energy: 1, econ: 2, tokens: 100 }),
      entry({ energy: 3, econ: 4, tokens: 200 }),
      entry({ cachedAnalysis: true, energy: 5, econ: 6, tokens: 300 }),
    ];

    expect(aggregateSession(log)).toMatchObject({
      energy: 8,
      carbon: 8,
      water: 8,
      econ: 10,
      tokens: 500,
      promptCount: 3,
    });
    expect(aggregateCachedCosts(log)).toEqual({
      energy: 1,
      carbon: 1,
      water: 1,
      econ: 2,
      tokens: 100,
      promptCount: 1,
    });
  });

  test("excludes cached prompt costs from actual totals when only some costs were revealed", () => {
    const cached = {
      ...entry({ cachedAnswer: true, energy: 1, econ: 2, tokens: 100 }),
      aborted: true,
      cancelledAtStep: 0,
    };

    expect(aggregateSession([cached]).tokens).toBe(0);
    expect(aggregateCachedCosts([cached])).toMatchObject({
      energy: 1,
      econ: 0,
      tokens: 100,
      promptCount: 1,
    });
  });
});
