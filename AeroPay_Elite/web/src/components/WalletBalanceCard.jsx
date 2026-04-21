import React from "react";
import { formatInrFromUsd } from "../lib/currency";

export default function WalletBalanceCard({ wallet }) {
  return (
    <section className="glass card wallet-card">
      <h3>Wallet Snapshot</h3>
      <div className="wallet-amount">{formatInrFromUsd(wallet?.balance || 0)}</div>
      <p className="wallet-points">Travel Points: {wallet?.travelPoints || 0}</p>
      <p className="wallet-escrow">Escrow Held: {formatInrFromUsd(wallet?.escrowHeld || 0)}</p>
    </section>
  );
}
