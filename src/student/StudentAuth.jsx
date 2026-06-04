import React, { useState } from "react";
import { useNavigate, Link, useSearchParams, Navigate } from "react-router-dom";
import { studentLoginApi, studentRegisterApi, isLoggedIn } from "./StudentApi";
import "./student.css";

// Demo users shown on the login page (for reference only — must exist in the backend)
const DEMO_USERS = [
  { name: "Rahul Sharma",  email: "rahul@example.com",  password: "Student@123", college: "IIT Delhi"   },
  { name: "Priya Patel",   email: "priya@example.com",  password: "Student@123", college: "NIT Surat"   },
  { name: "Amit Kumar",    email: "amit@example.com",   password: "Student@123", college: "VIT Vellore" },
];

// ─── Shared field ─────────────────────────────────────────────────────────────
function Field({ label, id, type = "text", placeholder, value, onChange, error, hint, required, autoFocus, children }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="sd-field">
      <label className="sd-field__label" htmlFor={id}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children || (
        <div style={{ position: "relative" }}>
          <input id={id} type={isPassword && show ? "text" : type}
            placeholder={placeholder} value={value} onChange={onChange}
            autoFocus={autoFocus} autoComplete={isPassword ? "current-password" : id}
            className={`sd-field__input${error ? " sd-field__input--error" : ""}`}
            style={isPassword ? { paddingRight: 40 } : {}} />
          {isPassword && (
            <button type="button" onClick={() => setShow((v) => !v)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
              {show
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          )}
        </div>
      )}
      {error && <p style={{ fontSize: ".75rem", color: "#ef4444", marginTop: 2 }}>{error}</p>}
      {hint && !error && <p className="sd-field__hint">{hint}</p>}
    </div>
  );
}

// ─── Password strength indicator ──────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#009fd4", "#22c55e"];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : "#e2e8f0", transition: "background .2s" }} />
        ))}
      </div>
      <p style={{ fontSize: ".72rem", color: colors[score] || "#94a3b8", fontWeight: 600 }}>
        {score > 0 ? labels[score] : "Enter a password"}
        {score < 4 && score > 0 && " — add " + [!checks[0] && "8+ chars", !checks[1] && "uppercase", !checks[2] && "number", !checks[3] && "symbol"].filter(Boolean).join(", ")}
      </p>
    </div>
  );
}

// ─── Auth card wrapper ────────────────────────────────────────────────────────
function AuthCard({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f0faff 0%,#fdf0ff 100%)", padding: "24px 16px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        {/* Logo */}
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
          <video autoPlay loop playsInline muted width="42" height="42" style={{ borderRadius: 8, flexShrink: 0 }}>
            <source src="https://www.webxter.in/webxter-preloader.mp4" type="video/mp4" />
          </video>
          <img alt="Webxter" width="108" height="60" loading="lazy"
            src="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75"
            style={{ color: "transparent", objectFit: "contain" }} />
        </a>
        {children}
      </div>
      <style>{`@keyframes sd-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "sd-spin .7s linear infinite", display: "inline-block" }} />
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(""); // top-level error from server
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
    setApiError(""); // clear server error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");
    try {
      await studentLoginApi(form.email, form.password);
      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      setApiError(err.message || "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (user) => {
    setForm({ email: user.email, password: user.password });
    setApiError("");
    setErrors({});
  };

  return (
    <>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Welcome back</h1>
      <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 24 }}>Sign in to your student dashboard</p>

      {/* ── Server error banner ── */}
      {apiError && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 10, padding: "12px 14px", marginBottom: 16,
          fontSize: ".85rem", color: "#b91c1c", lineHeight: 1.5,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
        <Field label="Email Address" id="email" type="email" placeholder="rahul@example.com"
          value={form.email} onChange={set("email")} error={errors.email} required autoFocus />
        <Field label="Password" id="password" type="password" placeholder="••••••••"
          value={form.password} onChange={set("password")} error={errors.password} required />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6 }}>
          <button type="button" onClick={() => onSwitch("forgot")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#009fd4", fontSize: ".8rem", fontWeight: 600, padding: 0 }}>
            Forgot password?
          </button>
        </div>

        <button type="submit" className="sd-btn sd-btn--primary sd-btn--full" style={{ padding: "12px", fontSize: ".95rem" }} disabled={loading}>
          {loading ? <Spinner /> : <>Sign In <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></>}
        </button>
      </form>

      <div style={{ textAlign: "center", margin: "18px 0 16px", fontSize: ".8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        or
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      <button type="button" className="sd-btn sd-btn--ghost sd-btn--full" onClick={() => onSwitch("register")} style={{ marginBottom: 20 }}>
        Create a new account
      </button>

    

      <p style={{ textAlign: "center", marginTop: 18, fontSize: ".78rem", color: "#94a3b8" }}>
        <Link to="/" style={{ color: "#009fd4" }}>← Back to store</Link>
      </p>
    </>
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", phone: "", college: "", year: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
    // Clear duplicate email banner when user changes the email field
    if (k === "email") setApiError("");
    else setApiError((prev) => (prev !== "duplicate" ? "" : prev));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.password || form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (form.phone && !/^\d{10}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit phone number";
    return e;
  };

  const handleNext = (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await studentRegisterApi({
        name:     form.name,
        email:    form.email,
        password: form.password,
        phone:    form.phone,
        college:  form.college,
        year:     form.year,
      });
      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Registration failed. Please try again.";
      const isDuplicate =
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("email is already");
      if (isDuplicate) {
        // Go back to step 1 and highlight the email field
        setStep(1);
        setErrors((prev) => ({ ...prev, email: "An account with this email already exists." }));
        setApiError("duplicate");
      } else {
        setApiError(msg);
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Create account</h1>
      <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 20 }}>Join Webxter Student Portal</p>

      {/* ── Server error banner ── */}
      {apiError && apiError !== "duplicate" && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 10, padding: "12px 14px", marginBottom: 16,
          fontSize: ".85rem", color: "#b91c1c", lineHeight: 1.5,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* ── Duplicate email banner ── */}
      {apiError === "duplicate" && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 10, padding: "12px 14px", marginBottom: 16,
          fontSize: ".85rem", color: "#b91c1c", lineHeight: 1.6,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            An account with this email already exists.{" "}
            <button
              type="button"
              onClick={() => onSwitch("login")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: 700, padding: 0, textDecoration: "underline", fontSize: ".85rem" }}
            >
              Sign in instead →
            </button>
          </span>
        </div>
      )}

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ height: 3, borderRadius: 2, background: s <= step ? "linear-gradient(45deg,#009fd4,#ff6eff)" : "#e2e8f0", transition: "background .3s" }} />
            <div style={{ fontSize: ".7rem", color: s <= step ? "#009fd4" : "#94a3b8", fontWeight: 600 }}>
              {s === 1 ? "Account" : "Details"}
            </div>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
          <Field label="Full Name" id="name" placeholder="Rahul Sharma"
            value={form.name} onChange={set("name")} error={errors.name} required autoFocus />
          <Field label="Email Address" id="email" type="email" placeholder="rahul@example.com"
            value={form.email} onChange={set("email")} error={errors.email} required />
          <div>
            <Field label="Password" id="password" type="password" placeholder="Min. 8 characters"
              value={form.password} onChange={set("password")} error={errors.password} required />
            <PasswordStrength password={form.password} />
          </div>
          <Field label="Confirm Password" id="confirm" type="password" placeholder="Re-enter password"
            value={form.confirm} onChange={set("confirm")} error={errors.confirm} required />
          <button type="submit" className="sd-btn sd-btn--primary sd-btn--full" style={{ padding: "12px", fontSize: ".95rem", marginTop: 4 }}>
            Continue
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
          <div className="sd-alert sd-alert--info" style={{ marginBottom: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            These details help us personalise your dashboard. All optional.
          </div>
          <Field label="Phone Number" id="phone" type="tel" placeholder="9876543210"
            value={form.phone} onChange={set("phone")} error={errors.phone}
            hint="10-digit mobile number">
            <div style={{ position: "relative" }}>
              <input
                id="phone"
                type="tel"
                className={`sd-field__input${errors.phone ? " sd-field__input--error" : ""}`}
                placeholder="9876543210"
                maxLength={10}
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((f) => ({ ...f, phone: digits }));
                  setErrors((er) => ({ ...er, phone: "" }));
                }}
              />
              <span style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                fontSize: "1px", color: form.phone.length === 10 ? "#fdfdfdff" : "#94a3b8",
                fontWeight: 600, pointerEvents: "none", display: "none"
              }}>
                {form.phone.length}/10
              </span>
            </div>
          </Field>
          <Field label="College / University" id="college" placeholder="IIT Delhi"
            value={form.college} onChange={set("college")} />
          <div className="sd-field">
            <label className="sd-field__label" htmlFor="year">Year of Study</label>
            <select id="year" className="sd-field__input" value={form.year} onChange={set("year")}>
              <option value="">Select year (optional)</option>
              {["1st Year","2nd Year","3rd Year","4th Year","Final Year","Post Graduate"].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="sd-btn sd-btn--ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
            <button type="submit" className="sd-btn sd-btn--primary" style={{ flex: 2, padding: "11px" }} disabled={loading}>
              {loading ? <Spinner /> : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <p style={{ textAlign: "center", marginTop: 18, fontSize: ".82rem", color: "#64748b" }}>
        Already have an account?{" "}
        <button type="button" onClick={() => onSwitch("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "#009fd4", fontWeight: 600, fontSize: ".82rem", padding: 0 }}>Sign in</button>
      </p>
    </>
  );
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
function ForgotForm({ onSwitch }) {
  return (
    <>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Reset password</h1>
      <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 24 }}>
        To reset your password, please contact our support team.
      </p>

      <div className="sd-alert sd-alert--info" style={{ marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>WhatsApp us at <strong>+91-8264796534</strong> or email <strong>projects@webxter.in</strong> and we'll reset your password within a few hours.</span>
      </div>

      <a href="https://wa.me/918264796534" target="_blank" rel="noopener noreferrer"
        className="sd-btn sd-btn--primary sd-btn--full" style={{ padding: "12px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
        WhatsApp Support
      </a>

      <p style={{ textAlign: "center", marginTop: 8, fontSize: ".82rem", color: "#64748b" }}>
        Remember it?{" "}
        <button type="button" onClick={() => onSwitch("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "#009fd4", fontWeight: 600, fontSize: ".82rem", padding: 0 }}>Sign in</button>
      </p>
    </>
  );
}

// ─── Main export — handles all 3 views ────────────────────────────────────────
export default function StudentAuth() {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get("mode") === "register" ? "register" : "login";
  // useState must always be called before any conditional return (Rules of Hooks)
  const [view, setView] = useState(initialView);

  // Already logged in — redirect to dashboard immediately
  if (isLoggedIn()) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <AuthCard>
      {view === "login"    && <LoginForm    onSwitch={setView} />}
      {view === "register" && <RegisterForm onSwitch={setView} />}
      {view === "forgot"   && <ForgotForm   onSwitch={setView} />}
    </AuthCard>
  );
}
