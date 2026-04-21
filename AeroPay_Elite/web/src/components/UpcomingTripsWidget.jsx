import React from "react";
import { Link } from "react-router-dom";
import UiIcon from "./UiIcon";

function getUpcomingTrips(bookings = []) {
  return [...bookings]
    .filter((item) => item.status !== "REFUNDED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
}

export default function UpcomingTripsWidget({ bookings = [] }) {
  const upcoming = getUpcomingTrips(bookings);

  return (
    <article className="glass card dashboard-card">
      <div className="dashboard-card-head">
        <h3><UiIcon name="trips" size={15} /> Upcoming Trips</h3>
        <Link to="/trips" className="text-link">Open all</Link>
      </div>

      {!upcoming.length && <p className="muted-copy">No active trips yet. Start with a search and complete checkout.</p>}

      {!!upcoming.length && (
        <div className="dashboard-list">
          {upcoming.map((booking) => (
            <div key={booking.id} className="dashboard-list-item">
              <div>
                <strong>{booking.routeLabel || "Route pending"}</strong>
                <p>{booking.pnr || "PNR pending"} | {booking.travelerName || "Traveler"}</p>
              </div>
              <span className="policy-badge ok">{booking.status}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
