import React, { useEffect, useState } from "react";
import FormCheckbox from "../components/FormCheckbox";
import UiIcon from "../components/UiIcon";
import { readStorageValue, writeStorageValue } from "../lib/browserStorage";

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  pushNotifications: false,
  smsNotifications: false,
  dataSharing: false,
  marketingEmails: true,
  theme: "dark",
  language: "en",
};

export default function SettingsPage({
  boardingPass,
  sessionKey,
  reduceMotion,
  setReduceMotion,
  threeDEnabled,
  setThreeDEnabled,
}) {
  const [emailNotifications, setEmailNotifications] = useState(() => readStorageValue("aero.settings.emailNotifications", DEFAULT_SETTINGS.emailNotifications));
  const [pushNotifications, setPushNotifications] = useState(() => readStorageValue("aero.settings.pushNotifications", DEFAULT_SETTINGS.pushNotifications));
  const [smsNotifications, setSmsNotifications] = useState(() => readStorageValue("aero.settings.smsNotifications", DEFAULT_SETTINGS.smsNotifications));
  const [dataSharing, setDataSharing] = useState(() => readStorageValue("aero.settings.dataSharing", DEFAULT_SETTINGS.dataSharing));
  const [marketingEmails, setMarketingEmails] = useState(() => readStorageValue("aero.settings.marketingEmails", DEFAULT_SETTINGS.marketingEmails));
  const [theme, setTheme] = useState(() => readStorageValue("aero.settings.theme", DEFAULT_SETTINGS.theme));
  const [language, setLanguage] = useState(() => readStorageValue("aero.settings.language", DEFAULT_SETTINGS.language));

  useEffect(() => {
    writeStorageValue("aero.settings.emailNotifications", emailNotifications);
  }, [emailNotifications]);

  useEffect(() => {
    writeStorageValue("aero.settings.pushNotifications", pushNotifications);
  }, [pushNotifications]);

  useEffect(() => {
    writeStorageValue("aero.settings.smsNotifications", smsNotifications);
  }, [smsNotifications]);

  useEffect(() => {
    writeStorageValue("aero.settings.dataSharing", dataSharing);
  }, [dataSharing]);

  useEffect(() => {
    writeStorageValue("aero.settings.marketingEmails", marketingEmails);
  }, [marketingEmails]);

  useEffect(() => {
    writeStorageValue("aero.settings.theme", theme);
  }, [theme]);

  useEffect(() => {
    writeStorageValue("aero.settings.language", language);
  }, [language]);

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>Settings & Preferences</h2>
          <p>Customize notifications, privacy, display, and data management options.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      {/* Display & Accessibility */}
      <section className="glass card section-block">
        <h3><UiIcon name="settings" size={16} /> Display & Accessibility</h3>
        <div className="grid two">
          <div className="pref-group">
            <label htmlFor="theme-select">Theme</label>
            <select id="theme-select" value={theme} onChange={(e) => setTheme(e.target.value)} className="input">
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          <div className="pref-group">
            <label htmlFor="language-select">Language</label>
            <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
        <div className="checkbox-row">
          <FormCheckbox id="settings-reduce-motion" label="Reduce motion animations (accessibility)" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
        </div>
        <div className="checkbox-row">
          <FormCheckbox id="settings-3d-enabled" label="Enable 3D visual previews" checked={threeDEnabled} onChange={(e) => setThreeDEnabled(e.target.checked)} />
        </div>
      </section>

      {/* Notifications */}
      <section className="glass card section-block">
        <h3><UiIcon name="bell" size={16} /> Notifications</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0px" }}>Choose how you want to receive booking updates and alerts.</p>
        <div className="checkbox-row">
          <FormCheckbox id="email-notif" label="Email notifications (booking confirmation, check-in reminders)" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
        </div>
        <div className="checkbox-row">
          <FormCheckbox id="push-notif" label="Push notifications (real-time flight updates)" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} />
        </div>
        <div className="checkbox-row">
          <FormCheckbox id="sms-notif" label="SMS alerts (gate changes, boarding calls)" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} />
        </div>
        <div className="checkbox-row">
          <FormCheckbox id="marketing-emails" label="Marketing & promotional emails" checked={marketingEmails} onChange={(e) => setMarketingEmails(e.target.checked)} />
        </div>
      </section>

      {/* Privacy & Data */}
      <section className="glass card section-block">
        <h3><UiIcon name="shield" size={16} /> Privacy & Data</h3>
        <div className="checkbox-row">
          <FormCheckbox id="data-sharing" label="Share anonymized booking data for analytics" checked={dataSharing} onChange={(e) => setDataSharing(e.target.checked)} />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
          <UiIcon name="check" size={12} /> Your data is encrypted and never sold to third parties.
        </p>
        <div className="btn-row" style={{ marginTop: "12px" }}>
          <button type="button" className="btn secondary small"><UiIcon name="download" size={13} /> Download My Data</button>
          <button type="button" className="btn secondary small"><UiIcon name="trash" size={13} /> Delete Account</button>
        </div>
      </section>

      {/* Platform & Session Info */}
      <section className="glass card section-block">
        <h3><UiIcon name="portfolio" size={16} /> Platform Information</h3>
        <ul className="stat-list">
          <li><UiIcon name="check" size={13} /> Industry Mode: NDC-ready mock</li>
          <li><UiIcon name="check" size={13} /> Backend Scope: localhost only</li>
          <li><UiIcon name="check" size={13} /> Corporate Policy checks enabled</li>
          <li><UiIcon name="check" size={13} /> Offline-first cache for wallet and boarding pass</li>
        </ul>
      </section>

      {/* Cached Boarding Pass */}
      <section className="glass card section-block">
        <h3><UiIcon name="ticket" size={16} /> Cached Travel Artifacts</h3>
        {boardingPass ? (
          <div className="pass-chip">
            <div style={{ display: "grid", gap: "8px" }}>
              <div><strong>PNR:</strong> {boardingPass.pnr}</div>
              <div><strong>Gate:</strong> {boardingPass.gate}</div>
              <div><strong>Seat:</strong> {boardingPass.seat}</div>
              <div><strong>Status:</strong> <span className="badge-default">{boardingPass.status}</span></div>
            </div>
          </div>
        ) : (
          <p>No cached boarding pass available in this session yet.</p>
        )}
      </section>
    </section>
  );
}
