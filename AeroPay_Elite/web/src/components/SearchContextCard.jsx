import React from "react";
import UiIcon from "./UiIcon";
import { formatInrFromUsd } from "../lib/currency";

export default function SearchContextCard({ searchForm }) {
  const travelers = [
    `${Math.max(1, searchForm?.adults || 1)} adult${Math.max(1, searchForm?.adults || 1) > 1 ? "s" : ""}`,
    `${Math.max(0, searchForm?.children || 0)} child${Math.max(0, searchForm?.children || 0) === 1 ? "" : "ren"}`,
    `${Math.max(0, searchForm?.infants || 0)} infant${Math.max(0, searchForm?.infants || 0) === 1 ? "" : "s"}`,
  ].join(" | ");
  const totalTravelers = Math.max(1, searchForm?.adults || 1) + Math.max(0, searchForm?.children || 0) + Math.max(0, searchForm?.infants || 0);

  return (
    <section className="glass card search-context-card" aria-label="Search context summary">
      <div>
        <h3><UiIcon name="search" size={16} /> Active Search Context</h3>
        <p>{(searchForm?.from || "DEL")} -&gt; {(searchForm?.to || "NRT")} | {searchForm?.tripType || "round-trip"} | {searchForm?.cabin || "Business"}</p>
      </div>
      <div className="search-context-meta">
        <span className="policy-badge ok">Depart {searchForm?.departDate || "TBD"}</span>
        {searchForm?.tripType !== "one-way" ? <span className="policy-badge ok">Return {searchForm?.returnDate || "TBD"}</span> : null}
        <span className="policy-badge ok">Budget {formatInrFromUsd(searchForm?.budget || 0)}</span>
        <span className="policy-badge ok">{travelers}</span>
        <span className="policy-badge ok">Travelers {totalTravelers}</span>
      </div>
    </section>
  );
}
