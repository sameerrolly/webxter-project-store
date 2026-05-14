import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { getSettings, saveSettings } from "./adminStore";

export default function AdminSettings() {
  const [settings, setSettings] = useState(() => getSettings());
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }));
  const setToggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Settings</div>
          <div className="adm-page-header__sub">Manage site configuration and preferences</div>
        </div>
      </div>

      <form onSubmit={handleSave} className="adm-form">

        {/* Site info */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Site Information</div>
          <div className="adm-form__grid">
            <div className="adm-field">
              <label className="adm-field__label">Site Name</label>
              <input className="adm-field__input" value={settings.siteName} onChange={set("siteName")} />
            </div>
            <div className="adm-field">
              <label className="adm-field__label">Tagline</label>
              <input className="adm-field__input" value={settings.tagline} onChange={set("tagline")} />
            </div>
            <div className="adm-field">
              <label className="adm-field__label">Contact Email</label>
              <input type="email" className="adm-field__input" value={settings.email} onChange={set("email")} />
            </div>
            <div className="adm-field">
              <label className="adm-field__label">Phone Number</label>
              <input className="adm-field__input" value={settings.phone} onChange={set("phone")} />
            </div>
            <div className="adm-field">
              <label className="adm-field__label">WhatsApp Number</label>
              <input className="adm-field__input" value={settings.whatsapp} onChange={set("whatsapp")} />
            </div>
          </div>
        </div>

        {/* Coupon */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Coupon / Discount</div>
          <div className="adm-form__grid">
            <div className="adm-field">
              <label className="adm-field__label">Coupon Code</label>
              <input className="adm-field__input" value={settings.couponCode} onChange={set("couponCode")}
                style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }} />
              <p className="adm-field__hint">Customers enter this at checkout</p>
            </div>
            <div className="adm-field">
              <label className="adm-field__label">Discount (%)</label>
              <input type="number" className="adm-field__input" value={settings.couponDiscount} onChange={set("couponDiscount")} min="0" max="100" />
            </div>
          </div>
          <div style={{ marginTop: 12, background: "rgba(0,159,212,.06)", border: "1px solid rgba(0,159,212,.2)", borderRadius: 10, padding: "12px 16px", fontSize: ".85rem", color: "#334155" }}>
            Current coupon: <strong style={{ color: "#009fd4" }}>{settings.couponCode}</strong> gives <strong>{settings.couponDiscount}% off</strong> at checkout.
          </div>
        </div>

        {/* Marquee */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Marquee Banner</div>
          <div className="adm-form__grid">
            <div className="adm-field adm-form__full">
              <label className="adm-toggle" style={{ marginBottom: 14 }}>
                <div className={`adm-toggle__track ${settings.showMarquee ? "adm-toggle__track--on" : ""}`} onClick={() => setToggle("showMarquee")}>
                  <div className="adm-toggle__thumb" />
                </div>
                <span className="adm-toggle__label">Show marquee banner on all pages</span>
              </label>
            </div>
            <div className="adm-field adm-form__full">
              <label className="adm-field__label">Marquee Text</label>
              <input className="adm-field__input" value={settings.marqueeText} onChange={set("marqueeText")} />
            </div>
          </div>
          {settings.showMarquee && (
            <div style={{ marginTop: 12, background: "linear-gradient(45deg,#009fd4,#ff6eff)", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: ".82rem", fontWeight: 600, textAlign: "center" }}>
              Preview: {settings.marqueeText}
            </div>
          )}
        </div>

        {/* Maintenance */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 18, color: "#0f172a" }}>Site Status</div>
          <label className="adm-toggle">
            <div className={`adm-toggle__track ${settings.maintenanceMode ? "adm-toggle__track--on" : ""}`} onClick={() => setToggle("maintenanceMode")}>
              <div className="adm-toggle__thumb" />
            </div>
            <span className="adm-toggle__label">Maintenance Mode (hides store from visitors)</span>
          </label>
          {settings.maintenanceMode && (
            <div style={{ marginTop: 12, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, padding: "10px 14px", fontSize: ".82rem", color: "#dc2626", fontWeight: 500 }}>
              ⚠ Maintenance mode is ON — the store is hidden from visitors.
            </div>
          )}
        </div>

        {/* Admin credentials info */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 12, color: "#0f172a" }}>Admin Credentials</div>
          <div style={{ background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", fontSize: ".85rem", color: "#64748b", lineHeight: 1.7 }}>
            <div>Username: <strong style={{ color: "#0f172a" }}>admin</strong></div>
            <div>Password: <strong style={{ color: "#0f172a" }}>webxter@2024</strong></div>
            <div style={{ marginTop: 6, fontSize: ".78rem", color: "#94a3b8" }}>To change credentials, update <code>ADMIN_CREDENTIALS</code> in <code>src/admin/adminStore.js</code></div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end" }}>
          {saved && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#16a34a", fontSize: ".875rem", fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Settings saved!
            </div>
          )}
          <button type="submit" className="adm-btn adm-btn--primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Save Settings
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
