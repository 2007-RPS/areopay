import React from "react";
import { formatInrFromUsd } from "../lib/currency";

export default function PaymentSplitter({ total, walletSplit, onChange, walletBalance }) {
  const cardSplit = Math.max(0, total - walletSplit);
  const walletRatio = total > 0 ? Math.round((walletSplit / total) * 100) : 0;
  return (
    <section className="glass card splitter-card">
      <div className="panel-top">
        <div>
          <h3>Multi-Source Payment</h3>
          <p>Adjust wallet vs card split with live recalculation</p>
        </div>
        <span className="policy-badge ok">{walletRatio}% wallet</span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.min(total, walletBalance)}
        step={1}
        value={walletSplit}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Wallet to card payment split"
        aria-valuemin={0}
        aria-valuemax={Math.min(total, walletBalance)}
        aria-valuenow={walletSplit}
        aria-valuetext={`Wallet ${formatInrFromUsd(walletSplit)}, Card ${formatInrFromUsd(cardSplit)}`}
      />
      <div className="split-values">
        <span>Wallet: {formatInrFromUsd(walletSplit)}</span>
        <span>Card: {formatInrFromUsd(cardSplit)}</span>
      </div>
    </section>
  );
}
