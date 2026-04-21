import React from "react";

export default function SkeletonLoader({ count = 1, className = "", itemClassName = "skeleton", ariaLabel = "Loading content" }) {
  return (
    <div className={className} role="status" aria-live="polite" aria-label={ariaLabel}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={`skeleton-${idx + 1}`} className={itemClassName} aria-hidden="true" />
      ))}
    </div>
  );
}
