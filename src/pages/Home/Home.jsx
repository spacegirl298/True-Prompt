import PromptInput from "../../components/PromptInput/PromptInput.jsx";
import "./Home.css";

function Home({ onSubmit, errorMessage }) {
  return (
    <div className="home-screen">
      <h1>Where should we start?</h1>
      <PromptInput onSubmit={onSubmit} />
      {errorMessage && (
        <p className="error-text" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default Home;