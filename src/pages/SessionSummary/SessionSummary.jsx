import CostTable from "../../components/CostTable/CostTable.jsx";
import { DIMENSIONS } from "../../constants/dimensions.js";
import { aggregateCachedCosts, aggregateSession } from "../../utils/aggregation.js";
import "./SessionSummary.css";

function SessionSummary({ totals: provided, log, onNewSession }) {
  const totals = { ...aggregateSession(log), explanations: provided?.explanations };
  const cachedCosts = aggregateCachedCosts(log);
  const cancelledCount = log.filter((e) => e.aborted).length;

  return (
    <div className="screen summary-screen">
      <p className="eyebrow-plain">session totals</p>
      <h2>
        {totals.promptCount} {totals.promptCount === 1 ? "prompt" : "prompts"}
      </h2>

      <p className="summary-cost-note">
        Totals below include costs for prompts sent to the AI service; cached-answer estimates are shown separately.
      </p>

      <dl className="receipt-list">
        <div className="receipt-row">
          <dt>Tokens sent to AI service</dt>
          <dd>{totals.tokens}</dd>
        </div>
        <div className="receipt-row">
          <dt>Total energy</dt>
          <dd>{totals.energy.toFixed(3)} Wh</dd>
        </div>
        <div className="receipt-row">
          <dt>Total carbon</dt>
          <dd>{totals.carbon.toFixed(3)} g CO₂e</dd>
        </div>
        <div className="receipt-row">
          <dt>Total water</dt>
          <dd>{totals.water.toFixed(3)} ml</dd>
        </div>
        <div className="receipt-row">
          <dt>Total economic cost</dt>
          <dd>R{totals.econ.toFixed(3)}</dd>
        </div>
        {DIMENSIONS.map((d) => (
          <div className="receipt-row" key={d.key}>
            <dt>Average {d.key} tension</dt>
            <dd>
              {totals[d.key]}
              {totals[`${d.key}Count`] > 0 &&
                ` · ${totals[`${d.key}Count`]} of ${totals.promptCount} prompts`}
            </dd>
          </div>
        ))}
      </dl>

      {cachedCosts.promptCount > 0 && (
        <section className="cached-costs" aria-labelledby="cached-costs-title">
          <p className="eyebrow-plain">cache estimate</p>
          <h3 id="cached-costs-title">
            Costs if {cachedCosts.promptCount === 1 ? "this prompt" : "these prompts"} had not used cache
          </h3>
          <p className="summary-cost-note">
            These are estimates based on the cached usage data. They are not included in the session
            totals because cached answers were returned without sending those requests to the AI service.
          </p>
          <dl className="receipt-list">
            <div className="receipt-row">
              <dt>Estimated tokens</dt>
              <dd>{cachedCosts.tokens}</dd>
            </div>
            <div className="receipt-row">
              <dt>Estimated energy</dt>
              <dd>{cachedCosts.energy.toFixed(3)} Wh</dd>
            </div>
            <div className="receipt-row">
              <dt>Estimated carbon</dt>
              <dd>{cachedCosts.carbon.toFixed(3)} g CO₂e</dd>
            </div>
            <div className="receipt-row">
              <dt>Estimated water</dt>
              <dd>{cachedCosts.water.toFixed(3)} ml</dd>
            </div>
            <div className="receipt-row">
              <dt>Estimated economic cost</dt>
              <dd>R{cachedCosts.econ.toFixed(3)}</dd>
            </div>
          </dl>
        </section>
      )}

      <CostTable log={log} />

      <button type="button" className="btn-primary" onClick={onNewSession}>
        Start a new session
      </button>
    </div>
  );
}

export default SessionSummary;