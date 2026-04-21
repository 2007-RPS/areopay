import React from "react";
import { Link } from "react-router-dom";
import UiIcon from "../components/UiIcon";
import StatsWidget from "../components/StatsWidget";
import UpcomingTripsWidget from "../components/UpcomingTripsWidget";
import BookingsSummaryTable from "../components/BookingsSummaryTable";
import ThreeDScene from "../components/ThreeDScene";
import { readStorageValue } from "../lib/browserStorage";
import { formatInrFromUsd } from "../lib/currency";

export default function DashboardPage({
  profile = { name: "", email: "" },
  bookings = [],
  wallet = { balance: 0, travelPoints: 0, escrowHeld: 0 },
  resultsCount = 0,
  sessionKey,
  reduceMotion = false,
  threeDEnabled = true,
}) {
  const firstName = profile?.name?.trim()?.split(" ")[0] || "Traveler";
  const loyaltyStatus = readStorageValue("aero.profile.loyaltyStatus", "gold");
  const paymentMethods = readStorageValue("aero.profile.paymentMethods", []);
  const preferences = readStorageValue("aero.profile.preferences", {
    seatType: "window",
    mealPreference: "vegetarian",
    notifyUpgrades: true,
  });
  const walletTransactions = readStorageValue("aero.wallet.transactions", []);
  const walletFilter = readStorageValue("aero.wallet.filter", "all");
  const esgRoundup = Number(readStorageValue("aero.esg.roundup", 0) || 0);
  const carbonHistory = readStorageValue("aero.esg.carbonHistory", []);
  const settingsTheme = readStorageValue("aero.settings.theme", "dark");
  const settingsLanguage = readStorageValue("aero.settings.language", "en");

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back, {firstName}. Here is your live travel commerce snapshot.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Active offers {resultsCount}</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <StatsWidget
            bookings={bookings}
            wallet={wallet}
            loyaltyStatus={loyaltyStatus}
            paymentMethods={paymentMethods}
            preferences={preferences}
            walletTransactions={walletTransactions}
            walletFilter={walletFilter}
            esgRoundup={esgRoundup}
            carbonHistory={carbonHistory}
            settingsTheme={settingsTheme}
            settingsLanguage={settingsLanguage}
          />
          <BookingsSummaryTable bookings={bookings} />
          <div className="dashboard-quick-actions glass card dashboard-card">
            <div className="dashboard-card-head">
              <h3><UiIcon name="spark" size={15} /> Quick Actions</h3>
            </div>
            <div className="btn-row">
              <Link className="btn secondary" to="/search"><UiIcon name="search" size={14} /> Start Search</Link>
              <Link className="btn secondary" to="/portfolio"><UiIcon name="portfolio" size={14} /> Continue Checkout</Link>
              <Link className="btn secondary" to="/wallet"><UiIcon name="wallet" size={14} /> Open Wallet</Link>
            </div>
          </div>

          <article className="glass card dashboard-card">
            <div className="dashboard-card-head">
              <h3><UiIcon name="account" size={15} /> Account Snapshot</h3>
            </div>
            <div className="dashboard-kpi-grid compact">
              <article className="kpi-tile">
                <p><UiIcon name="spark" size={13} /> Loyalty</p>
                <strong>{String(loyaltyStatus).toUpperCase()}</strong>
              </article>
              <article className="kpi-tile">
                <p><UiIcon name="card" size={13} /> Payment Methods</p>
                <strong>{paymentMethods.length}</strong>
              </article>
              <article className="kpi-tile">
                <p><UiIcon name="leaf" size={13} /> ESG Round-Up</p>
                <strong>{formatInrFromUsd(esgRoundup)}</strong>
              </article>
              <article className="kpi-tile">
                <p><UiIcon name="settings" size={13} /> Locale</p>
                <strong>{settingsTheme} / {settingsLanguage}</strong>
              </article>
            </div>
            <ul className="stat-list" style={{ marginTop: "12px" }}>
              <li><UiIcon name="check" size={13} /> Preferred seat: {preferences.seatType}</li>
              <li><UiIcon name="check" size={13} /> Meal preference: {preferences.mealPreference}</li>
              <li><UiIcon name="check" size={13} /> Saved wallet transactions: {walletTransactions.length}</li>
              <li><UiIcon name="check" size={13} /> Carbon offsets tracked: {carbonHistory.length}</li>
            </ul>
          </article>
        </div>

        <aside className="dashboard-aside">
          <UpcomingTripsWidget bookings={bookings} />
          <ThreeDScene
            reduceMotion={reduceMotion}
            threeDEnabled={threeDEnabled}
            title="3D Route Orb"
            subtitle="This is the first 3D foundation component. Cabin and route maps are next."
          />
        </aside>
      </div>
    </section>
  );
}
