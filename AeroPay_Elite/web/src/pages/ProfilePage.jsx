import React, { useEffect, useState } from "react";
import FormInput from "../components/FormInput";
import UiIcon from "../components/UiIcon";
import { readStorageValue, writeStorageValue } from "../lib/browserStorage";

const DEFAULT_PAYMENT_METHODS = [
  { id: "card-visa", type: "credit", brand: "Visa", last4: "4242", expiry: "12/26", isDefault: true },
  { id: "card-amex", type: "credit", brand: "American Express", last4: "3782", expiry: "03/27", isDefault: false },
];

const DEFAULT_PREFERENCES = {
  seatType: "window",
  mealPreference: "vegetarian",
  notifyUpgrades: true,
};

export default function ProfilePage({ profile, sessionKey, onUpdateProfile, onLogout }) {
  const [paymentMethods, setPaymentMethods] = useState(() => readStorageValue("aero.profile.paymentMethods", DEFAULT_PAYMENT_METHODS));
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ brand: "", cardNumber: "", expiry: "", cvv: "" });
  const [loyaltyStatus, setLoyaltyStatus] = useState(() => readStorageValue("aero.profile.loyaltyStatus", "gold"));
  const [preferences, setPreferences] = useState(() => readStorageValue("aero.profile.preferences", DEFAULT_PREFERENCES));

  const loyaltyTiers = {
    silver: { miles: 25000, nextTier: "Gold", nextMiles: 75000 },
    gold: { miles: 85000, nextTier: "Platinum", nextMiles: 150000 },
    platinum: { miles: 180000, nextTier: "Elite", nextMiles: 250000 },
  };

  const currentTier = loyaltyTiers[loyaltyStatus] || loyaltyTiers.silver;
  const tierPercent = Math.floor((currentTier.miles / currentTier.nextMiles) * 100);

  const handleAddPayment = () => {
    if (newPayment.cardNumber && newPayment.expiry) {
      const cardLast4 = newPayment.cardNumber.slice(-4);
      setPaymentMethods([
        ...paymentMethods,
        {
          id: `card-${Date.now()}`,
          type: "credit",
          brand: newPayment.brand || "Card",
          last4: cardLast4,
          expiry: newPayment.expiry,
          isDefault: false,
        },
      ]);
      setNewPayment({ brand: "", cardNumber: "", expiry: "", cvv: "" });
      setShowAddPayment(false);
    }
  };

  const handleDeletePayment = (id) => {
    setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
  };

  const handleSetDefault = (id) => {
    setPaymentMethods(paymentMethods.map((m) => ({ ...m, isDefault: m.id === id })));
  };

  useEffect(() => {
    writeStorageValue("aero.profile.paymentMethods", paymentMethods);
  }, [paymentMethods]);

  useEffect(() => {
    writeStorageValue("aero.profile.loyaltyStatus", loyaltyStatus);
  }, [loyaltyStatus]);

  useEffect(() => {
    writeStorageValue("aero.profile.preferences", preferences);
  }, [preferences]);

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>Profile & Account</h2>
          <p>Manage your personal information, payment methods, loyalty program, and travel preferences.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      <section className="glass card section-block">
        <h3><UiIcon name="account" size={16} /> Personal Information</h3>
        <div className="grid two">
          <FormInput id="profile-name" label="Full Name" value={profile.name} onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })} />
          <FormInput id="profile-email" label="Email" type="email" value={profile.email} onChange={(e) => onUpdateProfile({ ...profile, email: e.target.value })} />
        </div>
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={onLogout}><UiIcon name="account" size={14} /> Sign Out</button>
        </div>
      </section>

      <section className="glass card section-block">
        <h3><UiIcon name="spark" size={16} /> Loyalty Program</h3>
        <div className="loyalty-tier-card">
          <div className="tier-header">
            <span className="tier-name">{loyaltyStatus.charAt(0).toUpperCase() + loyaltyStatus.slice(1)} Member</span>
            <span className="tier-miles">{currentTier.miles.toLocaleString()} miles</span>
          </div>
          <div className="tier-progress">
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${tierPercent}%` }}></div></div>
            <p className="progress-text">{currentTier.nextMiles - currentTier.miles} miles until {currentTier.nextTier}</p>
          </div>
          <ul className="stat-list">
            <li><UiIcon name="check" size={13} /> Earn 2x miles on all bookings</li>
            <li><UiIcon name="check" size={13} /> Priority customer support</li>
            <li><UiIcon name="check" size={13} /> Exclusive upgrade offers</li>
            <li><UiIcon name="check" size={13} /> Free baggage on all flights</li>
          </ul>
        </div>
      </section>

      <section className="glass card section-block">
        <div className="section-header">
          <h3><UiIcon name="wallet" size={16} /> Payment Methods</h3>
          <button type="button" className="btn small" onClick={() => setShowAddPayment(!showAddPayment)}><UiIcon name="add" size={14} /> Add</button>
        </div>
        {showAddPayment && (
          <div className="payment-form glass">
            <div className="grid two">
              <FormInput id="new-payment-brand" label="Card Type" value={newPayment.brand} onChange={(e) => setNewPayment({ ...newPayment, brand: e.target.value })} />
              <FormInput id="new-payment-number" label="Card Number" value={newPayment.cardNumber} onChange={(e) => setNewPayment({ ...newPayment, cardNumber: e.target.value.replace(/\s/g, "") })} />
            </div>
            <div className="grid three">
              <FormInput id="new-payment-expiry" label="Expiry (MM/YY)" value={newPayment.expiry} onChange={(e) => setNewPayment({ ...newPayment, expiry: e.target.value })} />
              <FormInput id="new-payment-cvv" label="CVV" type="password" value={newPayment.cvv} onChange={(e) => setNewPayment({ ...newPayment, cvv: e.target.value })} />
            </div>
            <div className="btn-row">
              <button type="button" className="btn" onClick={handleAddPayment}>Save Payment Method</button>
              <button type="button" className="btn secondary" onClick={() => setShowAddPayment(false)}>Cancel</button>
            </div>
          </div>
        )}
        <div className="payment-methods-list">
          {paymentMethods.map((method) => (
            <div key={method.id} className="payment-method-item">
              <div className="payment-info">
                <span className="payment-brand"><UiIcon name="card" size={14} /> {method.brand}</span>
                <span className="payment-last4">•••• {method.last4}</span>
                <span className="payment-expiry">Expires {method.expiry}</span>
              </div>
              <div className="payment-actions">
                {!method.isDefault && (<button type="button" className="btn-text small" onClick={() => handleSetDefault(method.id)}>Set Default</button>)}
                {method.isDefault && <span className="badge-default">Default</span>}
                <button type="button" className="btn-text small danger" onClick={() => handleDeletePayment(method.id)}><UiIcon name="trash" size={12} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass card section-block">
        <h3><UiIcon name="settings" size={16} /> Travel Preferences</h3>
        <div className="grid two">
          <div className="pref-group">
            <label htmlFor="seat-type">Preferred Seat</label>
            <select id="seat-type" value={preferences.seatType} onChange={(e) => setPreferences({ ...preferences, seatType: e.target.value })} className="input">
              <option value="window">Window</option>
              <option value="aisle">Aisle</option>
              <option value="middle">Middle</option>
              <option value="any">Any</option>
            </select>
          </div>
          <div className="pref-group">
            <label htmlFor="meal-pref">Meal Preference</label>
            <select id="meal-pref" value={preferences.mealPreference} onChange={(e) => setPreferences({ ...preferences, mealPreference: e.target.value })} className="input">
              <option value="regular">Regular</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="halal">Halal</option>
              <option value="kosher">Kosher</option>
            </select>
          </div>
        </div>
        <div className="checkbox-row">
          <input type="checkbox" id="notify-upgrades" checked={preferences.notifyUpgrades} onChange={(e) => setPreferences({ ...preferences, notifyUpgrades: e.target.checked })} />
          <label htmlFor="notify-upgrades">Notify me about upgrades</label>
        </div>
      </section>
    </section>
  );
}
