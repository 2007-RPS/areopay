import React from "react";
import UiIcon from "./UiIcon";
import { formatInrFromUsd } from "../lib/currency";

export default function ESGTracker({ carbonKg, contribution, onNeutralize }) {
  const pct = Math.min(100, Math.round((carbonKg / 1000) * 100));
  const neutralized = Number(contribution || 0).toFixed(2);
  return (
    <section className="glass card esg-card">
      <div className="panel-top">
        <div>
          <h3>ESG Impact</h3>
          <p><UiIcon name="leaf" size={13} /> Carbon Cost: {carbonKg} kg CO2e</p>
        </div>
        <span className="policy-badge ok">{pct}% load</span>
      </div>
      <div className="meter-track meter-track-lg" aria-hidden="true">
        <div className="meter-fill meter-fill-glow" style={{ width: `${pct}%` }} />
      </div>
      <div className="esg-stats">
        <div>
          <strong><UiIcon name="leaf" size={13} /> Neutralization Round-Up</strong>
          <p>{formatInrFromUsd(contribution)}</p>
        </div>
        <div>
          <strong><UiIcon name="check" size={13} /> Travel ESG Action</strong>
          <p>Certified green project routing</p>
        </div>
      </div>
      <button type="button" className="btn primary" onClick={onNeutralize}><UiIcon name="leaf" size={14} /> Carbon Neutralize</button>
    </section>
  );
}
