import { DIMENSION_KEYS } from "../constants/dimensions.js";
import { isDimensionApplicable, tensionValueToLabel } from "./scoring.js";
import { getRevealedParts } from "./costs.js";

const r3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

function summariseDimension(log, key) {
  const applicable = log.filter(
    (e) => getRevealedParts(e).dim(key) && isDimensionApplicable(e[key])
  );
  if (applicable.length === 0) return { label: "—", topFactors: [], count: 0 };

  const values = applicable.map((e) => e[key].value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const peak = Math.max(...values);
  const combined = 0.5 * mean + 0.5 * peak;

  const counts = {};
  applicable.forEach((e) =>
    (e[key].topFactorKeys || []).forEach((k) => {
      counts[k] = (counts[k] || 0) + 1;
    })
  );
  const topFactors = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return { label: tensionValueToLabel(combined), topFactors, count: applicable.length };
}

function emptyTotals() {
  const totals = { energy: 0, carbon: 0, water: 0, econ: 0, tokens: 0, promptCount: 0 };
  DIMENSION_KEYS.forEach((key) => {
    totals[key] = "—";
    totals[`${key}TopFactors`] = [];
    totals[`${key}Count`] = 0;
  });
  return totals;
}

function aggregateCosts(log, includeEntry) {
  const totals = { energy: 0, carbon: 0, water: 0, econ: 0, tokens: 0, promptCount: 0 };
  if (!log || log.length === 0) return totals;

  log.forEach((e) => {
    if (!includeEntry(e)) return;
    const parts = getRevealedParts(e);
    if (!parts.env && !parts.econ) return;

    totals.promptCount += 1;
    if (parts.env) {
      totals.energy += r3(e.env.energy);
      totals.carbon += r3(e.env.carbon);
      totals.water += r3(e.env.water);
    }
    if (parts.econ) totals.econ += r3(e.econ);
    totals.tokens += e.tokens?.totalTokenCount || 0;
  });

  return totals;
}

export function aggregateCachedCosts(log) {
  return aggregateCosts(log, (entry) => entry.fromCache?.answer === true);
}

export function aggregateSession(log) {
  const result = emptyTotals();
  if (!log || log.length === 0) return result;

  result.promptCount = log.length;
  const costs = aggregateCosts(log, (entry) => entry.fromCache?.answer !== true);
  result.energy = costs.energy;
  result.carbon = costs.carbon;
  result.water = costs.water;
  result.econ = costs.econ;
  result.tokens = costs.tokens;

  DIMENSION_KEYS.forEach((key) => {
    const { label, topFactors, count } = summariseDimension(log, key);
    result[key] = label;
    result[`${key}TopFactors`] = topFactors;
    result[`${key}Count`] = count;
  });

  return result;
}