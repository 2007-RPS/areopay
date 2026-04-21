import React, { useMemo, useState } from "react";
import WalletBalanceCard from "../components/WalletBalanceCard";
import PaymentSplitter from "../components/PaymentSplitter";
import ESGTracker from "../components/ESGTracker";
import ApprovalPanel from "../components/ApprovalPanel";
import UiIcon from "../components/UiIcon";
import FormInput from "../components/FormInput";
import FormCheckbox from "../components/FormCheckbox";
import LoadingBadge from "../components/LoadingBadge";
import { isEmail, isPhone, validateBusinessDetails } from "../lib/validation";
import { formatInrFromUsd } from "../lib/currency";

const SEATS = [
  { id: "2A", price: 0, type: "Window" },
  { id: "2B", price: 15, type: "Middle" },
  { id: "2C", price: 0, type: "Aisle" },
  { id: "3A", price: 22, type: "Window+" },
  { id: "3B", price: 12, type: "Middle" },
  { id: "3C", price: 18, type: "Aisle+" },
];

const CHECKOUT_STEPS = [
  { id: 1, title: "Traveler" },
  { id: 2, title: "Seats" },
  { id: 3, title: "Protection" },
  { id: 4, title: "Payment" },
];

function getTravelerFieldErrors(traveler = {}) {
  const errors = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  };

  if (!traveler.firstName?.trim()) errors.firstName = "First name is required.";
  if (!traveler.lastName?.trim()) errors.lastName = "Last name is required.";
  if (!isEmail(traveler.email)) errors.email = "Enter a valid email address.";
  if (!isPhone(traveler.phone)) errors.phone = "Enter a valid phone number.";

  return errors;
}

function firstTravelerErrorMessage(fieldErrors) {
  return fieldErrors.firstName || fieldErrors.lastName || fieldErrors.email || fieldErrors.phone || "";
}

export default function CheckoutPage({
  selected,
  freeze,
  insurance,
  setInsurance,
  businessMode,
  setBusinessMode,
  companyName,
  setCompanyName,
  taxId,
  setTaxId,
  checkoutStep,
  setCheckoutStep,
  walletSplit,
  setWalletSplit,
  wallet,
  total,
  processing,
  lockId,
  lockRemaining,
  canPay,
  paymentResult,
  paymentFailure,
  sessionKey,
  bnpl,
  selectedBnplPlan,
  onSelectBnplPlan,
  esgRoundup,
  setEsgRoundup,
  approval,
  onRequestApproval,
  onProcessPayment,
  onRetryPayment,
  onDownloadInvoice,
  travelers,
  setTravelers,
  activeTravelerIndex,
  setActiveTravelerIndex,
  seatChoices,
  setSeatChoices,
  ancillaries,
  setAncillaries,
  bookingReady,
}) {
  const [travelerError, setTravelerError] = useState("");
  const [businessError, setBusinessError] = useState("");
  const [travelerFieldErrors, setTravelerFieldErrors] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [splitStrategy, setSplitStrategy] = useState("manual");
  const [fundingPriority, setFundingPriority] = useState("wallet-first");
  const [autoRetry, setAutoRetry] = useState(true);

  if (!selected) {
    return (
      <section className="glass card">
        <h3>No Selected Itinerary</h3>
        <p>Search and select a flight first to continue checkout.</p>
      </section>
    );
  }

  const inFinalStep = checkoutStep === 4;
  const activeTraveler = travelers[activeTravelerIndex] || travelers[0];
  const travelerComplete = travelers.every((item) => Boolean(item.firstName && item.lastName && item.email && item.phone));
  const seatsComplete = seatChoices.length === travelers.length && seatChoices.every(Boolean);
  const activeTravelerError = useMemo(() => getTravelerFieldErrors(activeTraveler || {}), [activeTraveler]);
  const smartPaymentRecommendation = useMemo(() => {
    const coverage = total > 0 ? wallet.balance / total : 0;

    if (bnpl?.approved && total >= 900) {
      return {
        strategy: "balanced",
        fundingPriority: "lowest-fee",
        reason: "BNPL is approved and fare is high; balanced split lowers immediate cash impact.",
      };
    }

    if (coverage >= 0.75) {
      return {
        strategy: "wallet-first",
        fundingPriority: "wallet-first",
        reason: "Wallet can cover most of this booking, minimizing card processing costs.",
      };
    }

    if (coverage <= 0.2) {
      return {
        strategy: "card-first",
        fundingPriority: "resilient-route",
        reason: "Wallet coverage is low, so card-first preserves wallet for ancillaries and changes.",
      };
    }

    return {
      strategy: "balanced",
      fundingPriority: "lowest-fee",
      reason: "Balanced split keeps liquidity and card utilization in a stable range.",
    };
  }, [wallet.balance, total, bnpl]);

  function updateTraveler(field, value) {
    setTravelerError("");
    setTravelerFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setTravelers((prev) => prev.map((item, index) => (
      index === activeTravelerIndex
        ? { ...item, [field]: value }
        : item
    )));
  }

  function assignSeat(seat) {
    setSeatChoices((prev) => prev.map((item, index) => (
      index === activeTravelerIndex ? seat : item
    )));
  }

  function toggleAncillary(key) {
    setAncillaries((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleWalletSplitChange(value) {
    setSplitStrategy("manual");
    setWalletSplit(value);
  }

  function applySplitPreset(strategy) {
    const maxWallet = Math.min(total, wallet.balance);
    setSplitStrategy(strategy);

    if (strategy === "wallet-first") {
      setWalletSplit(maxWallet);
      return;
    }

    if (strategy === "card-first") {
      setWalletSplit(0);
      return;
    }

    if (strategy === "balanced") {
      setWalletSplit(Number(Math.min(maxWallet, total / 2).toFixed(2)));
    }
  }

  function goNextStep() {
    if (checkoutStep === 1) {
      const fieldErrors = getTravelerFieldErrors(activeTraveler || {});
      const firstError = firstTravelerErrorMessage(fieldErrors);
      if (firstError) {
        setTravelerFieldErrors(fieldErrors);
        setTravelerError(firstError);
        return;
      }
    }
    if (checkoutStep === 2 && !seatsComplete) {
      setTravelerFieldErrors({ firstName: "", lastName: "", email: "", phone: "" });
      setTravelerError("Assign seats for all travelers before continuing.");
      return;
    }
    if (checkoutStep === 3 && businessMode) {
      const error = validateBusinessDetails(companyName, taxId);
      if (error) {
        setBusinessError(error);
        return;
      }
    }
    setTravelerFieldErrors({ firstName: "", lastName: "", email: "", phone: "" });
    setTravelerError("");
    setBusinessError("");
    setCheckoutStep((s) => Math.min(4, s + 1));
  }

  function goPreviousStep() {
    setTravelerFieldErrors({ firstName: "", lastName: "", email: "", phone: "" });
    setTravelerError("");
    setBusinessError("");
    setCheckoutStep((s) => Math.max(1, s - 1));
  }

  return (
    <section className="grid two">
      <section className="stack">
        <section className="page-hero glass card">
          <div>
            <h2>Checkout</h2>
            <p>Four-step booking flow with escrow, protection, ESG, and split payment.</p>
          </div>
          <div className="page-hero-meta">
            <span className="policy-badge ok">Local-only backend</span>
            <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
          </div>
        </section>

        <article className="glass card checkout-card">
          <h3><UiIcon name="check" size={16} /> Checkout Flow</h3>
          <p className="steps">Identity Vault -&gt; Seat Design -&gt; Protection -&gt; Multi-source Payment</p>
          <div className="checkout-stepper" role="list" aria-label="Checkout progress">
            {CHECKOUT_STEPS.map((step) => {
              const completed = checkoutStep > step.id;
              const active = checkoutStep === step.id;
              return (
                <div key={step.id} className={`checkout-step ${active ? "active" : ""} ${completed ? "done" : ""}`} role="listitem" aria-current={active ? "step" : undefined} aria-label={`Step ${step.id}: ${step.title}${completed ? " completed" : active ? " current" : ""}`}>
                  <span className="checkout-step-index">{step.id}</span>
                  <span className="checkout-step-title">{step.title}</span>
                </div>
              );
            })}
          </div>
          <div className="step-controls">
            <button type="button" className="btn secondary" disabled={checkoutStep === 1} onClick={goPreviousStep}>Back</button>
            <span>Step {checkoutStep} of 4</span>
            <button type="button" className="btn secondary" disabled={checkoutStep === 4} onClick={goNextStep}>Next</button>
          </div>

          <div className="checkout-readiness-row">
            <span className={`policy-badge ${travelerComplete ? "ok" : "warn"}`}><UiIcon name="account" size={12} /> {travelerComplete ? "Traveler details complete" : "Traveler details pending"}</span>
            <span className={`policy-badge ${seatsComplete ? "ok" : "warn"}`}><UiIcon name="portfolio" size={12} /> {seatsComplete ? "Seat assignment complete" : "Seat assignment pending"}</span>
            <span className={`policy-badge ${lockId && lockRemaining > 0 ? "ok" : "warn"}`}><UiIcon name="timer" size={12} /> {lockId && lockRemaining > 0 ? "Seat lock active" : "Seat lock required"}</span>
          </div>

          <div className="panel itinerary-panel">
            <h3>{selected.carrier} {selected.from} {" -> "} {selected.to}</h3>
            <p>Offer: {selected.offerId}</p>
            <p>Base Fare: {formatInrFromUsd(selected.fare)}</p>
            {freeze && <p>Freeze Fee (48h): {formatInrFromUsd(freeze.lockFee)}</p>}
          </div>

          {checkoutStep === 1 && (
            <section className="panel section-panel">
              <h4>Traveler Details</h4>
              <div className="chip-row">
                {travelers.map((item, index) => {
                  const completed = Boolean(item.firstName && item.lastName && item.email && item.phone);
                  return (
                    <button type="button" key={`traveler-${index + 1}`} className={`chip-btn ${activeTravelerIndex === index ? "active" : ""}`} onClick={() => { setTravelerFieldErrors({ firstName: "", lastName: "", email: "", phone: "" }); setTravelerError(""); setActiveTravelerIndex(index); }}>
                      P{index + 1} {item.type} {completed ? "- Complete" : "- Pending"}
                    </button>
                  );
                })}
              </div>
              <div className="grid two">
                <FormInput id="traveler-first-name" label="First Name" value={activeTraveler?.firstName || ""} onChange={(e) => updateTraveler("firstName", e.target.value)} error={travelerFieldErrors.firstName} />
                <FormInput id="traveler-last-name" label="Last Name" value={activeTraveler?.lastName || ""} onChange={(e) => updateTraveler("lastName", e.target.value)} error={travelerFieldErrors.lastName} />
                <FormInput id="traveler-email" label="Email" type="email" value={activeTraveler?.email || ""} onChange={(e) => updateTraveler("email", e.target.value)} error={travelerFieldErrors.email} />
                <FormInput id="traveler-phone" label="Phone" value={activeTraveler?.phone || ""} onChange={(e) => updateTraveler("phone", e.target.value)} helperText="Use country code for faster support callback." error={travelerFieldErrors.phone} />
              </div>
              {travelerError ? <p className="warn-text" role="alert" aria-live="assertive">{travelerError}</p> : null}
            </section>
          )}

          {checkoutStep === 2 && (
            <section className="panel section-panel">
              <h4>Seat &amp; Ancillaries</h4>
              <div className="chip-row">
                {travelers.map((item, index) => (
                  <button type="button" key={`seat-traveler-${index + 1}`} className={`chip-btn ${activeTravelerIndex === index ? "active" : ""}`} onClick={() => setActiveTravelerIndex(index)}>
                    P{index + 1} {item.type} {seatChoices[index]?.id ? `- Seat ${seatChoices[index].id}` : "- Select seat"}
                  </button>
                ))}
              </div>
              <div className="seat-cabin-map" aria-hidden="true">
                <div className="seat-cabin-col">
                  <span className="seat-cabin-dot" />
                  <span className="seat-cabin-dot" />
                  <span className="seat-cabin-dot" />
                </div>
                <div className="seat-cabin-aisle">Aisle</div>
                <div className="seat-cabin-col">
                  <span className="seat-cabin-dot" />
                  <span className="seat-cabin-dot" />
                  <span className="seat-cabin-dot" />
                </div>
              </div>
              <div className="seat-grid">
                {SEATS.map((seat) => (
                  <button
                    type="button"
                    key={seat.id}
                    className={`seat-chip ${seatChoices[activeTravelerIndex]?.id === seat.id ? "active" : ""}`}
                    onClick={() => assignSeat(seat)}
                  >
                    <strong>{seat.id}</strong>
                    <span>{seat.type}</span>
                    <span>{seat.price ? `+${formatInrFromUsd(seat.price)}` : "Included"}</span>
                  </button>
                ))}
              </div>

              <div className="addon-grid">
                <FormCheckbox id="addon-meal" label={`Gourmet Meal (+${formatInrFromUsd(18)})`} checked={ancillaries.meal} onChange={() => toggleAncillary("meal")} />
                <FormCheckbox id="addon-extra-baggage" label={`Extra Baggage 15kg (+${formatInrFromUsd(40)})`} checked={ancillaries.extraBaggage} onChange={() => toggleAncillary("extraBaggage")} />
                <FormCheckbox id="addon-lounge" label={`Lounge Access (+${formatInrFromUsd(55)})`} checked={ancillaries.lounge} onChange={() => toggleAncillary("lounge")} />
              </div>
            </section>
          )}

          {checkoutStep === 3 && (
            <section className="panel section-panel">
              <h4>Protection & Business Policy</h4>
              <FormCheckbox id="checkout-insurance" label="One-click Travel Insurance" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />
              <FormCheckbox id="checkout-business-mode" label="Business Booking Mode" checked={businessMode} onChange={(e) => setBusinessMode(e.target.checked)} />
              {businessMode && (
                <div className="grid two">
                  <FormInput id="company-name" label="Company Name" value={companyName} onChange={(e) => { setBusinessError(""); setCompanyName(e.target.value); }} />
                  <FormInput id="company-tax-id" label="Company Tax ID / GSTIN" value={taxId} onChange={(e) => { setBusinessError(""); setTaxId(e.target.value); }} />
                </div>
              )}
              {businessError ? <p className="warn-text" role="alert" aria-live="assertive">{businessError}</p> : null}
            </section>
          )}

          {checkoutStep === 4 && (
            <section className="panel section-panel">
              <h4>Review & Payment</h4>
              {travelers.map((item, index) => (
                <div className="summary-grid" key={`review-${index + 1}`}>
                  <div>
                    <strong>Traveler P{index + 1}</strong>
                    <p>{item.firstName} {item.lastName}</p>
                    <p>{item.email}</p>
                  </div>
                  <div>
                    <strong>Seat</strong>
                    <p>{seatChoices[index] ? `${seatChoices[index].id} (${seatChoices[index].type})` : "Not selected"}</p>
                  </div>
                </div>
              ))}
              {selectedBnplPlan && (
                <div className="summary-grid checkout-finance-summary">
                  <div>
                    <strong>BNPL Plan</strong>
                    <p>{selectedBnplPlan.months} months @ {(selectedBnplPlan.apr * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <strong>Monthly</strong>
                    <p>{formatInrFromUsd(selectedBnplPlan.installment)}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {!selected.policy.inPolicy && (
            <ApprovalPanel policy={selected.policy} approval={approval} onRequestApproval={onRequestApproval} />
          )}

          {inFinalStep && (
            <>
              <PaymentSplitter
                total={total}
                walletSplit={walletSplit}
                onChange={handleWalletSplitChange}
                walletBalance={wallet.balance}
              />

              <section className="glass card payment-controls-card">
                <div className="panel-top">
                  <div>
                    <h3>Advanced Payment Controls</h3>
                    <p>Choose split strategy, funding priority, and retry behavior before charging.</p>
                  </div>
                  <span className="policy-badge ok">Secure Retry</span>
                </div>

                <div className="chip-row">
                  <button type="button" className={`chip-btn ${splitStrategy === "wallet-first" ? "active" : ""}`} onClick={() => applySplitPreset("wallet-first")}>Wallet First</button>
                  <button type="button" className={`chip-btn ${splitStrategy === "card-first" ? "active" : ""}`} onClick={() => applySplitPreset("card-first")}>Card First</button>
                  <button type="button" className={`chip-btn ${splitStrategy === "balanced" ? "active" : ""}`} onClick={() => applySplitPreset("balanced")}>Balanced 50/50</button>
                </div>

                <div className="panel payment-recommendation-box">
                  <p><strong>Smart Recommendation:</strong> {smartPaymentRecommendation.strategy} + {smartPaymentRecommendation.fundingPriority}</p>
                  <p>{smartPaymentRecommendation.reason}</p>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => {
                      setFundingPriority(smartPaymentRecommendation.fundingPriority);
                      applySplitPreset(smartPaymentRecommendation.strategy);
                    }}
                  >
                    Apply Recommended Setup
                  </button>
                </div>

                <div className="grid two payment-controls-grid">
                  <FormInput
                    id="payment-funding-priority"
                    label="Funding Priority"
                    as="select"
                    value={fundingPriority}
                    onChange={(e) => setFundingPriority(e.target.value)}
                  >
                    <option value="wallet-first">Wallet First</option>
                    <option value="card-first">Card First</option>
                    <option value="lowest-fee">Lowest Fee Route</option>
                    <option value="resilient-route">Resilient Route (Fallback)</option>
                  </FormInput>

                  <FormCheckbox
                    id="payment-auto-retry"
                    label="Auto-retry once with fresh idempotency key"
                    checked={autoRetry}
                    onChange={(e) => setAutoRetry(e.target.checked)}
                  />
                </div>
              </section>
            </>
          )}

          <div className="pay-row" aria-busy={processing}>
            <button
              type="button"
              className="btn primary"
              disabled={processing || !lockId || lockRemaining === 0 || !canPay || !inFinalStep}
              onClick={() => onProcessPayment({ splitStrategy, fundingPriority, autoRetry, recommendation: smartPaymentRecommendation })}
            >
              {processing ? "Processing..." : "Confirm Payment"}
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={processing || !inFinalStep || !paymentFailure}
              onClick={() => onRetryPayment({ splitStrategy, fundingPriority, autoRetry, recommendation: smartPaymentRecommendation })}
            >
              Retry Payment
            </button>
            <button type="button" className="btn secondary" onClick={onDownloadInvoice}>Generate PDF Invoice</button>
          </div>
          {processing ? <LoadingBadge text="Processing payment and updating booking timeline..." /> : null}

          {paymentFailure ? (
            <p className="warn-text" role="alert" aria-live="assertive">
              Last attempt failed: {paymentFailure.message}
            </p>
          ) : null}

          {!bookingReady && <p className="warn-text" role="alert" aria-live="assertive">Complete traveler details and seat selection to enable payment.</p>}
          <div className="total-payable-row">
            <span><UiIcon name="card" size={14} /> Total Payable</span>
            <strong>{formatInrFromUsd(total)}</strong>
          </div>
          {paymentResult && <p className="success">Payment {paymentResult.status} | Ref: {paymentResult.paymentId}</p>}
          {paymentResult && (
            <div className="panel confirmation-panel">
              <h4>Booking Confirmed</h4>
              <p>Travelers: {travelers.length}</p>
              <p>
                Seats: {seatChoices.map((seat, index) => (
                  <span key={`confirm-seat-${index + 1}`}>P{index + 1}: {seat?.id || "TBD"} </span>
                ))}
              </p>
              <p>PNR Ref: PNR-MOCK-2026</p>
            </div>
          )}
        </article>
      </section>

      <div className="stack">
        <WalletBalanceCard wallet={wallet} />
        <ESGTracker
          carbonKg={selected.carbonKg}
          contribution={esgRoundup}
          onNeutralize={() => setEsgRoundup((v) => Number((v + 8.5).toFixed(2)))}
        />
        {bnpl && (
          <article className="glass card bnpl-card">
            <h3>Agentic BNPL</h3>
            <p>Risk Band: {bnpl.riskBand}</p>
            {bnpl.reason && <p>{bnpl.reason}</p>}
            <p>Suggested down payment: {formatInrFromUsd(Number(bnpl.suggestedDownPayment || 0))}</p>
            {!bnpl.approved && <p className="warn-text">Financing may require higher upfront payment or manager approval.</p>}
            <div className="chip-row bnpl-action-row">
              <button
                type="button"
                className="chip-btn"
                onClick={() => {
                  const recommended = bnpl.plans?.find((plan) => plan.months === 6) || bnpl.plans?.[0] || null;
                  onSelectBnplPlan(recommended);
                }}
                disabled={!bnpl.plans?.length}
              >
                Use Recommended Plan
              </button>
            </div>
            <div className="bnpl-plan-grid">
              {(bnpl.plans || []).map((p) => (
                <button
                  type="button"
                  key={p.months}
                  className={`bnpl-plan-chip ${selectedBnplPlan?.months === p.months ? "active" : ""}`}
                  onClick={() => onSelectBnplPlan(p)}
                >
                  <strong>{p.months} months</strong>
                  <span>{(p.apr * 100).toFixed(1)}% APR</span>
                  <span>{formatInrFromUsd(p.installment)}</span>
                </button>
              ))}
            </div>
            {selectedBnplPlan && (
              <div className="bnpl-selection-note">
                <strong>Selected:</strong> {selectedBnplPlan.months} months, {(selectedBnplPlan.apr * 100).toFixed(1)}% APR, {formatInrFromUsd(selectedBnplPlan.installment)} per month
              </div>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
