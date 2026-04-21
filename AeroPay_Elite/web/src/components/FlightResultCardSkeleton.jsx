import React from "react";

export default function FlightResultCardSkeleton() {
  return (
    <article className="glass card flight-card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-line wide" />
      <div className="skeleton skeleton-line mid" />
      <div className="skeleton-grid compact">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton-grid compact">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" />
    </article>
  );
}
