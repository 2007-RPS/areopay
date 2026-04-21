import React, { useEffect, useState } from "react";
import WalletBalanceCard from "../components/WalletBalanceCard";
import UiIcon from "../components/UiIcon";
import { readStorageValue, writeStorageValue } from "../lib/browserStorage";
import { formatInrFromUsd } from "../lib/currency";

const DEFAULT_TRANSACTIONS = [
  { id: 1, date: "2026-04-15", type: "booking", description: "Flight booking SFO→NYC", amount: -450.0, status: "completed" },
  { id: 2, date: "2026-04-10", type: "refund", description: "Cancelled booking refund", amount: 200.0, status: "completed" },
  { id: 3, date: "2026-04-05", type: "points_redemption", description: "100 points redeemed", amount: 50.0, status: "completed" },
  { id: 4, date: "2026-03-28", type: "booking", description: "Hotel reservation", amount: -180.0, status: "completed" },
];

export default function WalletPage({ wallet, sessionKey }) {
  const [transactions, setTransactions] = useState(() => readStorageValue("aero.wallet.transactions", DEFAULT_TRANSACTIONS));
  const [filter, setFilter] = useState(() => readStorageValue("aero.wallet.filter", "all"));
  const utilizationPct = wallet.balance > 0 ? Math.min(100, Math.round((wallet.escrowHeld / Math.max(1, wallet.balance + wallet.escrowHeld)) * 100)) : 0;
  
  const filteredTransactions = filter === "all" ? transactions : transactions.filter(t => t.type === filter);

  const getTransactionIcon = (type) => {
    const icons = {
      booking: "shopping",
      refund: "undo",
      points_redemption: "spark",
      topup: "add",
    };
    return icons[type] || "wallet";
  };

  useEffect(() => {
    writeStorageValue("aero.wallet.transactions", transactions);
  }, [transactions]);

  useEffect(() => {
    writeStorageValue("aero.wallet.filter", filter);
  }, [filter]);

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>Wallet & Payments</h2>
          <p>Track balance, escrow, travel points, and transaction history.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      <section className="dashboard-kpi-grid">
        <article className="glass card kpi-tile">
          <p><UiIcon name="wallet" size={14} /> Available Balance</p>
          <strong>{formatInrFromUsd(wallet.balance)}</strong>
        </article>
        <article className="glass card kpi-tile">
          <p><UiIcon name="portfolio" size={14} /> Escrow Held</p>
          <strong>{formatInrFromUsd(wallet.escrowHeld)}</strong>
        </article>
        <article className="glass card kpi-tile">
          <p><UiIcon name="spark" size={14} /> Travel Points</p>
          <strong>{wallet.travelPoints}</strong>
        </article>
      </section>

      <section className="grid two">
        <WalletBalanceCard wallet={wallet} />
        <article className="glass card">
          <h3><UiIcon name="leaf" size={16} /> Quick Actions</h3>
          <div className="btn-row">
            <button type="button" className="btn"><UiIcon name="add" size={14} /> Add Funds</button>
            <button type="button" className="btn secondary"><UiIcon name="settings" size={14} /> Withdraw</button>
          </div>
          <hr style={{ margin: "12px 0", border: "1px solid rgba(128,151,196,0.2)" }} />
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>
            <UiIcon name="check" size={13} /> Escrow auto-releases 48h after PNR confirmation
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "6px", margin: 0 }}>
            <UiIcon name="spark" size={13} /> 1 point earned per rupee spent
          </p>
        </article>
      </section>

      <section className="glass card section-block">
        <div className="section-header">
          <h3><UiIcon name="history" size={16} /> Transaction History</h3>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input" style={{ width: "200px", padding: "6px 10px" }}>
            <option value="all">All Transactions</option>
            <option value="booking">Bookings</option>
            <option value="refund">Refunds</option>
            <option value="points_redemption">Points</option>
          </select>
        </div>
        <div className="transactions-list">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div className="transaction-icon">
                <UiIcon name={getTransactionIcon(tx.type)} size={16} />
              </div>
              <div className="transaction-info">
                <p className="transaction-desc">{tx.description}</p>
                <p className="transaction-date">{new Date(tx.date).toLocaleDateString()}</p>
              </div>
              <div className="transaction-amount" style={{ color: tx.amount >= 0 ? "var(--brand-green)" : "var(--text-primary)" }}>
                {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)}
              </div>
              <span className="transaction-status">{tx.status}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
