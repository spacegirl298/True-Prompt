import { useRef, useState } from "react";
import { DIMENSIONS } from "../constants/dimensions.js";
import { dimensionWeights } from "../constants/weights.js";
import { analyzePrompt, generateAnswer, generateExplanations } from "../services/geminiApi.js";
import { aggregateSession } from "../utils/aggregation.js";
import {
  calculateEconomicCosts,
  calculateEnvironmentalCosts,
  getRevealedParts,
} from "../utils/costs.js";
import { isDimensionApplicable, scoreDimension } from "../utils/scoring.js";

export function useSession() {
  const [stage, setStage] = useState("home");
  const [sessionLog, setSessionLog] = useState([]);
  const [pendingEntry, setPendingEntry] = useState(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sessionTotals, setSessionTotals] = useState(null);
  const submissionId = useRef(0);

  async function submitPrompt(userPrompt) {
    const requestId = ++submissionId.current;
    setErrorMessage(null);
    setStage("thinking");

    try {
      const analysisPromise = analyzePrompt(userPrompt).then(
        (analysis) => ({ analysis }),
        (error) => ({ error })
      );
      const answer = await generateAnswer(userPrompt);
      if (requestId !== submissionId.current) return;

      if (answer.error) {
        setErrorMessage(answer.error);
        setStage("home");
        return;
      }

      const { text, usage } = answer;
      const env = calculateEnvironmentalCosts(usage.totalTokenCount);
      const econ = calculateEconomicCosts(usage.promptTokenCount, usage.candidatesTokenCount);
      const entry = {
        prompt: userPrompt,
        answer: text,
        model: answer.model,
        fromCache: { answer: !!answer.cached, analysis: false },
        tokens: usage,
        env,
        econ,
        analysisReady: false,
        revealSteps: [
          { kind: "env", title: "Environmental cost" },
          { kind: "econ", title: "Economic cost" },
        ],
      };

      setPendingEntry(entry);
      setRevealIndex(0);
      setStage("reveal");

      const analysisResult = await analysisPromise;
      if (requestId !== submissionId.current) return;
      if (analysisResult.error) throw analysisResult.error;
      const analysis = analysisResult.analysis;
      const scored = {};
      DIMENSIONS.forEach((d) => {
        scored[d.key] = scoreDimension(analysis.factors[d.key], dimensionWeights[d.key]);
      });

      const explanations =
        analysis.explanations ?? (await generateExplanations(userPrompt, scored));
      if (requestId !== submissionId.current) return;

      const readyEntry = {
        ...entry,
        fromCache: { answer: !!answer.cached, analysis: !!analysis.cached },
        analysisReady: true,
      };
      DIMENSIONS.forEach((d) => {
        readyEntry[d.key] = { ...scored[d.key], explanation: explanations[d.key] };
      });
      readyEntry.revealSteps = [
        ...entry.revealSteps,
        ...DIMENSIONS.filter((d) => isDimensionApplicable(readyEntry[d.key])).map((d) => ({
          kind: "dimension",
          key: d.key,
          title: d.label,
        })),
      ];

      setPendingEntry(readyEntry);
    } catch (err) {
      if (requestId !== submissionId.current) return;
      console.error("submitPrompt error:", err);
      setPendingEntry(null);
      setRevealIndex(0);
      setErrorMessage(
        err.userMessage ||
          "The prompt couldn't be analysed. Check your connection and API limits, then try again."
      );
      setStage("home");
    }
  }

  function continueReveal() {
    const steps = pendingEntry?.revealSteps || [];
    if (!pendingEntry?.analysisReady && revealIndex >= steps.length - 1) return;
    if (revealIndex < steps.length - 1) {
      setRevealIndex((i) => i + 1);
      return;
    }
    setSessionLog((prev) => [...prev, pendingEntry]);
    setCurrentEntry(pendingEntry);
    setPendingEntry(null);
    setStage("result");
  }

  function cancelReveal(stepIndex) {
    submissionId.current += 1;
    const cancelledAtStep = Number.isInteger(stepIndex) ? stepIndex : revealIndex;
    setSessionLog((prev) => [...prev, { ...pendingEntry, aborted: true, cancelledAtStep }]);
    setPendingEntry(null);
    setCurrentEntry(null);
    setRevealIndex(0);
    setStage("home");
  }

  function askAnother() {
    setCurrentEntry(null);
    setStage("home");
  }

  async function endSession() {
    if (sessionLog.length === 0) return;
    setStage("summarizing");

    try {
      const totals = aggregateSession(sessionLog);
      const promptsSummary = sessionLog.map((e) => e.prompt).join(" | ");

      const dimensionData = {};
      DIMENSIONS.forEach((d) => {
        dimensionData[d.key] = {
          label: totals[d.key],
          topFactorKeys: totals[`${d.key}TopFactors`],
        };
      });
      
      const explanations =
        sessionLog.length === 1
          ? Object.fromEntries(
              DIMENSIONS.filter((d) => getRevealedParts(sessionLog[0]).dim(d.key)).map((d) => [
                d.key,
                sessionLog[0][d.key]?.explanation,
              ])
            )
          : await generateExplanations(promptsSummary, dimensionData);
      setSessionTotals({ ...totals, explanations });
      setStage("summary");
    } catch (err) {
      console.error("endSession error:", err);
      setErrorMessage("The session summary couldn't be created. Please try again.");
      setStage("home");
    }
  }

  function newSession() {
    submissionId.current += 1;
    setSessionLog([]);
    setCurrentEntry(null);
    setPendingEntry(null);
    setSessionTotals(null);
    setErrorMessage(null);
    setStage("home");
  }

  const canEndSession = sessionLog.length > 0 && ["home", "result"].includes(stage);

  return {
    stage,
    sessionLog,
    pendingEntry,
    revealIndex,
    currentEntry,
    errorMessage,
    sessionTotals,
    canEndSession,
    submitPrompt,
    continueReveal,
    cancelReveal,
    askAnother,
    endSession,
    newSession,
  };
}