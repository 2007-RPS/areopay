import React, { useMemo } from "react";
import UiIcon from "./UiIcon";
import { formatInrFromUsd } from "../lib/currency";

export default function StatsWidget({
  bookings = [],
  wallet = { balance: 0, travelPoints: 0, escrowHeld: 0 },
  loyaltyStatus = "gold",
  paymentMethods = [],
  preferences = { seatType: "window", mealPreference: "vegetarian", notifyUpgrades: true },
  walletTransactions = [],
  walletFilter = "all",
  esgRoundup = 0,
  carbonHistory = [],
  settingsTheme = "dark",
  settingsLanguage = "en",
}) {
  const stats = useMemo(() => {
    const confirmed = bookings.filter((item) => item.status === "CONFIRMED").length;
    const inProgress = bookings.filter((item) => item.status === "REFUND_PROCESSING").length;
    const totalSpend = bookings.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const totalOffsets = carbonHistory.reduce((sum, item) => sum + Number(item.carbonKg || 0), 0);
    return {
      confirmed,
      inProgress,
      totalSpend,
      totalOffsets,
    };
  }, [bookings, carbonHistory]);

  return (
    <article className="glass card dashboard-card">
      <div className="dashboard-card-head">
        <h3><UiIcon name="chart" size={15} /> Travel Snapshot</h3>
      </div>

      <div className="dashboard-kpi-grid compact">
        <article className="kpi-tile">
          <p><UiIcon name="check" size={13} /> Confirmed</p>
          <strong>{stats.confirmed}</strong>
        </article>
        <article className="kpi-tile">
          <p><UiIcon name="timer" size={13} /> Processing</p>
          <strong>{stats.inProgress}</strong>
        </article>
        <article className="kpi-tile">
          <p><UiIcon name="wallet" size={13} /> Wallet</p>
          <strong>{formatInrFromUsd(wallet.balance)}</strong>
        </article>
        <article className="kpi-tile">
          <p><UiIcon name="spark" size={13} /> Lifetime Spend</p>
          <strong>{formatInrFromUsd(stats.totalSpend)}</strong>
        </article>
        <article className="kpi-tile">
          <p><UiIcon name="leaf" size={13} /> Carbon Offset</p>
          <strong>{stats.totalOffsets} kg</strong>
        </article>
      </div>

      <div className="dashboard-secondary-grid" style={{ marginTop: "12px" }}>
        <div className="dashboard-secondary-pill">
          <span>Loyalty</span>
          <strong>{String(loyaltyStatus).toUpperCase()}</strong>
        </div>
        <div className="dashboard-secondary-pill">
          <span>Cards</span>
          <strong>{paymentMethods.length}</strong>
        </div>
        <div className="dashboard-secondary-pill">
          <span>Wallet Filter</span>
          <strong>{walletFilter}</strong>
        </div>
        <div className="dashboard-secondary-pill">
          <span>Preferences</span>
          <strong>{preferences.seatType} / {preferences.mealPreference}</strong>
        </div>
        <div className="dashboard-secondary-pill">
          <span>ESG Round-Up</span>
          <strong>{formatInrFromUsd(esgRoundup)}</strong>
        </div>
        <div className="dashboard-secondary-pill">
          <span>Locale</span>
          <strong>{settingsTheme} / {settingsLanguage}</strong>
        </div>
        <div className="dashboard-secondary-pill">
          <span>Wallet Events</span>
          <strong>{walletTransactions.length}</strong>
        </div>
      </div>
    </article>
  );
}
