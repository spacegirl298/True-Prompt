//layout for the chat messages
import { Fragment, useEffect, useRef } from "react";
import Receipt from "../Receipt/Receipt.jsx";
import "./ChatMessages.css";

export function UserMessage({ text }) {
  if (!text) return null;
  return (
    <div className="msg msg-user">
      <p className="bubble">{text}</p>
    </div>
  );
}

export function AiMessage({ children }) {
  return (
    <div className="msg msg-ai">
      <div className="msg-body">{children}</div>
    </div>
  );
}

//thinking icon 
export function Sparkle() {
  return (
    <svg className="sparkle" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <defs>
        <linearGradient id="sparkle-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--flag)" }} />
          <stop offset="1" style={{ stopColor: "var(--flag-strong)" }} />
        </linearGradient>
      </defs>
      <path
        d="M12 2c.6 5.6 4.4 9.4 10 10-5.6.6-9.4 4.4-10 10-.6-5.6-4.4-9.4-10-10 5.6-.6 9.4-4.4 10-10z"
        fill="url(#sparkle-grad)"
      />
    </svg>
  );
}

export function ScrollMark({ dep }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [dep]);
  return <div ref={ref} className="scroll-mark" aria-hidden="true" />;
}

function ChatMessages({ log, anchorLast = false }) {
  return log.map((entry, i) => (
    <Fragment key={i}>
      {anchorLast && i === log.length - 1 && <ScrollMark dep={log.length} />}
      <UserMessage text={entry.prompt} />
      <AiMessage>
        {entry.aborted ? (
          <p className="msg-note">
           The prompt was cancelled before the answer was shown. Only the costs shown up to that point are counted in the receipt below.
          </p>
        ) : (
          <p className="answer-text">{entry.answer}</p>
        )}
        <details className="receipt-toggle" open={i === log.length - 1 && !entry.aborted}>
          <summary>Cost receipt</summary>
          <Receipt entry={entry} />
        </details>
      </AiMessage>
    </Fragment>
  ));
}

export default ChatMessages;