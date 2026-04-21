import React from "react";
import { Link } from "react-router-dom";
import UiIcon from "./UiIcon";
import { formatInrFromUsd } from "../lib/currency";

function statusClass(status) {
  return status === "CONFIRMED" || status === "REFUNDED" ? "ok" : "warn";
}

export default function BookingsSummaryTable({ bookings = [] }) {
  const rows = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <article className="glass card dashboard-card">
      <div className="dashboard-card-head">
        <h3><UiIcon name="list" size={15} /> Recent Bookings</h3>
        <Link to="/trips" className="text-link">View history</Link>
      </div>

      {!rows.length && <p className="muted-copy">No booking records available yet.</p>}

      {!!rows.length && (
        <div className="dashboard-table-wrap" role="region" aria-label="Recent bookings summary">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>PNR</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.routeLabel || "-"}</td>
                  <td>{booking.pnr || "-"}</td>
                  <td><span className={`policy-badge ${statusClass(booking.status)}`}>{booking.status}</span></td>
                  <td>{formatInrFromUsd(booking.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
