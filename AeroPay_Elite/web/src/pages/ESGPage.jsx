import React, { useEffect, useState } from "react";
import ESGTracker from "../components/ESGTracker";
import UiIcon from "../components/UiIcon";
import { readStorageValue, writeStorageValue } from "../lib/browserStorage";
import { formatInrFromUsd } from "../lib/currency";

const DEFAULT_CARBON_HISTORY = [
  { date: "2026-04-15", route: "SFO → NYC", carbonKg: 245, offsetAmount: 12.5, status: "neutralized" },
  { date: "2026-03-20", route: "LAX → MIA", carbonKg: 380, offsetAmount: 19.0, status: "neutralized" },
  { date: "2026-02-10", route: "JFK → LHR", carbonKg: 520, offsetAmount: 26.0, status: "neutralized" },
  { date: "2026-01-05", route: "SFO → TYO", carbonKg: 610, offsetAmount: 30.5, status: "neutralized" },
];

export default function ESGPage({ selected, esgRoundup, setEsgRoundup, sessionKey }) {
  const [carbonHistory, setCarbonHistory] = useState(() => readStorageValue("aero.esg.carbonHistory", DEFAULT_CARBON_HISTORY));
  const [localRoundup, setLocalRoundup] = useState(() => readStorageValue("aero.esg.roundup", esgRoundup || 0));

  useEffect(() => {
    writeStorageValue("aero.esg.carbonHistory", carbonHistory);
  }, [carbonHistory]);

  useEffect(() => {
    writeStorageValue("aero.esg.roundup", localRoundup);
  }, [localRoundup]);

  useEffect(() => {
    setLocalRoundup(esgRoundup || 0);
  }, [esgRoundup]);

  const totalCarbonNeutralized = carbonHistory.reduce((sum, item) => sum + item.carbonKg, 0);
  const totalContributed = carbonHistory.reduce((sum, item) => sum + item.offsetAmount, 0);

  return selected ? (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>ESG & Sustainability</h2>
          <p>Track carbon impact and contribute to verified environmental projects.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      {/* Current Flight Impact */}
      <section className="grid two">
        <ESGTracker
          carbonKg={selected.carbonKg}
          contribution={localRoundup}
          onNeutralize={() => {
            const nextRoundup = Number((localRoundup + 8.5).toFixed(2));
            setLocalRoundup(nextRoundup);
            setEsgRoundup(nextRoundup);
            setCarbonHistory((current) => [
              {
                date: new Date().toISOString().slice(0, 10),
                route: `${selected.from || "DEL"} → ${selected.to || "NRT"}`,
                carbonKg: selected.carbonKg,
                offsetAmount: nextRoundup,
                status: "neutralized",
              },
              ...current,
            ]);
          }}
        />
        <article className="glass card">
          <h3><UiIcon name="leaf" size={16} /> Sustainability Commitment</h3>
          <p style={{ fontSize: "0.9rem", margin: "0 0 12px 0" }}>Every rupee of your round-up contribution supports verified carbon offset projects.</p>
          <ul className="stat-list">
            <li><UiIcon name="check" size={13} /> Offset projects verified by international standards</li>
            <li><UiIcon name="leaf" size={13} /> Reforestation and renewable energy initiatives</li>
            <li><UiIcon name="check" size={13} /> Transparent impact tracking and reporting</li>
            <li><UiIcon name="spark" size={13} /> Premium-cabin routes show higher carbon intensity</li>
          </ul>
        </article>
      </section>

      {/* Impact Summary */}
      <section className="dashboard-kpi-grid">
        <article className="glass card kpi-tile">
          <p><UiIcon name="leaf" size={14} /> Total Carbon Neutralized</p>
          <strong>{totalCarbonNeutralized} kg CO₂</strong>
        </article>
        <article className="glass card kpi-tile">
          <p><UiIcon name="leaf" size={14} /> Total Contributed</p>
          <strong>{formatInrFromUsd(totalContributed)}</strong>
        </article>
        <article className="glass card kpi-tile">
          <p><UiIcon name="check" size={14} /> Flights Offset</p>
          <strong>{carbonHistory.length}</strong>
        </article>
      </section>

      {/* Carbon History */}
      <section className="glass card section-block">
        <h3><UiIcon name="history" size={16} /> Offset History</h3>
        <div className="carbon-history-list">
          {carbonHistory.map((item, idx) => (
            <div key={idx} className="carbon-history-item">
              <div className="carbon-info">
                <div>
                  <p className="carbon-route">{item.route}</p>
                  <p className="carbon-date">{new Date(item.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="carbon-metrics">
                <div className="carbon-metric">
                  <span className="metric-label">CO₂</span>
                  <span className="metric-value">{item.carbonKg} kg</span>
                </div>
                <div className="carbon-metric">
                  <span className="metric-label">Offset</span>
                  <span className="metric-value">{formatInrFromUsd(item.offsetAmount)}</span>
                </div>
              </div>
              <span className="offset-badge">{item.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainability Goals */}
      <section className="glass card section-block">
        <h3><UiIcon name="target" size={16} /> Sustainability Goals</h3>
        <div className="goals-container">
          <div className="goal-item">
            <div className="goal-header">
              <p className="goal-name">Achieve Carbon Neutral Status</p>
              <span className="goal-progress">75%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "75%" }}></div>
            </div>
            <p className="goal-description">5,000 kg CO₂ offset needed - 3,750 achieved</p>
          </div>
          <div className="goal-item">
            <div className="goal-header">
              <p className="goal-name">Support Reforestation Project</p>
              <span className="goal-progress">60%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "60%" }}></div>
            </div>
            <p className="goal-description">Plant 1,000 trees - 600 planted</p>
          </div>
        </div>
      </section>
    </section>
  ) : (
    <section className="glass card" style={{ padding: "20px" }}>
      <h3><UiIcon name="leaf" size={16} /> ESG Tracker</h3>
      <p>Select a flight to calculate carbon impact and neutralize emissions.</p>
    </section>
  );
}
