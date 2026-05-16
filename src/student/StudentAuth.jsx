import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  studentLogin, studentRegister,
  requestPasswordReset, verifyOtpAndReset,
  DEMO_USERS,
} from "./studentStore";
import "./student.css";

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
          <img alt="Webxter" width="108" height="22" loading="lazy"
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
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: "" })); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setTimeout(() => {
      const result = studentLogin(form.email, form.password);
      setLoading(false);
      if (result.success) navigate("/student/dashboard");
      else setErrors({ [result.field || "password"]: result.error });
    }, 500);
  };

  const fillDemo = (user) => setForm({ email: user.email, password: user.password });

  return (
    <>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Welcome back</h1>
      <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 24 }}>Sign in to your student dashboard</p>

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

      {/* Demo accounts */}
      <div style={{ background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>
          Demo Accounts — click to fill
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {DEMO_USERS.map((u) => (
            <button key={u.email} type="button" onClick={() => fillDemo(u)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "border-color .15s", fontFamily: "inherit" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#009fd4"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(45deg,#009fd4,#ff6eff)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: ".75rem", flexShrink: 0 }}>
                {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: ".82rem", color: "#0f172a" }}>{u.name}</div>
                <div style={{ fontSize: ".72rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
              </div>
              <div style={{ fontSize: ".7rem", color: "#009fd4", fontWeight: 600, flexShrink: 0 }}>Use →</div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: ".72rem", color: "#94a3b8", marginTop: 8 }}>Password for all demo accounts: <strong style={{ color: "#334155" }}>Student@123</strong></p>
      </div>

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
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = basic, 2 = details

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: "" })); };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      const result = studentRegister(form);
      setLoading(false);
      if (result.success) navigate("/student/dashboard");
      else setErrors({ email: result.error });
    }, 500);
  };

  return (
    <>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Create account</h1>
      <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 20 }}>Join Webxter Student Portal</p>

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
  const [step, setStep] = useState("email"); // "email" | "otp" | "done"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      const result = requestPasswordReset(email);
      setLoading(false);
      if (result.success) {
        setDemoOtp(result.otp);
        setInfo(result.message);
        setStep("otp");
      } else setError(result.error);
    }, 500);
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP"); return; }
    if (!newPw || newPw.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      const result = verifyOtpAndReset(email, otp, newPw);
      setLoading(false);
      if (result.success) setStep("done");
      else setError(result.error);
    }, 500);
  };

  if (step === "done") return (
    <>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#f0faff,#fdf0ff)", border: "2px solid rgba(0,159,212,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#009fd4" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a", marginBottom: 8 }}>Password Reset!</h2>
        <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 20 }}>Your password has been updated successfully.</p>
        <button className="sd-btn sd-btn--primary sd-btn--full" onClick={() => onSwitch("login")} style={{ padding: "12px" }}>Sign In Now</button>
      </div>
    </>
  );

  return (
    <>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Reset password</h1>
      <p style={{ fontSize: ".875rem", color: "#64748b", marginBottom: 24 }}>
        {step === "email" ? "Enter your email to receive a reset OTP." : "Enter the OTP and your new password."}
      </p>

      {step === "email" ? (
        <form onSubmit={handleRequestOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
          <Field label="Email Address" id="reset-email" type="email" placeholder="rahul@example.com"
            value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} error={error} required autoFocus />
          <button type="submit" className="sd-btn sd-btn--primary sd-btn--full" style={{ padding: "12px" }} disabled={loading}>
            {loading ? <Spinner /> : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
          {info && (
            <div className="sd-alert sd-alert--info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{info}</span>
            </div>
          )}
          {demoOtp && (
            <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 8, padding: "10px 14px", fontSize: ".82rem", color: "#92400e" }}>
              <strong>Demo OTP:</strong> <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 800, letterSpacing: 2 }}>{demoOtp}</span>
              <button type="button" onClick={() => setOtp(demoOtp)} style={{ marginLeft: 10, background: "none", border: "none", cursor: "pointer", color: "#009fd4", fontSize: ".78rem", fontWeight: 600 }}>Fill →</button>
            </div>
          )}
          <div className="sd-field">
            <label className="sd-field__label">6-Digit OTP</label>
            <input type="text" className="sd-field__input" placeholder="123456" maxLength={6}
              value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
              style={{ fontFamily: "monospace", fontSize: "1.2rem", letterSpacing: 4, textAlign: "center" }} autoFocus />
          </div>
          <div>
            <Field label="New Password" id="new-pw" type="password" placeholder="Min. 8 characters"
              value={newPw} onChange={(e) => { setNewPw(e.target.value); setError(""); }} />
            <PasswordStrength password={newPw} />
          </div>
          <Field label="Confirm New Password" id="confirm-pw" type="password" placeholder="Re-enter password"
            value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setError(""); }} />
          {error && <p style={{ fontSize: ".78rem", color: "#ef4444" }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="sd-btn sd-btn--ghost" style={{ flex: 1 }} onClick={() => setStep("email")}>← Back</button>
            <button type="submit" className="sd-btn sd-btn--primary" style={{ flex: 2, padding: "11px" }} disabled={loading}>
              {loading ? <Spinner /> : "Reset Password"}
            </button>
          </div>
        </form>
      )}

      <p style={{ textAlign: "center", marginTop: 18, fontSize: ".82rem", color: "#64748b" }}>
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
  const [view, setView] = useState(initialView);

  return (
    <AuthCard>
      {view === "login"    && <LoginForm    onSwitch={setView} />}
      {view === "register" && <RegisterForm onSwitch={setView} />}
      {view === "forgot"   && <ForgotForm   onSwitch={setView} />}
    </AuthCard>
  );
}
