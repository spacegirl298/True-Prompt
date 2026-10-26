export const ENV_CONFIG = {
  baseEnergyWh: 0.24,
  marginalEnergyPer1000: 0.15,
  baseCarbonG: 0.03,
  marginalCarbonPer1000: 0.01875,
  baseWaterMl: 0.26,
  marginalWaterPer1000: 0.1625,
};
//Source: Measuring the environmental impact of delivering AI at Google Scale
// Elsworth, C., Huang, K., Patterson, D., Schneider, I., Sedivy, R., Goodman, S., Townsend, B., Ranganathan, P., Dean, J., Vahdat, A., Gomes, B. and Manyika, J. (2025). Measuring the environmental impact of delivering AI at Google Scale. [online] arXiv.org. Available at:https://arxiv.org/abs/2508.15734


export const ECON_CONFIG = {
  baseInputCostR: 0.03829,
  baseOutputCostR: 0.22968,
  marginalInputPer1000R: 0.02393,
  marginalOutputPer1000R: 0.14355,
};
//Source: Gemini Developer API Pricing 
//Google (2025). Gemini Developer API Pricing. [online] Google AI for Developers. Available at: https://ai.google.dev/gemini-api/docs/pricing

export const TENSION_CURVE = { k: 6, x0: 0.3 };

export const PEAK_BLEND = 0.6;

export const TENSION_LABELS = [
  { max: 0.33, label: "Low" },
  { max: 0.66, label: "Moderate" },
  { max: Infinity, label: "High" },
];

export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Remember to check if this is the best model
export const GEMINI_MODEL = "gemini-3.5-flash";
//Calling the API key with the .env file
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;