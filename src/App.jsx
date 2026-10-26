import { useState } from "react";
import Header from "./components/Header/Header.jsx";
import ThinkingScreen from "./components/ThinkingScreen/ThinkingScreen.jsx";
import Home from "./pages/Home/Home.jsx";
import Results from "./pages/Results/Results.jsx";
import SessionSummary from "./pages/SessionSummary/SessionSummary.jsx";
import { useSession } from "./hooks/useSession.js";

function App() {
  const session = useSession();
  const { stage, sessionLog } = session;

  const [currentPrompt, setCurrentPrompt] = useState("");

  function handleSubmit(text) {
    setCurrentPrompt(text);
    session.submitPrompt(text);
  }

  const showChat = ["home", "result"].includes(stage) && sessionLog.length > 0;

  return (
    <div className="app-shell">
      {stage !== "summary" && (
        <Header
          onEndSession={session.endSession}
          endSessionEnabled={session.canEndSession}
        />
      )}

      {stage === "home" && !showChat && (
        <Home onSubmit={handleSubmit} errorMessage={session.errorMessage} />
      )}

      {showChat && (
        <Results
          log={sessionLog}
          onSubmit={handleSubmit}
          errorMessage={session.errorMessage}
        />
      )}

      {stage === "thinking" && (
        <ThinkingScreen phase="loading" log={sessionLog} prompt={currentPrompt} />
      )}

      {stage === "summarizing" && (
        <ThinkingScreen phase="loading" message="Tallying the session…" log={sessionLog} />
      )}

      {stage === "reveal" && (
        <ThinkingScreen
          phase="reveal"
          entry={session.pendingEntry}
          stepIndex={session.revealIndex}
          onContinue={session.continueReveal}
          onCancel={session.cancelReveal}
          log={sessionLog}
          prompt={session.pendingEntry?.prompt ?? currentPrompt}
        />
      )}

      {stage === "summary" && session.sessionTotals && (
        <SessionSummary
          totals={session.sessionTotals}
          log={sessionLog}
          onNewSession={session.newSession}
        />
      )}
    </div>
  );
}

export default App;