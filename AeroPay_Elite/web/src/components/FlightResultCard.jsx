import React from "react";
import CorporateBadge from "./CorporateBadge";
import UiIcon from "./UiIcon";
import { formatInrFromUsd } from "../lib/currency";

function Sparkline({ points }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${100 - ((p - min) / range) * 100}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="sparkline" role="img" aria-label="Price prediction trend">
      <polyline fill="none" stroke="var(--brand-cyan)" strokeWidth="4" points={coords} />
    </svg>
  );
}

export default function FlightResultCard({ flight, onSelect, onFreeze, onBnpl }) {
  const departureTime = `${String(flight.departureHour || 8).padStart(2, "0")}:00`;
  const durationText = `${Math.floor((flight.durationMin || 360) / 60)}h ${(flight.durationMin || 360) % 60}m`;
  const stopText = flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`;
  const demandTone = flight.demandIndex > 0.75 ? "High demand" : flight.demandIndex > 0.5 ? "Medium demand" : "Low demand";

  return (
    <article className="glass card flight-card">
      <div className="flight-head">
        <h3>{flight.from} {" -> "} {flight.to}</h3>
        <CorporateBadge inPolicy={flight.policy.inPolicy} reasons={flight.policy.reasons} />
      </div>
      <p className="flight-meta">{flight.carrier} | {flight.cabin}</p>
      <div className="result-meta-row">
        <span><UiIcon name="timer" size={13} /> {departureTime}</span>
        <span><UiIcon name="spark" size={13} /> {durationText}</span>
        <span><UiIcon name="map" size={13} /> {stopText}</span>
      </div>
      <div className="chip-row">
        <span className="policy-badge ok">Offer {flight.offerId}</span>
        <span className="policy-badge ok">Demand {(flight.demandIndex * 100).toFixed(0)}%</span>
        <span className="policy-badge ok">{demandTone}</span>
      </div>
      <div className="flight-figures">
        <div>
          <strong><UiIcon name="card" size={13} /> Fare</strong>
          <p>{formatInrFromUsd(flight.fare)}</p>
        </div>
        <div>
          <strong><UiIcon name="spark" size={13} /> Value Score</strong>
          <p>{flight.valueScore} / 100</p>
        </div>
        <div>
          <strong><UiIcon name="leaf" size={13} /> CO2</strong>
          <p>{flight.carbonKg} kg</p>
        </div>
      </div>
      <Sparkline points={flight.sparkline} />
      <p className="bnpl-hint">Price Freeze and Agentic BNPL available for this route</p>
      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={() => onFreeze(flight)}>Freeze Price</button>
        <button type="button" className="btn secondary" onClick={() => onBnpl(flight)}>View BNPL</button>
        <button type="button" className="btn primary" onClick={() => onSelect(flight)}>Select</button>
      </div>
    </article>
  );
}
