import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UiIcon from "../components/UiIcon";
import { readStorageValue, writeStorageValue } from "../lib/browserStorage";
import { formatInrFromUsd } from "../lib/currency";

const TRIPS_FILTERS_KEY = "aero.trips.filters";

function readTripFilters() {
  const saved = readStorageValue(TRIPS_FILTERS_KEY, null);
  if (!saved || typeof saved !== "object") {
    return { statusFilter: "all", sortMode: "newest", query: "" };
  }

  return {
    statusFilter: saved.statusFilter || "all",
    sortMode: saved.sortMode || "newest",
    query: saved.query || "",
  };
}

export default function BookingHistoryPage({ bookings, sessionKey, onCancelBooking }) {
  function statusClass(status) {
    return status === "CONFIRMED" || status === "REFUNDED" ? "ok" : "warn";
  }

  const initialFilters = readTripFilters();
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter);
  const [sortMode, setSortMode] = useState(initialFilters.sortMode);
  const [query, setQuery] = useState(initialFilters.query);
  const [showFilterSummary, setShowFilterSummary] = useState(false);

  const confirmedCount = bookings.filter((item) => item.status === "CONFIRMED").length;
  const refundingCount = bookings.filter((item) => item.status === "REFUND_PROCESSING").length;
  const refundedCount = bookings.filter((item) => item.status === "REFUNDED").length;
  const activeCount = bookings.filter((item) => item.status !== "REFUNDED").length;

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...bookings]
      .filter((booking) => {
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        const haystack = [booking.routeLabel, booking.pnr, booking.travelerName, booking.status].join(" ").toLowerCase();
        const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortMode === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [bookings, query, sortMode, statusFilter]);

  const hasActiveFilters = statusFilter !== "all" || sortMode !== "newest" || query.trim().length > 0;

  useEffect(() => {
    writeStorageValue(TRIPS_FILTERS_KEY, { statusFilter, sortMode, query });
  }, [query, sortMode, statusFilter]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setShowFilterSummary(false);
    }
  }, [hasActiveFilters]);

  function clearFilters() {
    setStatusFilter("all");
    setSortMode("newest");
    setQuery("");
    setShowFilterSummary(false);
  }

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>My Trips</h2>
          <p>Track confirmations, reschedules, and cancellations from one dashboard.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      {!!bookings.length && (
        <section className="dashboard-kpi-grid">
          <article className="glass card kpi-tile">
            <p><UiIcon name="check" size={14} /> Confirmed</p>
            <strong>{confirmedCount}</strong>
          </article>
          <article className="glass card kpi-tile">
            <p><UiIcon name="timer" size={14} /> Refund Processing</p>
            <strong>{refundingCount}</strong>
          </article>
          <article className="glass card kpi-tile">
            <p><UiIcon name="wallet" size={14} /> Refunded</p>
            <strong>{refundedCount}</strong>
          </article>
          <article className="glass card kpi-tile">
            <p><UiIcon name="portfolio" size={14} /> Active Trips</p>
            <strong>{activeCount}</strong>
          </article>
        </section>
      )}

      {!bookings.length && (
        <section className="glass card empty-state-card empty-trip-state">
          <h3>No Bookings Yet</h3>
          <p>Complete a checkout flow to create your first confirmed itinerary.</p>
          <div className="btn-row">
            <Link className="btn secondary" to="/search"><UiIcon name="search" size={14} /> Start New Search</Link>
          </div>
        </section>
      )}

      {!!bookings.length && (
        <section className="glass card section-block trip-toolbar">
          <div className="section-header">
            <h3><UiIcon name="search" size={15} /> Filter Trips</h3>
            <div className="chip-row">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="policy-badge warn filter-summary-trigger"
                  onClick={() => setShowFilterSummary((value) => !value)}
                  aria-expanded={showFilterSummary}
                  aria-controls="trip-filter-summary"
                >
                  Saved filters active
                </button>
              )}
              <span className="policy-badge ok">{rows.length} shown</span>
              <button type="button" className="btn secondary small" onClick={clearFilters} aria-label="Clear trip filters">
                Clear Filters
              </button>
            </div>
          </div>
          {hasActiveFilters && showFilterSummary && (
            <div id="trip-filter-summary" className="filter-summary-popover" role="status" aria-live="polite">
              <p><strong>Status:</strong> {statusFilter}</p>
              <p><strong>Sort:</strong> {sortMode}</p>
              <p><strong>Query:</strong> {query.trim() || "(none)"}</p>
            </div>
          )}
          <div className="trip-filter-grid">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search route, PNR, traveler, status"
              aria-label="Search trips"
            />
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REFUND_PROCESSING">Refund processing</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select className="input" value={sortMode} onChange={(e) => setSortMode(e.target.value)} aria-label="Sort trips">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </section>
      )}

      <section className="stack">
        {rows.map((booking) => (
          <article className="glass card trip-card" key={booking.id}>
            {(() => {
              const paymentAttempts = booking.paymentMeta?.attempts || [];
              const latestAttempt = paymentAttempts[paymentAttempts.length - 1] || null;
              return (
                <>
                  <div className="trip-card-head">
                    <h3>{booking.routeLabel}</h3>
                    <span className={`policy-badge ${statusClass(booking.status)}`}>{booking.status}</span>
                  </div>
                  <p>PNR: {booking.pnr}</p>
                  <p>Traveler: {booking.travelerName}</p>
                  <p>Seat: {booking.seatLabel}</p>
                  <p>Total: {formatInrFromUsd(booking.total)}</p>
                  <p>Booked: {new Date(booking.createdAt).toLocaleString()}</p>
                  {booking.paymentMeta && (
                    <div className="chip-row">
                      <span className="policy-badge ok">Split: {booking.paymentMeta.splitStrategy}</span>
                      <span className="policy-badge ok">Priority: {booking.paymentMeta.fundingPriority}</span>
                      <span className={`policy-badge ${booking.paymentMeta.autoRetry ? "ok" : "warn"}`}>{booking.paymentMeta.autoRetry ? "Auto-retry on" : "Auto-retry off"}</span>
                    </div>
                  )}
                  {latestAttempt && (
                    <p className="trip-payment-attempt">Last Payment Attempt: {latestAttempt.status} at {new Date(latestAttempt.at).toLocaleTimeString()}</p>
                  )}
                </>
              );
            })()}
            <div className="timeline-mini">
              {(booking.timeline || []).slice(-2).map((event) => (
                <p key={event.id}>{new Date(event.at).toLocaleTimeString()} | {event.message}</p>
              ))}
            </div>
            <div className="btn-row">
              <Link className="btn secondary" to={`/trips/${booking.id}`}><UiIcon name="portfolio" size={14} /> Open Details</Link>
              {booking.status !== "REFUNDED" && booking.status !== "REFUND_PROCESSING" && (
                <button type="button" className="btn secondary" onClick={() => onCancelBooking(booking.id)}><UiIcon name="timer" size={14} /> Cancel Booking</button>
              )}
            </div>
          </article>
        ))}

        {!!bookings.length && !rows.length && (
          <section className="glass card empty-state-card empty-trip-state">
            <h3>No Matches</h3>
            <p>Try a different search term or clear the current trip filters.</p>
          </section>
        )}
      </section>
    </section>
  );
}
