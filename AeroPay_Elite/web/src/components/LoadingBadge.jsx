import React from "react";

export default function LoadingBadge({ text = "Loading...", className = "" }) {
  return (
    <div className={`loading-badge ${className}`.trim()} role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
