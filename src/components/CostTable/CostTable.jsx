import { DIMENSIONS } from "../../constants/dimensions.js";
import { isDimensionApplicable } from "../../utils/scoring.js";
import { aggregateSession } from "../../utils/aggregation.js";
import { getRevealedParts } from "../../utils/costs.js";
import "./CostTable.css";

function dimCell(entry, key) {
  const shown = getRevealedParts(entry).dim(key);
  return shown && isDimensionApplicable(entry[key]) ? entry[key].label : "—";
}

function statusText(entry, parts) {
  if (!entry.aborted) return entry.fromCache?.answer ? "Completed (cached)" : "Completed";
  return parts.partial ? `Cancelled (step ${parts.seen} of ${parts.total})` : "Cancelled";
}

function CostTable({ log }) {
  if (!log || log.length === 0) return <p className="empty-note">No prompts yet.</p>;

  const totals = aggregateSession(log);

  return (
    <div className="cost-table-wrap">
      <table className="cost-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Status</th>
            <th>Tokens</th>
            <th>Energy (Wh)</th>
            <th>Carbon (g CO₂e)</th>
            <th>Water (ml)</th>
            <th>Economic (R)</th>
            {DIMENSIONS.map((d) => (
              <th key={d.key}>{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {log.map((entry, idx) => {
            const parts = getRevealedParts(entry);
            return (
              <tr key={idx} className={entry.aborted ? "row-aborted" : ""}>
                <td>{idx + 1}</td>
                <td>{statusText(entry, parts)}</td>
                <td>{parts.env || parts.econ ? entry.tokens?.totalTokenCount ?? "—" : "—"}</td>
                <td>{parts.env ? entry.env.energy.toFixed(3) : "—"}</td>
                <td>{parts.env ? entry.env.carbon.toFixed(3) : "—"}</td>
                <td>{parts.env ? entry.env.water.toFixed(3) : "—"}</td>
                <td>{parts.econ ? entry.econ.toFixed(3) : "—"}</td>
                {DIMENSIONS.map((d) => (
                  <td key={d.key}>{dimCell(entry, d.key)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>AI-request total</td>
            <td>{totals.tokens}</td>
            <td>{totals.energy.toFixed(3)}</td>
            <td>{totals.carbon.toFixed(3)}</td>
            <td>{totals.water.toFixed(3)}</td>
            <td>{totals.econ.toFixed(3)}</td>
            {DIMENSIONS.map((d) => (
              <td key={d.key}>{totals[d.key]}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default CostTable;