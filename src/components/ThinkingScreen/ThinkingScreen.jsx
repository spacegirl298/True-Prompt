import ChatMessages, {
  AiMessage,
  ScrollMark,
  Sparkle,
  UserMessage,
} from "../ChatMessages/ChatMessages.jsx";
import { explainEconomicCost, explainEnvironmentalCosts } from "../../utils/costs.js";
import PromptInput from "../PromptInput/PromptInput.jsx";
import "./ThinkingScreen.css";

function EnvStep({ env, tokens }) {
  const how = explainEnvironmentalCosts(tokens.totalTokenCount);
  const basis = `${tokens.totalTokenCount} tokens`;
  return (
    <div className="reveal-grid">
      <div className="reveal-card">
        <span className="reveal-label">Energy</span>
        <span className="reveal-value">{env.energy.toFixed(3)} Wh</span>
        <span className="reveal-note">{basis} · {how.energy}</span>
      </div>
      <div className="reveal-card">
        <span className="reveal-label">Carbon</span>
        <span className="reveal-value">{env.carbon.toFixed(3)} g CO₂e</span>
        <span className="reveal-note">{basis} · {how.carbon}</span>
      </div>
      <div className="reveal-card">
        <span className="reveal-label">Water</span>
        <span className="reveal-value">{env.water.toFixed(3)} ml</span>
        <span className="reveal-note">{basis} · {how.water}</span>
      </div>
    </div>
  );
}

function EconStep({ econ, tokens }) {
  return (
    <>
      <div className="reveal-grid">
        <div className="reveal-card">
          <span className="reveal-label">Economic</span>
          <span className="reveal-value">R{econ.toFixed(3)}</span>
          <span className="reveal-note">
            {explainEconomicCost(tokens.promptTokenCount, tokens.candidatesTokenCount)}
          </span>
        </div>
      </div>
    </>
  );
}

function DimensionStep({ data }) {
  return (
    <div className="contested-list">
      <div className="contested-row">
        <p className="contested-text">{data.explanation}</p>
      </div>
    </div>
  );
}

function Typing({ message }) {
  return (
    <div className="typing" role="status" aria-live="polite">
      <Sparkle />
      {message ? <span className="typing-text">{message}</span> : <span className="visually-hidden">Working</span>}
    </div>
  );
}

function RevealCard({ entry, stepIndex, onContinue, onCancel }) {
  const steps = entry?.revealSteps || [];
  const step = steps[stepIndex];
  if (!step) return null;
  const isLastStep = stepIndex === steps.length - 1;
  const waitingForAnalysis = !entry.analysisReady && isLastStep;

  let body = null;
  if (step.kind === "env") body = <EnvStep env={entry.env} tokens={entry.tokens} />;
  else if (step.kind === "econ") body = <EconStep econ={entry.econ} tokens={entry.tokens} />;
  else if (step.kind === "dimension") body = <DimensionStep data={entry[step.key]} />;

  return (
    <>
      <h2 className="reveal-title">{step.title}</h2>
      {body}
      <div className="screen-actions">
        <button type="button" className="btn-secondary" onClick={() => onCancel(stepIndex)}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onContinue}
          disabled={waitingForAnalysis}
        >
          {waitingForAnalysis ? "Finishing analysis…" : isLastStep ? "See answer" : "Continue"}
        </button>
      </div>
    </>
  );
}

function ThinkingScreen({ phase, entry, stepIndex, onContinue, onCancel, message, log = [], prompt }) {
  return (
    <div className="chat-screen">
      <div className="chat-thread">
        <ChatMessages log={log} />
        {phase !== "reveal" && <ScrollMark dep={phase} />}
        <UserMessage text={prompt} />
        {phase === "reveal" && <ScrollMark dep={stepIndex} />}
        <AiMessage>
          {phase === "reveal" ? (
            <>
              <div className="typing" aria-hidden="true">
                <Sparkle />
              </div>
              <RevealCard
                entry={entry}
                stepIndex={stepIndex}
                onContinue={onContinue}
                onCancel={onCancel}
              />
            </>
          ) : (
            <Typing message={message} />
          )}
        </AiMessage>
      </div>
      <div className="composer-dock">
        <PromptInput onSubmit={() => {}} disabled placeholder="Waiting for the answer…" />
      </div>
    </div>
  );
}

export default ThinkingScreen;