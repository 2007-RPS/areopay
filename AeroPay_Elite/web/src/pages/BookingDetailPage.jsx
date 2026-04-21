import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UiIcon from "../components/UiIcon";
import { fetchRouteIntel } from "../lib/api";
import { formatInrFromUsd } from "../lib/currency";

const RouteLiveMap = lazy(() => import("../components/RouteLiveMap"));

export default function BookingDetailPage({ bookings, sessionKey, onCancelBooking, onRescheduleBooking }) {
  const { bookingId } = useParams();
  const booking = bookings.find((item) => item.id === bookingId);
  const canModify = booking && booking.status !== "REFUNDED" && booking.status !== "REFUND_PROCESSING";
  const showRefundLedger = booking && (booking.status === "REFUND_PROCESSING" || booking.status === "REFUNDED") && booking.refund;
  const paymentAttempts = booking?.paymentMeta?.attempts || [];
  const bookingAgeHours = booking ? Math.max(0, Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60))) : 0;
  const [routeIntel, setRouteIntel] = useState(null);
  const [routeIntelStatus, setRouteIntelStatus] = useState("idle");

  const routeCodes = useMemo(() => {
    if (!booking) {
      return { from: "", to: "" };
    }

    const directFrom = String(booking.from || "").toUpperCase().trim();
    const directTo = String(booking.to || "").toUpperCase().trim();
    if (directFrom && directTo) {
      return { from: directFrom, to: directTo };
    }

    const match = String(booking.routeLabel || "").toUpperCase().match(/([A-Z]{3})\s*(?:-|->|→)\s*([A-Z]{3})/);
    if (!match) {
      return { from: "", to: "" };
    }

    return { from: match[1], to: match[2] };
  }, [booking]);

  useEffect(() => {
    let cancelled = false;

    async function loadRouteIntel() {
      if (!routeCodes.from || !routeCodes.to) {
        setRouteIntel(null);
        setRouteIntelStatus("idle");
        return;
      }

      try {
        setRouteIntelStatus("loading");
        const intel = await fetchRouteIntel(routeCodes.from, routeCodes.to);
        if (cancelled) return;
        setRouteIntel(intel);
        setRouteIntelStatus("ready");
      } catch {
        if (!cancelled) {
          setRouteIntel(null);
          setRouteIntelStatus("error");
        }
      }
    }

    loadRouteIntel();
    return () => {
      cancelled = true;
    };
  }, [routeCodes.from, routeCodes.to]);

  function getRefundSlaLabel() {
    if (!booking?.refund) return "";
    if (booking.refund.stage === "COMPLETED") return "Refund Completed";

    const refundStart = (booking.timeline || []).find((event) => event.type === "REFUND_INITIATED")?.at;
    if (!refundStart) return "Refund SLA: within 24h";

    const etaMs = new Date(refundStart).getTime() + (24 * 60 * 60 * 1000) - Date.now();
    const remaining = Math.max(0, Math.floor(etaMs / 60000));
    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    return `ETA ${hours}h ${minutes}m`;
  }

  if (!booking) {
    return (
      <section className="glass card">
        <h3>Booking Not Found</h3>
        <p>The booking may have been removed from local storage.</p>
        <Link className="btn secondary" to="/trips"><UiIcon name="trips" size={14} /> Back to My Trips</Link>
      </section>
    );
  }

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>Booking Detail</h2>
          <p>Review itinerary, fares, and manage changes from this page.</p>
        </div>
        <div className="page-hero-meta">
          <span className={`policy-badge ${booking.status === "CONFIRMED" || booking.status === "REFUNDED" ? "ok" : "warn"}`}>{booking.status}</span>
          {showRefundLedger && <span className={`policy-badge ${booking.refund.stage === "COMPLETED" ? "ok" : "warn"}`}>{getRefundSlaLabel()}</span>}
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      <section className="glass card detail-grid">
        <div>
          <h3><UiIcon name="plane" size={16} /> {booking.routeLabel}</h3>
          <p>PNR: {booking.pnr}</p>
          <p>Offer ID: {booking.offerId}</p>
          <p>Carrier: {booking.carrier}</p>
          <p>Booking ID: {booking.id}</p>
        </div>
        <div>
          <h3><UiIcon name="account" size={16} /> Passenger</h3>
          <p>{booking.travelerName}</p>
          <p>{booking.travelerEmail}</p>
          <p>Seat: {booking.seatLabel}</p>
          <p>Booked {bookingAgeHours}h ago</p>
        </div>
        <div>
          <h3><UiIcon name="card" size={16} /> Fare Summary</h3>
          <p>Total Paid: {formatInrFromUsd(booking.total)}</p>
          <p>Payment ID: {booking.paymentId}</p>
          <p>Booked At: {new Date(booking.createdAt).toLocaleString()}</p>
          {booking.paymentMeta && (
            <>
              <p>Split Strategy: {booking.paymentMeta.splitStrategy}</p>
              <p>Funding Priority: {booking.paymentMeta.fundingPriority}</p>
              <p>Auto Retry: {booking.paymentMeta.autoRetry ? "Enabled" : "Disabled"}</p>
            </>
          )}
        </div>
      </section>

      <section className="glass card section-block">
        <div className="section-header">
          <h3><UiIcon name="spark" size={16} /> Trip Summary</h3>
          <span className={`policy-badge ${booking.status === "CONFIRMED" || booking.status === "REFUNDED" ? "ok" : "warn"}`}>{booking.status}</span>
        </div>
        <div className="trip-summary-grid">
          <div className="dashboard-secondary-pill">
            <span>Route</span>
            <strong>{booking.routeLabel}</strong>
          </div>
          <div className="dashboard-secondary-pill">
            <span>Passenger</span>
            <strong>{booking.travelerName}</strong>
          </div>
          <div className="dashboard-secondary-pill">
            <span>Seat</span>
            <strong>{booking.seatLabel}</strong>
          </div>
          <div className="dashboard-secondary-pill">
            <span>Payment Mode</span>
            <strong>{booking.paymentMeta?.fundingPriority || "Standard"}</strong>
          </div>
        </div>
      </section>

      {routeCodes.from && routeCodes.to && (
        <section className="glass card route-intel-card">
          <div className="panel-top">
            <div>
              <h3><UiIcon name="location" size={16} /> Live Route View</h3>
              <p>Operational route feed for {routeCodes.from} -&gt; {routeCodes.to}</p>
            </div>
            <span className="policy-badge ok">Booking-linked</span>
          </div>
          <div className="route-intel-grid">
            <div className="route-map-visual" aria-hidden="true">
              <Suspense fallback={<div className="route-map-fallback"><p>Loading live route map...</p><p>{routeCodes.from} -&gt; {routeCodes.to}</p></div>}>
                <RouteLiveMap fromCode={routeCodes.from} toCode={routeCodes.to} alternateRoutes={routeIntel?.alternates || []} />
              </Suspense>
            </div>
            <div className="route-intel-kpis">
              <p><strong>Delay risk:</strong> {routeIntel?.delayRisk?.label || (routeIntelStatus === "loading" ? "Updating" : "Unavailable")}</p>
              <p><strong>Weather:</strong> {routeIntel?.weather?.severity || (routeIntelStatus === "loading" ? "Updating" : "Unavailable")}</p>
              <p><strong>Wind:</strong> {routeIntel?.weather?.enRouteWindKts ? `${routeIntel.weather.enRouteWindKts} kts` : "-"}</p>
              {Array.isArray(routeIntel?.alternates) && routeIntel.alternates.length > 0 && (
                <div className="chip-row route-intel-chips">
                  {routeIntel.alternates.filter(Boolean).map((item, index) => (
                    <span key={item.id || `${item.label || "alt"}-${index}`} className="policy-badge warn">{item.label || "Alternate"}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {paymentAttempts.length > 0 && (
        <section className="glass card">
          <h3><UiIcon name="timer" size={16} /> Payment Attempts</h3>
          <div className="timeline-list">
            {paymentAttempts.map((attempt) => (
              <div className="timeline-item" key={`${attempt.idempotencyKey}-${attempt.at}`}>
                <strong><UiIcon name="check" size={13} /> Attempt {attempt.attempt}: {attempt.status}</strong>
                <p>{attempt.message}</p>
                <small>{new Date(attempt.at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass card">
        <h3><UiIcon name="timer" size={16} /> Booking Timeline</h3>
        <div className="timeline-list">
          {(booking.timeline || []).map((event) => (
            <div className="timeline-item" key={event.id}>
              <strong><UiIcon name="check" size={13} /> {event.type.replaceAll("_", " ")}</strong>
              <p>{event.message}</p>
              <small>{new Date(event.at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="glass card section-block">
        <h3><UiIcon name="leaf" size={16} /> Travel Impact</h3>
        <div className="trip-summary-grid">
          <div className="dashboard-secondary-pill">
            <span>Carbon</span>
            <strong>{booking.carbonKg ? `${booking.carbonKg} kg CO2e` : "Not tracked"}</strong>
          </div>
          <div className="dashboard-secondary-pill">
            <span>Reschedule</span>
            <strong>{canModify ? "Available" : "Locked"}</strong>
          </div>
          <div className="dashboard-secondary-pill">
            <span>Refund Flow</span>
            <strong>{showRefundLedger ? booking.refund.stage : "Not active"}</strong>
          </div>
        </div>
      </section>

      {showRefundLedger && (
        <section className="glass card">
          <h3>Refund Ledger</h3>
          <div className="refund-ledger">
            <p><strong>Gross Amount:</strong> {formatInrFromUsd(booking.refund.grossAmount)}</p>
            <p><strong>Cancellation Fee:</strong> {formatInrFromUsd(booking.refund.cancellationFee)}</p>
            <p><strong>Service Fee:</strong> {formatInrFromUsd(booking.refund.serviceFee)}</p>
            <p><strong>Net Refund:</strong> {formatInrFromUsd(booking.refund.netAmount)}</p>
            <p><strong>Payout Mode:</strong> {booking.refund.mode}</p>
            <p><strong>Status:</strong> {booking.refund.stage}</p>
            {booking.refund.completedAt && <p><strong>Completed At:</strong> {new Date(booking.refund.completedAt).toLocaleString()}</p>}
          </div>
        </section>
      )}

      <section className="glass card">
        <div className="btn-row">
          <Link className="btn secondary" to="/trips"><UiIcon name="trips" size={14} /> Back to My Trips</Link>
          {canModify && (
            <>
              <button type="button" className="btn secondary" onClick={() => onRescheduleBooking(booking.id)}><UiIcon name="settings" size={14} /> Request Reschedule</button>
              <button type="button" className="btn secondary" onClick={() => onCancelBooking(booking.id)}><UiIcon name="timer" size={14} /> Cancel Booking</button>
            </>
          )}
        </div>
      </section>
    </section>
  );
}
