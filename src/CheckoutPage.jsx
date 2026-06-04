import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { addOrder } from "./admin/adminStore";
import { createOrderApi, getProjectsApi, validateCouponAnywhere } from "./student/StudentApi";
import { addAdminNotification, addStudentNotification } from "./notificationStore";
import "./CheckoutPage.css";

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_REPLACE_WITH_YOUR_KEY";

// ─── Load Razorpay script dynamically ────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, id, type = "text", placeholder, value, onChange, error, required, children }) {
  return (
    <div className="ck-field">
      <label className="ck-field__label" htmlFor={id}>
        {label}{required && <span className="ck-field__req"> *</span>}
      </label>
      {children || (
        <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
          className={`ck-field__input${error ? " ck-field__input--error" : ""}`} />
      )}
      {error && <p className="ck-field__error">{error}</p>}
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────
function CheckoutSummary({ cart, total, coupon, setCoupon, couponApplied, setCouponApplied, couponData, setCouponData, finalTotal }) {
  const [couponError,   setCouponError]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const savings      = cart.reduce((s, i) => s + ((i.originalPrice || i.price) - i.price), 0);
  const couponSaving = couponApplied && couponData ? couponData.discount : 0;

  const applyCoupon = async () => {
    if (!coupon.trim()) { setCouponError("Please enter a coupon code."); return; }
    setCouponLoading(true);
    setCouponError("");
    const result = await validateCouponAnywhere(coupon.trim(), total);
    setCouponLoading(false);
    if (result.valid) {
      setCouponApplied(true); setCouponData(result); setCouponError("");
    } else {
      setCouponError(result.error || "Invalid coupon code.");
      setCouponApplied(false); setCouponData(null);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false); setCouponData(null); setCoupon(""); setCouponError("");
  };

  return (
    <div className="ck-summary">
      <h2 className="ck-summary__title">Order Summary</h2>

      <div className="ck-summary__items">
        {cart.map((item) => (
          <div key={item.id} className="ck-summary__item">
            <div className="ck-summary__item-thumb">
              {(item.thumbnail || item.screenshots?.[0])
                ? <img src={item.thumbnail || item.screenshots[0]} alt={item.title} />
                : <div className="ck-summary__item-placeholder">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
              }
            </div>
            <div className="ck-summary__item-info">
              <span className="ck-summary__item-name">{item.title}</span>
              <div className="ck-summary__item-tags">
                {(item.tags || []).slice(0, 2).map((t) => <span key={t} className="ck-tag">{t}</span>)}
              </div>
            </div>
            <span className="ck-summary__item-price">₹{item.price.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>

      <div className="ck-divider" />

      {/* Coupon */}
      <div className="ck-coupon">
        <span className="ck-coupon__label">Have a coupon?</span>
        {couponApplied && couponData ? (
          <div className="ck-coupon__applied">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {couponData.coupon?.code || coupon.toUpperCase()} applied — saving ₹{couponData.discount.toLocaleString("en-IN")}!
            <button className="ck-coupon__remove" onClick={removeCoupon}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ) : (
          <>
            <div className="ck-coupon__row">
              <input type="text" placeholder="Enter coupon code" value={coupon}
                onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); }}
                className={`ck-coupon__input${couponError ? " ck-coupon__input--error" : ""}`}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }} />
              <button className="ck-btn ck-btn--outline ck-btn--sm" onClick={applyCoupon} type="button" disabled={couponLoading}>
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
            {couponError && <p className="ck-coupon__error">{couponError}</p>}
          </>
        )}
      </div>

      <div className="ck-divider" />

      {/* Totals */}
      <div className="ck-totals">
        <div className="ck-total-row">
          <span>Subtotal</span>
          <span>₹{cart.reduce((s, i) => s + (i.originalPrice || i.price), 0).toLocaleString("en-IN")}</span>
        </div>
        {savings > 0 && (
          <div className="ck-total-row ck-total-row--green">
            <span>Project discount</span>
            <span>−₹{savings.toLocaleString("en-IN")}</span>
          </div>
        )}
        {couponApplied && couponData && (
          <div className="ck-total-row ck-total-row--green">
            <span>Coupon ({couponData.coupon?.code || coupon.toUpperCase()})</span>
            <span>−₹{couponSaving.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="ck-divider" />
        <div className="ck-total-row ck-total-row--final">
          <span>Total</span>
          <span className="ck-total-val">₹{finalTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="ck-trust">
        {[
          { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "Secured by Razorpay" },
          { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, text: "Instant delivery after payment" },
          { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, text: "24/7 WhatsApp support" },
        ].map((t) => (
          <div key={t.text} className="ck-trust__item">
            <span className="ck-trust__icon">{t.icon}</span>{t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [coupon,        setCoupon]        = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponData,    setCouponData]    = useState(null);
  const [step,          setStep]          = useState("form");
  const [orderId,       setOrderId]       = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [submitError,   setSubmitError]   = useState("");

  const finalTotal = couponApplied && couponData
    ? Math.max(0, total - couponData.discount)
    : total;

  const [form, setForm] = useState({ name: "", email: "", phone: "", college: "", year: "" });
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Valid 10-digit phone required";
    return e;
  };

  // ── Create order in backend after successful Razorpay payment ──────────────
  const createBackendOrder = async (razorpayPaymentId) => {
    const studentToken = localStorage.getItem("wx_access");
    let lastOrderId = "";

    if (studentToken) {
      let projectList = [];
      try { projectList = await getProjectsApi(); } catch {}

      for (const item of cart) {
        const proj = projectList.find(
          (p) => p.title === item.title || String(p.id) === String(item.id)
        );
        const order = await createOrderApi({
          projectId:      proj?.id || null,
          projectTitle:   item.title,
          totalAmount:    item.originalPrice || item.price,
          finalAmount:    item.price,
          discountAmount: Math.max(0, (item.originalPrice || item.price) - item.price),
          couponCode:     couponApplied && couponData ? (couponData.coupon?.code || coupon.toUpperCase()) : "",
          notes:          `Razorpay Payment ID: ${razorpayPaymentId} | Phone: ${form.phone} | College: ${form.college || "—"}`,
        });
        lastOrderId = String(order.id);
      }
    } else {
      for (const item of cart) {
        const order = addOrder({
          customer:   form.name,
          email:      form.email,
          phone:      form.phone,
          college:    form.college || "",
          project:    item.title,
          amount:     item.price,
          payMethod:  "razorpay",
          couponUsed: couponApplied && couponData ? (couponData.coupon?.code || coupon.toUpperCase()) : null,
        });
        lastOrderId = order.id;
      }
    }
    return lastOrderId;
  };

  // ── Handle form submit → open Razorpay ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setSubmitError("");

    const loaded = await loadRazorpay();
    if (!loaded) {
      setSubmitError("Failed to load Razorpay. Please check your internet connection.");
      setSubmitting(false);
      return;
    }

    // Amount in paise (Razorpay requires smallest currency unit)
    const amountPaise = Math.round(finalTotal * 100);

    const options = {
      key:         RAZORPAY_KEY,
      amount:      amountPaise,
      currency:    "INR",
      name:        "Webxter",
      description: cart.map((i) => i.title).join(", "),
      image:       "https://www.webxter.in/favicon-extra-space.svg",
      prefill: {
        name:    form.name,
        email:   form.email,
        contact: form.phone,
      },
      notes: {
        college:    form.college || "",
        year:       form.year    || "",
        coupon:     couponApplied && couponData ? (couponData.coupon?.code || coupon) : "",
        projects:   cart.map((i) => i.title).join(", "),
      },
      theme: { color: "#009fd4" },

      handler: async (response) => {
        // Payment successful — create order in backend
        try {
          const oid = await createBackendOrder(response.razorpay_payment_id);
          setOrderId(oid || response.razorpay_payment_id);
          clearCart();

          // ── Fire notifications ──────────────────────────────────────────
          const projectNames = cart.map((i) => i.title).join(", ");
          const displayOid   = oid || response.razorpay_payment_id;

          // Admin: new order alert
          addAdminNotification({
            type:  "order_placed",
            title: `New order from ${form.name}`,
            body:  `₹${finalTotal.toLocaleString("en-IN")} · ${projectNames}`,
            link:  "/admin/orders",
          });

          // Student: purchase confirmation (if logged in)
          const studentEmail = form.email?.trim().toLowerCase();
          if (studentEmail) {
            addStudentNotification(studentEmail, {
              type:  "order_placed",
              title: "Order placed successfully!",
              body:  `Your order #${displayOid} for ${projectNames} is confirmed. We'll deliver within your window.`,
              link:  "/student/orders",
            });
          }
          // ── End notifications ───────────────────────────────────────────

          setStep("success");
        } catch (err) {
          setSubmitError("Payment received but order creation failed. Contact support with Payment ID: " + response.razorpay_payment_id);
        } finally {
          setSubmitting(false);
        }
      },

      modal: {
        ondismiss: () => {
          setSubmitting(false);
          setSubmitError("Payment was cancelled. Please try again.");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      setSubmitting(false);
      setSubmitError(`Payment failed: ${response.error.description}`);
    });
    rzp.open();
  };

  // ── Empty cart guard ───────────────────────────────────────────────────────
  if (cart.length === 0 && step !== "success") {
    return (
      <div className="ck-empty-state">
        <div className="ck-empty-state__icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h2>Your cart is empty</h2>
        <p>Add some projects before checking out.</p>
        <Link to="/" className="ck-btn ck-btn--primary ck-btn--lg">Browse Projects</Link>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="ck-success">
        <div className="ck-success__icon">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 className="ck-success__title">Payment Successful!</h1>
        {orderId && <div className="ck-success__order-id">Order ID: <strong>{orderId}</strong></div>}
        <p className="ck-success__sub">
          Thank you, <strong>{form.name}</strong>! Your payment was received.<br />
          We'll send the project files to <strong>{form.email}</strong> within your delivery window.
        </p>
        <div className="ck-success__steps">
          {[
            { n: "1", label: "Payment confirmed",       done: true  },
            { n: "2", label: "Order being processed",   done: false },
            { n: "3", label: "Files delivered to email", done: false },
          ].map((s) => (
            <div key={s.n} className={`ck-success__step ${s.done ? "ck-success__step--done" : ""}`}>
              <div className="ck-success__step-num">{s.done ? "✓" : s.n}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="ck-success__actions">
          <Link to="/student/orders" className="ck-btn ck-btn--primary ck-btn--lg">View My Orders</Link>
          <Link to="/" className="ck-btn ck-btn--ghost ck-btn--lg">Browse More Projects</Link>
        </div>
        <p className="ck-success__note">
          Questions? WhatsApp: <strong>+91-8264796534</strong> · Email: <strong>projects@webxter.in</strong>
        </p>
      </div>
    );
  }

  // ── Checkout form ──────────────────────────────────────────────────────────
  return (
    <div className="ck-page">
      <div className="ck-container">
        <div className="ck-header">
          <h1 className="ck-header__title">Checkout</h1>
          <nav className="ck-steps" aria-label="Checkout steps">
            <Link to="/cart" className="ck-step">1. Cart</Link>
            <span className="ck-step__sep">›</span>
            <span className="ck-step ck-step--active">2. Checkout</span>
            <span className="ck-step__sep">›</span>
            <span className="ck-step">3. Confirmation</span>
          </nav>
        </div>

        <div className="ck-layout">
          <form className="ck-form" onSubmit={handleSubmit} noValidate>

            {/* Section 1 — Contact */}
            <div className="ck-section">
              <h2 className="ck-section__title">
                <span className="ck-section__num">1</span>Contact Details
              </h2>
              <div className="ck-grid">
                <Field label="Full Name" id="name" placeholder="Rahul Sharma" value={form.name} onChange={set("name")} error={errors.name} required />
                <Field label="Email Address" id="email" type="email" placeholder="rahul@example.com" value={form.email} onChange={set("email")} error={errors.email} required />
                <Field label="Phone Number" id="phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set("phone")} error={errors.phone} required />
                <Field label="College / University" id="college" placeholder="IIT Delhi (optional)" value={form.college} onChange={set("college")} />
              </div>
            </div>

            {/* Section 2 — Student info */}
            <div className="ck-section">
              <h2 className="ck-section__title">
                <span className="ck-section__num">2</span>Student Info
                <span className="ck-section__opt"> (optional)</span>
              </h2>
              <div className="ck-grid">
                <Field label="Year of Study" id="year" value={form.year} onChange={set("year")}>
                  <select id="year" value={form.year} onChange={set("year")} className="ck-field__input">
                    <option value="">Select year</option>
                    {["1st Year","2nd Year","3rd Year","4th Year","Final Year","Post Graduate"].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* Section 3 — Payment */}
            <div className="ck-section">
              <h2 className="ck-section__title">
                <span className="ck-section__num">3</span>Payment
              </h2>

              {/* Razorpay info card */}
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "linear-gradient(135deg, #f0faff, #fdf0ff)",
                border: "1.5px solid rgba(0,159,212,.25)",
                borderRadius: 12, padding: "16px 18px",
                flexWrap: "wrap",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: "#072654", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#00BAF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: ".88rem", color: "#0f172a" }}>Pay securely with Razorpay</div>
                  <div style={{ fontSize: ".75rem", color: "#64748b", marginTop: 2 }}>
                    UPI · Cards · Net Banking · Wallets
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["UPI", "Visa", "MC", "NB"].map((m) => (
                    <span key={m} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 5, padding: "2px 7px", fontSize: ".65rem", fontWeight: 700, color: "#334155" }}>{m}</span>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: ".72rem", color: "#94a3b8", marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Your payment is 100% secure. We never store card details.
              </p>
            </div>

            {/* Error */}
            {submitError && (
              <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, padding: "11px 14px", color: "#dc2626", fontSize: ".8rem", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="ck-submit-btn" disabled={submitting}>
              {submitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "ck-spin .7s linear infinite", display: "inline-block" }} />
                  Opening Razorpay…
                </span>
              ) : (
                <>
                  Pay ₹{finalTotal.toLocaleString("en-IN")} with Razorpay
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </>
              )}
            </button>
            <style>{`@keyframes ck-spin { to { transform: rotate(360deg); } }`}</style>

            <p className="ck-terms">
              By placing this order you agree to our{" "}
              <a href="https://webxter.in/terms-of-service">Terms of Service</a> and{" "}
              <a href="https://webxter.in/privacy-policy">Privacy Policy</a>.
            </p>
          </form>

          <CheckoutSummary
            cart={cart} total={total}
            coupon={coupon} setCoupon={setCoupon}
            couponApplied={couponApplied} setCouponApplied={setCouponApplied}
            couponData={couponData} setCouponData={setCouponData}
            finalTotal={finalTotal}
          />
        </div>
      </div>
    </div>
  );
}
