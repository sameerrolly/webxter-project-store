import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { studentLogin } from "./studentStore";
import "./student.css";

export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      const result = studentLogin(email.trim());
      setLoading(false);
      if (result.success) navigate("/student/dashboard");
      else setError(result.error);
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f0faff 0%,#fdf0ff 100%)", padding: 24, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <a href="https://webxter.in" style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <video autoPlay loop playsInline muted width="44" height="44" style={{ borderRadius: 8 }}>
              <source src="https://www.webxter.in/webxter-preloader.mp4" type="video/mp4" />
            </video>
            <img alt="Webxter" width="110" height="22" loading="lazy"
              src="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75"
              style={{ color: "transparent", objectFit: "contain" }} />
          </a>
        </div>

        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Student Portal</h1>
        <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 28 }}>
          Enter the email you used when placing your order to access your dashboard.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }} noValidate>
          <div className="sd-field">
            <label className="sd-field__label" htmlFor="email">Email Address</label>
            <input id="email" type="email" className="sd-field__input"
              placeholder="rahul@example.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoFocus autoComplete="email" />
          </div>

          {error && (
            <div className="sd-alert sd-alert--warn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="sd-btn sd-btn--primary sd-btn--full" style={{ padding: "12px", fontSize: ".95rem", marginTop: 4 }} disabled={loading}>
            {loading ? (
              <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "sd-spin .7s linear infinite", display: "inline-block" }} />
            ) : (
              <>
                Access My Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: "14px 16px", background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: ".8rem", color: "#64748b", lineHeight: 1.6 }}>
          <strong style={{ color: "#334155" }}>New here?</strong> Place an order first and your dashboard will be automatically created.{" "}
          <Link to="/" style={{ color: "#009fd4", fontWeight: 600 }}>Browse Projects →</Link>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: ".78rem", color: "#94a3b8" }}>
          <Link to="/" style={{ color: "#009fd4" }}>← Back to store</Link>
        </p>
      </div>
      <style>{`@keyframes sd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
