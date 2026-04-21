import React from "react";

export default function CorporateBadge({ inPolicy, reasons }) {
  return (
    <span className={`policy-badge ${inPolicy ? "ok" : "warn"}`} title={(reasons || []).join(", ")}>
      {inPolicy ? "In-Policy" : "Out-of-Policy"}
    </span>
  );
}
