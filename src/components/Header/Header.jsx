import "./Header.css";

function Header({ onEndSession, endSessionEnabled }) {
  return (
    <header className="app-header">
      <p className="eyebrow-plain">True Prompt</p>
      <button
        type="button"
        className="btn-end-session"
        onClick={onEndSession}
        disabled={!endSessionEnabled}
        title={
          endSessionEnabled
            ? "End session & show totals"
            : "Nothing to end yet — ask a prompt first"
        }
      >
        End session
      </button>
    </header>
  );
}

export default Header;
