import React, { useState } from "react";
import FormInput from "../components/FormInput";
import UiIcon from "../components/UiIcon";
import { isEmail } from "../lib/validation";

export default function AuthPage({ sessionKey, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    let hasError = false;

    if (!name.trim()) {
      setNameError("Full name is required.");
      hasError = true;
    } else {
      setNameError("");
    }

    if (!isEmail(email)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (hasError) {
      return;
    }

    onLogin({ name, email });
  }

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>Sign In</h2>
          <p>Access your account to manage trips, cancellations, and traveler preferences.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      <section className="grid two account-shell">
        <form className="glass card auth-form" onSubmit={handleSubmit}>
          <FormInput id="auth-name" label="Full Name" value={name} onChange={(e) => { setNameError(""); setName(e.target.value); }} placeholder="Arihant Singh" error={nameError} />
          <FormInput id="auth-email" label="Email" type="email" value={email} onChange={(e) => { setEmailError(""); setEmail(e.target.value); }} placeholder="you@example.com" error={emailError} />
          <button className="btn primary" type="submit"><UiIcon name="check" size={14} /> Continue</button>
        </form>

        <article className="glass card account-side-card">
          <h3><UiIcon name="shield" size={16} /> Account Security</h3>
          <ul className="stat-list">
            <li><UiIcon name="check" size={13} /> Local-only account session</li>
            <li><UiIcon name="check" size={13} /> Policy-aware checkout protection</li>
            <li><UiIcon name="check" size={13} /> Wallet and trip data persisted per browser</li>
          </ul>
        </article>
      </section>
    </section>
  );
}
