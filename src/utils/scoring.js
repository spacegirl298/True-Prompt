import { TENSION_CURVE, TENSION_LABELS, PEAK_BLEND } from "../constants/config.js";

export function calculateRawScore(factors, weights) {
  let score = 0;
  for (const [factor, weight] of Object.entries(weights)) {
    const value = Number(factors?.[factor]);
    score += (Number.isFinite(value) ? value : 0) * weight;
  }
  return score;
}


export function calculatePeakScore(factors, weights) {
  let peak = 0;
  for (const factor of Object.keys(weights)) {
    const value = Number(factors?.[factor]);
    if (Number.isFinite(value)) peak = Math.max(peak, value);
  }
  return peak;
}

export function calculateBlendedScore(factors, weights) {
  const weighted = calculateRawScore(factors, weights);
  const peak = calculatePeakScore(factors, weights);
  return (1 - PEAK_BLEND) * weighted + PEAK_BLEND * peak;
}

export function calculateTensionValue(rawScore, k = TENSION_CURVE.k, x0 = TENSION_CURVE.x0) {
  const normalised = rawScore / 5;
  return 1 / (1 + Math.exp(-k * (normalised - x0)));
}

export function tensionValueToLabel(tensionValue) {
  const match = TENSION_LABELS.find((t) => tensionValue <= t.max);
  return match ? match.label : TENSION_LABELS[TENSION_LABELS.length - 1].label;
}

export function getTopFactors(factors, weights, n = 2) {
  return Object.entries(weights)
    .map(([key, weight]) => ({ key, contribution: (Number(factors?.[key]) || 0) * weight }))
    .filter((f) => f.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, n)
    .map((f) => f.key);
}

export function scoreDimension(factors, weights) {
  const weightedScore = calculateRawScore(factors, weights);
  const rawScore = calculateBlendedScore(factors, weights);
  const value = calculateTensionValue(rawScore);
  const label = tensionValueToLabel(value);
  const topFactorKeys = getTopFactors(factors, weights);
  return { rawScore, weightedScore, value, label, topFactorKeys };
}

export function isDimensionApplicable(scored) {
  return !!(scored && Array.isArray(scored.topFactorKeys) && scored.topFactorKeys.length > 0);
}