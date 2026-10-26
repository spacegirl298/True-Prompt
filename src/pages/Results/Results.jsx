import ChatMessages from "../../components/ChatMessages/ChatMessages.jsx";
import PromptInput from "../../components/PromptInput/PromptInput.jsx";
import "./Results.css";


function Results({ log, onSubmit, errorMessage }) {
  return (
    <div className="chat-screen">
      <div className="chat-thread">
        <ChatMessages log={log} anchorLast />
      </div>
      <div className="composer-dock">
        <PromptInput onSubmit={onSubmit} placeholder="Ask another prompt" />
        {errorMessage && (
          <p className="error-text" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default Results;