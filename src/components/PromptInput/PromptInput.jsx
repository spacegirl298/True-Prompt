//layout for the prompt input
import { useEffect, useRef, useState } from "react";
import "./PromptInput.css";

function PromptInput({ onSubmit, disabled = false, placeholder = "Ask True Prompt" }) {
  const [input, setInput] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  function submit() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setInput("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <>
    <form className="prompt-form" onSubmit={handleSubmit}>
      <label htmlFor="prompt-input" className="visually-hidden">
        Prompt
      </label>
      <textarea
        ref={ref}
        id="prompt-input"
        name="prompt"
        rows={1}
        value={input}
        disabled={disabled}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <button
        type="submit"
        className="send-btn"
        aria-label="Send prompt"
        disabled={disabled || !input.trim()}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M12 19V5M5 12l7-7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
    <p className="composer-note">True Prompt is AI and can make mistakes. Therefore, costs are just estimates.</p>
    </>
  );
}

export default PromptInput;