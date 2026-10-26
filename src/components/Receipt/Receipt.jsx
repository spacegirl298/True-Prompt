import { DIMENSIONS } from "../../constants/dimensions.js";
import { isDimensionApplicable } from "../../utils/scoring.js";
import {
  explainEconomicCost,
  explainEnvironmentalCosts,
  getRevealedParts,
} from "../../utils/costs.js";
import "./Receipt.css";

function Receipt({ entry }) {
  const { env, econ, tokens } = entry;
  const parts = getRevealedParts(entry);
  const dimensions = DIMENSIONS.filter(
    (d) => parts.dim(d.key) && isDimensionApplicable(entry[d.key])
  );

  const envHow = explainEnvironmentalCosts(tokens.totalTokenCount);
  const econHow = explainEconomicCost(tokens.promptTokenCount, tokens.candidatesTokenCount);
  const envBasis = `${tokens.totalTokenCount} tokens`;
  const econBasis = `${tokens.promptTokenCount} in + ${tokens.candidatesTokenCount} out tokens`;

  return (
    <div className="receipt">
      <p className="eyebrow-plain">receipt</p>

      {parts.partial && (
        <p className="receipt-partial">
          Prompts cancelled. Only the costs shown up to that
          point are counted here.
        </p>
      )}

      <dl className="receipt-list">
        {entry.fromCache?.answer && (
          <div className="receipt-row">
            <dt>Source</dt>
            <dd>
              {entry.fromCache.analysis
                ? "Cached · no API requests used"
                : "Answer from cache"}
            </dd>
          </div>
        )}

        {(parts.env || parts.econ) && (
          <div className="receipt-row">
            <dt>Tokens used</dt>
            <dd>{tokens.totalTokenCount}</dd>
          </div>
        )}

        {parts.env && (
          <>
            <div className="receipt-row">
              <dt>Energy</dt>
              <dd>{env.energy.toFixed(3)} Wh</dd>
            </div>
            <div className="receipt-row">
              <dt>Carbon</dt>
              <dd>{env.carbon.toFixed(3)} g CO₂e</dd>
            </div>
            <div className="receipt-row">
              <dt>Water</dt>
              <dd>{env.water.toFixed(3)} ml</dd>
            </div>
          </>
        )}

        {parts.econ && (
          <div className="receipt-row">
            <dt>Economic cost</dt>
            <dd>R{econ.toFixed(3)}</dd>
          </div>
        )}
      </dl>

      {dimensions.length > 0 && (
        <div className="contested-list">
          {dimensions.map((d) => (
            <div className="contested-row" key={d.key}>
              <span className="contested-label">{d.label}</span>
              <p className="contested-text">{entry[d.key].explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Receipt;