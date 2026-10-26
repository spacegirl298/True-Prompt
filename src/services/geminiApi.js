import { DIMENSION_KEYS } from "../constants/dimensions.js";
import { GEMINI_API_BASE, GEMINI_API_KEY, GEMINI_MODEL } from "../constants/config.js";
import { dimensionFactorDefinitions } from "../constants/factorDefinitions.js";
import { getCached, setCached } from "../utils/apiCache.js";


const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const baseHasModels = /\/models\/?$/.test(GEMINI_API_BASE);

function normalizeModel(raw) {
  const clean = String(raw).trim().replace(/^["']|["']$/g, "").replace(/^models\//, "");
  if (!/^[\w.-]+$/.test(clean)) {
    console.warn(`"${raw}" isn't a valid model name; ignoring it.`);
    return null;
  }
  return baseHasModels ? clean : `models/${clean}`;
}

function parseModelList(raw) {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeModel)
    .filter(Boolean);
}

const analysisList = parseModelList(import.meta.env.VITE_GEMINI_ANALYSIS_MODEL);
const ANALYSIS_MODELS = analysisList.length ? analysisList : [GEMINI_MODEL];

const ANSWER_MODELS = [GEMINI_MODEL, ...parseModelList(import.meta.env.VITE_GEMINI_ANSWER_FALLBACKS)];

const EXHAUSTED_PREFIX = "tp-exhausted:";

function nextPacificMidnight(now = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(now));
  const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const sinceMidnight = (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000;
  return now + 24 * 3600 * 1000 - sinceMidnight;
}

function markExhausted(model) {
  try {
    localStorage.setItem(EXHAUSTED_PREFIX + model, String(nextPacificMidnight()));
  } catch {
    /* storage unavailable: just means we may retry a spent model once */
  }
}

function isExhausted(model) {
  try {
    const until = Number(localStorage.getItem(EXHAUSTED_PREFIX + model));
    if (until > Date.now()) return true;
    localStorage.removeItem(EXHAUSTED_PREFIX + model);
  } catch {
    /* ignore */
  }
  return false;
}

function resetTimeText() {
  return new Date(nextPacificMidnight()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MAX_RETRIES = 2;
const MAX_WAIT_MS = 30000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function endpoint(model) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing Gemini API key. Set VITE_GEMINI_API_KEY in a .env file at your project root."
    );
  }
  return `${GEMINI_API_BASE}/${model}:generateContent`;
}

function parseJsonResponse(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

async function readErrorInfo(res) {
  try {
    const body = await res.clone().json();
    const message = body?.error?.message || "";
    const details = body?.error?.details ?? [];
    const retry = details.find((d) => String(d["@type"]).endsWith("RetryInfo"))?.retryDelay;
    const quotaIds = details
      .filter((d) => String(d["@type"]).endsWith("QuotaFailure"))
      .flatMap((d) => (d.violations ?? []).map((v) => v.quotaId ?? ""))
      .join(" ");
    return {
      message,
      retryMs: retry ? parseFloat(retry) * 1000 : null,
      daily: /PerDay/i.test(quotaIds) || /per day|daily/i.test(message),
    };
  } catch {
    return { message: "", retryMs: null, daily: false };
  }
}

async function fetchWithRetry(url, options) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, options);
    if ((res.status !== 429 && res.status !== 503) || attempt >= MAX_RETRIES) return res;
    const info = await readErrorInfo(res);
    if (info.daily) return res;
    const wait = info.retryMs ?? 1000 * 2 ** (attempt + (res.status === 503 ? 1 : 0));
    if (wait > MAX_WAIT_MS) return res;
    await sleep(wait + Math.random() * 500);
  }
}

async function callModel(promptText, { jsonMode, model }) {
  const body = { contents: [{ role: "user", parts: [{ text: promptText }] }] };
  if (jsonMode) {
    body.generationConfig = { responseMimeType: "application/json", temperature: 0 };
  }

  const response = await fetchWithRetry(endpoint(model), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const status = response.status;
    const { message: detail, daily } = await readErrorInfo(response);
    if (status === 429) throw new Error(`${daily ? "DAILY_LIMIT" : "RATE_LIMIT"}: ${detail}`);
    if (status === 503) throw new Error(`OVERLOADED: ${detail}`);
    if (status === 400) throw new Error(`BAD_REQUEST (400): ${detail}`);
    if (status === 403) throw new Error(`FORBIDDEN (403) — check your API key: ${detail}`);
    if (status === 404) throw new Error(`NOT_FOUND (404) — check the model name: ${detail}`);
    throw new Error(`GEMINI_ERROR_${status}: ${detail}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  const usage = data?.usageMetadata ?? {};
  const promptTokens = usage.promptTokenCount ?? 0;
  const outputTokens = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);

  return {
    text,
    model,
    usage: {
      promptTokenCount: promptTokens,
      candidatesTokenCount: outputTokens,
      totalTokenCount: usage.totalTokenCount ?? promptTokens + outputTokens,
    },
  };
}

const FALL_THROUGH = ["DAILY_LIMIT", "RATE_LIMIT", "OVERLOADED", "NOT_FOUND"];

async function callGemini(promptText, { jsonMode = false, models = ANSWER_MODELS } = {}) {
  const cacheKey = `${models[0]}|${jsonMode}|${promptText}`;
  const hit = getCached(cacheKey);
  if (hit) return { ...hit, cached: true };

  let lastErr = null;
  for (const model of models) {
    if (isExhausted(model)) {
      lastErr = lastErr ?? new Error("DAILY_LIMIT: model already used up for today");
      continue;
    }
    try {
      const result = await callModel(promptText, { jsonMode, model });
      if (result.text.trim()) setCached(cacheKey, result);
      return { ...result, cached: false };
    } catch (err) {
      lastErr = err;
      if (err.message.startsWith("DAILY_LIMIT")) markExhausted(model);
      if (!FALL_THROUGH.some((code) => err.message.startsWith(code))) throw err;
      console.warn(`${model} unavailable (${err.message.split(":")[0]}); trying the next model if any.`);
    }
  }
  throw lastErr;
}

function friendlyError(err) {
  const msg = err.message || "";
  if (msg.startsWith("Missing Gemini API key")) {
    return "No API key found. Check your .env file and restart the dev server.";
  }
  if (msg.startsWith("DAILY_LIMIT")) {
    return `The free daily quota for the AI model is used up. It resets at about ${resetTimeText()} (midnight Pacific time).`;
  }
  if (msg.startsWith("RATE_LIMIT")) {
    return "Too many requests in a short time. Wait about a minute and try again.";
  }
  if (msg.startsWith("OVERLOADED")) {
    return "The AI service is busy right now (high demand on Google's side). Try again in a moment.";
  }
  if (msg.startsWith("FORBIDDEN")) {
    return "The API key was rejected. Check it's correct and has the Generative Language API enabled.";
  }
  if (msg.startsWith("NOT_FOUND")) {
    return "The model name wasn't found. It may have been retired. Check your model names.";
  }
  if (msg.startsWith("BAD_REQUEST")) {
    return "Gemini rejected the request — see the browser console for the exact reason.";
  }
  if (msg.startsWith("EMPTY_RESPONSE")) {
    return "The model returned no answer, possibly because the prompt was blocked. Try rewording it.";
  }
  if (msg.startsWith("BAD_CLASSIFICATION")) {
    return "The analysis came back incomplete. Please try again.";
  }
  if (err instanceof TypeError) {
    return "Couldn't reach the AI service. Check your internet connection and try again.";
  }
  return "Something went wrong talking to the AI service. See the browser console for details.";
}

function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}

export async function generateAnswer(prompt) {
  if (USE_MOCK) {
    await sleep(600);
    const p = Math.ceil(prompt.length / 4) + 10;
    const o = 180;
    return {
      text: `Mock answer (no API call was made) for: "${prompt}"\n\nThis text only exists so you can test the interface without using any quota.`,
      usage: { promptTokenCount: p, candidatesTokenCount: o, totalTokenCount: p + o },
      model: "mock",
      cached: false,
      error: null,
    };
  }
  try {
    const { text, usage, model, cached } = await callGemini(prompt);
    if (!text.trim()) throw new Error("EMPTY_RESPONSE");
    return { text, usage, model, cached, error: null };
  } catch (err) {
    console.error("Gemini generateAnswer error:", err);
    return {
      text: "",
      usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      model: null,
      cached: false,
      error: friendlyError(err),
    };
  }
}

function factorLabel(dimension, key) {
  const def = dimensionFactorDefinitions[dimension]?.[key] || key;
  return def.split(" (0=")[0];
}

export async function generateExplanations(userPrompt, dimensionData) {
  if (USE_MOCK) {
    await sleep(400);
    return Object.fromEntries(
      DIMENSION_KEYS.map((d) => [d, `Mock explanation for the ${d} dimension (no API call was made).`])
    );
  }

  const sections = DIMENSION_KEYS.map((dim) => {
    const { label, topFactorKeys } = dimensionData[dim];
    const names = (topFactorKeys || []).map((k) => factorLabel(dim, k));
    const factorText = names.length ? names.join(", ") : "none notable";
    return `- ${dim} (internal severity band, for your calibration ONLY — never state this word or any score: ${label.toLowerCase()}; contributing factors: ${factorText})`;
  }).join("\n");

  const instruction = `You write short, neutral, observational cost explanations for an interface that discloses the hidden costs of an AI interaction, styled like a receipt line item, not a warning label.

For EACH dimension below, write ONE sentence (max ~25 words) describing how this specific prompt engages that dimension.

Strict rules:
- NEVER use the words "low", "moderate", "high", "score", "tension", or any number.
- NEVER sound alarmed, preachy, or judgmental. Stay matter-of-fact and descriptive.
- Ground the sentence in the named contributing factor(s) when given.
- If contributing factors are "none notable", say plainly that this dimension carries little weight for this particular prompt — still without using the banned words.
- Write about "this prompt", not "you".

Dimensions:
${sections}

Original prompt:
"""${userPrompt}"""

Return ONLY a JSON object with exactly these keys: {"ethical": "...", "social": "...", "political": "...", "authorship": "..."}`;

  try {
    const { text } = await callGemini(instruction, { jsonMode: true, models: ANALYSIS_MODELS });
    const parsed = parseJsonResponse(text);
    const result = {};
    for (const d of DIMENSION_KEYS) {
      result[d] =
        typeof parsed[d] === "string" && parsed[d].trim()
          ? parsed[d].trim()
          : "No explanation was returned for this dimension.";
    }
    return result;
  } catch (err) {
    console.error("Gemini explanation error:", err);
    const msg = "The framework couldn't generate an explanation for this dimension right now.";
    return Object.fromEntries(DIMENSION_KEYS.map((d) => [d, msg]));
  }
}

export async function analyzePrompt(prompt) {
  if (USE_MOCK) {
    await sleep(500);
    return {
      factors: Object.fromEntries(
        DIMENSION_KEYS.map((dim) => [
          dim,
          Object.fromEntries(
            Object.keys(dimensionFactorDefinitions[dim] ?? {}).map((k) => [
              k,
              hashStr(dim + k + prompt) % 6,
            ])
          ),
        ])
      ),
      explanations: Object.fromEntries(
        DIMENSION_KEYS.map((d) => [d, `Mock explanation for the ${d} dimension (no API call was made).`])
      ),
      cached: false,
    };
  }

  const sections = DIMENSION_KEYS.map((dim) => {
    const list = Object.entries(dimensionFactorDefinitions[dim] ?? {})
      .map(([key, def]) => `  - "${key}": ${def}`)
      .join("\n");
    return `Dimension "${dim}":\n${list}`;
  }).join("\n\n");

  const scoreExample = Object.fromEntries(
    DIMENSION_KEYS.map((d) => [d, { [Object.keys(dimensionFactorDefinitions[d] ?? { factor: 0 })[0]]: 0 }])
  );
  const example = JSON.stringify({
    scores: scoreExample,
    explanations: Object.fromEntries(DIMENSION_KEYS.map((d) => [d, "..."])),
  });

  const instruction = `You analyse a single user prompt against the dimensions of an AI-cost framework that discloses the hidden costs of an AI interaction.

STEP 1 — SCORES. For EVERY factor in EVERY dimension below, assign an integer score from 0 to 5 based on its anchor description.

Calibration:
- 0 = the prompt does not engage this factor at all.
- 1 = a faint or indirect link.
- 2 = a clear but minor link.
- 3 = the prompt clearly and substantively engages the factor.
- 4 = strong engagement, close to the top anchor.
- 5 = matches the top anchor description.
Score what the prompt actually asks for, not worst-case misuse. Use the full range: if a prompt clearly engages a factor, score it 3 or higher rather than defaulting to 0 or 1 out of caution. Equally, score 0 for factors the prompt does not touch. Most factors will be 0 for most prompts.

${sections}

STEP 2 — EXPLANATIONS. For EACH dimension write ONE neutral, receipt-style sentence (max ~25 words) describing how this specific prompt engages that dimension, grounded in the factors you scored highest.
Strict rules for the explanations:
- NEVER use the words "low", "moderate", "high", "score", "tension", or any number.
- NEVER sound alarmed, preachy, or judgmental. Stay matter-of-fact and descriptive.
- If every factor in a dimension is near zero, say plainly that this dimension carries little weight for this particular prompt, still without the banned words.
- Write about "this prompt", not "you".

Return ONLY a JSON object shaped like this:
${example}

Prompt to analyse:
"""${prompt}"""`;

  try {
    const { text, cached } = await callGemini(instruction, { jsonMode: true, models: ANALYSIS_MODELS });
    const parsed = parseJsonResponse(text);

    const factors = {};
    for (const dim of DIMENSION_KEYS) {
      const got = parsed?.scores?.[dim];
      if (!got || typeof got !== "object") {
        throw new Error(`BAD_CLASSIFICATION: missing "${dim}"`);
      }
      factors[dim] = {};
      for (const key of Object.keys(dimensionFactorDefinitions[dim] ?? {})) {
        const v = Number(got[key]);
        factors[dim][key] = Number.isFinite(v) ? Math.min(5, Math.max(0, v)) : 0;
      }
    }

    console.log("factor scores", JSON.stringify(factors));

    const explanations = {};
    for (const dim of DIMENSION_KEYS) {
      const e = parsed?.explanations?.[dim];
      if (typeof e !== "string" || !e.trim()) return { factors, explanations: null, cached };
      explanations[dim] = e.trim();
    }
    return { factors, explanations, cached };
  } catch (err) {
    console.error("Gemini analysis error:", err);
    err.userMessage = friendlyError(err);
    throw err;
  }
}

export async function classifyAll(prompt) {
  return (await analyzePrompt(prompt)).factors;
}
export async function classifyPrompt(prompt, dimension) {
  return (await classifyAll(prompt))[dimension];
}