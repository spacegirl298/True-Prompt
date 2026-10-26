import { ENV_CONFIG, ECON_CONFIG } from "../constants/config.js";

export function calculateEnvironmentalCosts(totalTokens) {
  const {
    baseEnergyWh,
    marginalEnergyPer1000,
    baseCarbonG,
    marginalCarbonPer1000,
    baseWaterMl,
    marginalWaterPer1000,
  } = ENV_CONFIG;

  return {
    energy: baseEnergyWh + (totalTokens / 1000) * marginalEnergyPer1000,
    carbon: baseCarbonG + (totalTokens / 1000) * marginalCarbonPer1000,
    water: baseWaterMl + (totalTokens / 1000) * marginalWaterPer1000,
  };
}

export function calculateEconomicCosts(inputTokens, outputTokens) {
  const {
    baseInputCostR,
    baseOutputCostR,
    marginalInputPer1000R,
    marginalOutputPer1000R,
  } = ECON_CONFIG;

  return (
    baseInputCostR +
    baseOutputCostR +
    (inputTokens / 1000) * marginalInputPer1000R +
    (outputTokens / 1000) * marginalOutputPer1000R
  );
}

const n3 = (n) => Number(n).toFixed(3);
const k3 = (tokens) => `${(Number(tokens) / 1000).toFixed(3)}k`;

export function explainEnvironmentalCosts(totalTokens) {
  const c = ENV_CONFIG;
  const k = k3(totalTokens);
  return {
    energy: `${n3(c.baseEnergyWh)} Wh base + ${k} tokens × ${n3(c.marginalEnergyPer1000)} Wh per 1k`,
    carbon: `${n3(c.baseCarbonG)} g base + ${k} tokens × ${n3(c.marginalCarbonPer1000)} g per 1k`,
    water: `${n3(c.baseWaterMl)} ml base + ${k} tokens × ${n3(c.marginalWaterPer1000)} ml per 1k`,
  };
}

export function explainEconomicCost(inputTokens, outputTokens) {
  const c = ECON_CONFIG;
  return (
    `R${n3(c.baseInputCostR)} + R${n3(c.baseOutputCostR)} base` +
    ` + ${k3(inputTokens)} in × R${n3(c.marginalInputPer1000R)}` +
    ` + ${k3(outputTokens)} out × R${n3(c.marginalOutputPer1000R)}`
  );
}

export function getRevealedParts(entry) {
  const steps = entry?.revealSteps || [];
  const cut = entry?.cancelledAtStep;
  const partial = !!entry?.aborted && Number.isInteger(cut) && steps.length > 0;

  if (!partial) {
    return { partial: false, env: true, econ: true, dim: () => true, seen: steps.length, total: steps.length };
  }

  const seen = steps.slice(0, cut + 1);
  return {
    partial: true,
    env: seen.some((s) => s.kind === "env"),
    econ: seen.some((s) => s.kind === "econ"),
    dim: (key) => seen.some((s) => s.kind === "dimension" && s.key === key),
    seen: seen.length,
    total: steps.length,
  };
}