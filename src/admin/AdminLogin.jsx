import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { adminApiLogin, extractApiError, isAdminApiLoggedIn } from "./adminApi";
import "./admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  // ── All hooks must be called before any conditional return ──
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  // Already logged in — skip the login page
  if (isAdminApiLoggedIn()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      await adminApiLogin(form.email.trim(), form.password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.message || extractApiError(err);
      setError(msg || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-login-brand">
          <div className="adm-login-brand__icon">W</div>
          <div>
            <div className="adm-login-brand__name">Webxter</div>
            <div className="adm-login-brand__sub">Admin Panel</div>
          </div>
        </div>

        <h1 className="adm-login-title">Sign in to continue</h1>
        <p className="adm-login-hint">Admin access only — staff &amp; superuser accounts</p>

        <form onSubmit={handleSubmit} className="adm-login-form" noValidate>
          <div className="adm-field">
            <label className="adm-field__label" htmlFor="adm-email">Email</label>
            <input
              id="adm-email" type="email" className="adm-field__input"
              placeholder="admin@webxter.in"
              value={form.email}
              onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(""); }}
              autoComplete="email" autoFocus
            />
          </div>

          <div className="adm-field">
            <label className="adm-field__label" htmlFor="adm-password">Password</label>
            <div className="adm-login-pw-wrap">
              <input
                id="adm-password" type={showPw ? "text" : "password"}
                className="adm-field__input" placeholder="••••••••"
                value={form.password}
                onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(""); }}
                autoComplete="current-password"
              />
              <button type="button" className="adm-login-pw-toggle" onClick={() => setShowPw((v) => !v)}>
                {showPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div className="adm-login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="adm-btn adm-btn--primary adm-login-submit" disabled={loading}>
            {loading
              ? <span className="adm-login-spinner" />
              : <>Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></>
            }
          </button>
        </form>

        <p className="adm-login-footer">
          <a href="/" style={{ color: "#009fd4", textDecoration: "none", fontSize: ".82rem" }}>← Back to site</a>
        </p>
      </div>

      <style>{`
        .adm-login-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #f0faff 0%, #fdf0ff 100%);
          padding: 24px; font-family: 'Inter','Segoe UI',system-ui,sans-serif;
        }
        .adm-login-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 20px;
          padding: 40px 36px; width: 100%; max-width: 420px;
          box-shadow: 0 8px 40px rgba(0,0,0,.1);
        }
        .adm-login-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .adm-login-brand__icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(45deg, #009fd4, #ff6eff);
          color: #fff; font-weight: 800; font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
        }
        .adm-login-brand__name { font-weight: 800; font-size: 1.1rem; color: #0f172a; }
        .adm-login-brand__sub  { font-size: .75rem; color: #64748b; }
        .adm-login-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .adm-login-hint  { font-size: .78rem; color: #94a3b8; margin-bottom: 24px; }
        .adm-login-form  { display: flex; flex-direction: column; gap: 16px; }
        .adm-login-pw-wrap { position: relative; }
        .adm-login-pw-wrap .adm-field__input { padding-right: 40px; }
        .adm-login-pw-toggle {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8;
          display: flex; align-items: center;
        }
        .adm-login-pw-toggle:hover { color: #009fd4; }
        .adm-login-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(239,68,68,.08); color: #dc2626;
          border: 1px solid rgba(239,68,68,.2); border-radius: 8px;
          padding: 10px 14px; font-size: .82rem; font-weight: 500; line-height: 1.5;
        }
        .adm-login-submit { width: 100%; padding: 12px; font-size: .95rem; margin-top: 4px; }
        .adm-login-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
          animation: adm-spin .7s linear infinite; display: inline-block;
        }
        @keyframes adm-spin { to { transform: rotate(360deg); } }
        .adm-login-footer { text-align: center; margin-top: 20px; }
      `}</style>
    </div>
  );
}
