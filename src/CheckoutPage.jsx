import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./CheckoutPage.css";

// ─── Field component ─────────────────────────────────────────────────────────
function Field({ label, id, type = "text", placeholder, value, onChange, error, required, children }) {
  return (
    <div className="ck-field">
      <label className="ck-field__label" htmlFor={id}>
        {label}{required && <span className="ck-field__req">*</span>}
      </label>
      {children || (
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={onChange}
          className={`ck-field__input ${error ? "ck-field__input--error" : ""}`}
        />
      )}
      {error && <p className="ck-field__error">{error}</p>}
    </div>
  );
}

// ─── Order summary panel ──────────────────────────────────────────────────────
function CheckoutSummary({ cart, total, coupon, setCoupon, couponApplied, setCouponApplied, finalTotal }) {
  const [couponError, setCouponError] = useState("");
  const savings = cart.reduce((s, i) => s + (i.originalPrice - i.price), 0);
  const couponSaving = couponApplied ? Math.round(total * 0.2) : 0;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "STUDENT20") {
      setCouponApplied(true); setCouponError("");
    } else {
      setCouponError("Invalid code. Try STUDENT20"); setCouponApplied(false);
    }
  };

  return (
    <div className="ck-summary">
      <h2 className="ck-summary__title">Order Summary</h2>

      {/* Items */}
      <div className="ck-summary__items">
        {cart.map((item) => (
          <div key={item.id} className="ck-summary__item">
            <div className="ck-summary__item-thumb">
              {item.screenshots?.[0]
                ? <img src={item.screenshots[0]} alt={item.title} />
                : <div className="ck-summary__item-placeholder">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  </div>
              }
            </div>
            <div className="ck-summary__item-info">
              <span className="ck-summary__item-name">{item.title}</span>
              <div className="ck-summary__item-tags">
                {item.tags.slice(0, 2).map((t) => <span key={t} className="ck-tag">{t}</span>)}
              </div>
            </div>
            <span className="ck-summary__item-price">₹{item.price.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>

      <div className="ck-summary__divider" />

      {/* Coupon */}
      <div className="ck-coupon">
        <label className="ck-coupon__label">Coupon Code</label>
        {couponApplied ? (
          <div className="ck-coupon__applied">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            STUDENT20 applied — 20% extra off!
            <button className="ck-coupon__remove" onClick={() => { setCouponApplied(false); setCoupon(""); }}>✕</button>
          </div>
        ) : (
          <>
            <div className="ck-coupon__row">
              <input
                type="text" placeholder="Enter code (e.g. STUDENT20)"
                value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                className={`ck-coupon__input ${couponError ? "ck-coupon__input--error" : ""}`}
              />
              <button className="ck-btn ck-btn--outline ck-btn--sm" onClick={applyCoupon}>Apply</button>
            </div>
            {couponError && <p className="ck-coupon__error">{couponError}</p>}
          </>
        )}
      </div>

      <div className="ck-summary__divider" />

      {/* Totals */}
      <div className="ck-summary__totals">
        <div className="ck-summary__row">
          <span>Subtotal</span>
          <span>₹{cart.reduce((s, i) => s + i.originalPrice, 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="ck-summary__row ck-summary__row--green">
          <span>Project discount</span>
          <span>−₹{savings.toLocaleString("en-IN")}</span>
        </div>
        {couponApplied && (
          <div className="ck-summary__row ck-summary__row--green">
            <span>Coupon (STUDENT20)</span>
            <span>−₹{couponSaving.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="ck-summary__divider" />
        <div className="ck-summary__row ck-summary__row--total">
          <span>Total</span>
          <span className="ck-summary__total-val">₹{finalTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="ck-trust">
        {[
          {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
            text: "256-bit SSL encryption"
          },
          {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
            text: "Instant delivery after payment"
          },
          {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
            text: "24/7 WhatsApp support"
          },
        ].map((t) => (
          <div key={t.text} className="ck-trust__item">
            <span className="ck-trust__item-icon">{t.icon}</span> {t.text}
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

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "success"
  const [payMethod, setPayMethod] = useState("upi");

  const finalTotal = couponApplied ? Math.round(total * 0.8) : total;

  const [form, setForm] = useState({
    name: "", email: "", phone: "", college: "", year: "", upiId: "",
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Valid 10-digit phone required";
    if (payMethod === "upi" && !form.upiId.trim()) e.upiId = "UPI ID is required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep("success");
    clearCart();
  };

  if (cart.length === 0 && step !== "success") {
    return (
      <div className="ck-container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 16 }}>Your cart is empty</h2>
        <Link to="/" className="ck-btn ck-btn--primary">Browse Projects</Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="ck-success">
        <div className="ck-success__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 className="ck-success__title">Order Placed!</h1>
        <p className="ck-success__sub">
          Thank you, <strong>{form.name || "Student"}</strong>! Your order has been received.<br />
          We'll send the project files to <strong>{form.email}</strong> within your delivery window.
        </p>
        <div className="ck-success__actions">
          <Link to="/" className="ck-btn ck-btn--primary ck-btn--lg">Browse More Projects</Link>
          <a href="https://webxter.in/contact" className="ck-btn ck-btn--ghost ck-btn--lg">Contact Support</a>
        </div>
        <p className="ck-success__note">
          Questions? WhatsApp us at <strong>+91-8264796534</strong> or email <strong>projects@webxter.in</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="ck-page">
      <div className="ck-container">
        {/* Header */}
        <div className="ck-header">
          <h1 className="ck-header__title">Checkout</h1>
          <nav className="ck-steps">
            <Link to="/cart" className="ck-step">1. Cart</Link>
            <span className="ck-step__sep">›</span>
            <span className="ck-step ck-step--active">2. Checkout</span>
            <span className="ck-step__sep">›</span>
            <span className="ck-step">3. Confirmation</span>
          </nav>
        </div>

        <div className="ck-layout">
          {/* ── Form ── */}
          <form className="ck-form" onSubmit={handleSubmit} noValidate>

            {/* Contact */}
            <div className="ck-form__section">
              <h2 className="ck-form__section-title">
                <span className="ck-form__section-num">1</span> Contact Details
              </h2>
              <div className="ck-form__grid">
                <Field label="Full Name" id="name" placeholder="Rahul Sharma" value={form.name} onChange={set("name")} error={errors.name} required />
                <Field label="Email Address" id="email" type="email" placeholder="rahul@example.com" value={form.email} onChange={set("email")} error={errors.email} required />
                <Field label="Phone Number" id="phone" type="tel" placeholder="9876543210" value={form.phone} onChange={set("phone")} error={errors.phone} required />
                <Field label="College / University" id="college" placeholder="IIT Delhi (optional)" value={form.college} onChange={set("college")} />
              </div>
            </div>

            {/* Student info */}
            <div className="ck-form__section">
              <h2 className="ck-form__section-title">
                <span className="ck-form__section-num">2</span> Student Info
                <span className="ck-form__section-opt">(optional — for extra discount)</span>
              </h2>
              <div className="ck-form__grid">
                <Field label="Year of Study" id="year" value={form.year} onChange={set("year")}>
                  <select id="year" value={form.year} onChange={set("year")} className="ck-field__input">
                    <option value="">Select year</option>
                    {["1st Year","2nd Year","3rd Year","4th Year","Final Year","Post Graduate"].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* Payment */}
            <div className="ck-form__section">
              <h2 className="ck-form__section-title">
                <span className="ck-form__section-num">3</span> Payment Method
              </h2>

              <div className="ck-pay-methods">
                {[
                  {
                    id: "upi", label: "UPI / GPay / PhonePe",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  },
                  {
                    id: "whatsapp", label: "Pay via WhatsApp",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  },
                  {
                    id: "bank", label: "Bank Transfer / NEFT",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                  },
                ].map((m) => (
                  <label key={m.id} className={`ck-pay-method ${payMethod === m.id ? "ck-pay-method--active" : ""}`}>
                    <input type="radio" name="payMethod" value={m.id}
                      checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} />
                    <span className="ck-pay-method__icon">{m.icon}</span>
                    <span className="ck-pay-method__label">{m.label}</span>
                  </label>
                ))}
              </div>

              {payMethod === "upi" && (
                <div className="ck-pay-detail">
                  <div className="ck-upi-info">
                    <p>Send payment to UPI ID: <strong className="ck-upi-id">webxter@upi</strong></p>
                    <p className="ck-upi-note">After payment, enter your UPI transaction ID below.</p>
                  </div>
                  <Field label="UPI Transaction ID" id="upiId" placeholder="e.g. 123456789012" value={form.upiId} onChange={set("upiId")} error={errors.upiId} required />
                </div>
              )}

              {payMethod === "whatsapp" && (
                <div className="ck-pay-detail ck-pay-detail--info">
                  <p>After placing the order, our team will contact you on WhatsApp at <strong>+91-8264796534</strong> to complete the payment.</p>
                </div>
              )}

              {payMethod === "bank" && (
                <div className="ck-pay-detail ck-pay-detail--info">
                  <div className="ck-bank-details">
                    <div><span>Account Name</span><strong>Webxter Solutions</strong></div>
                    <div><span>Account No.</span><strong>XXXX XXXX XXXX</strong></div>
                    <div><span>IFSC</span><strong>XXXXXXXX</strong></div>
                    <div><span>Bank</span><strong>HDFC Bank</strong></div>
                  </div>
                  <p className="ck-upi-note">Share the transfer screenshot on WhatsApp after payment.</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="ck-btn ck-btn--primary ck-btn--full ck-btn--lg ck-submit">
              Place Order — ₹{finalTotal.toLocaleString("en-IN")}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>

            <p className="ck-form__terms">
              By placing this order you agree to our{" "}
              <a href="https://webxter.in/terms-of-service">Terms of Service</a> and{" "}
              <a href="https://webxter.in/privacy-policy">Privacy Policy</a>.
            </p>
          </form>

          {/* ── Summary ── */}
          <CheckoutSummary
            cart={cart} total={total}
            coupon={coupon} setCoupon={setCoupon}
            couponApplied={couponApplied} setCouponApplied={setCouponApplied}
            finalTotal={finalTotal}
          />
        </div>
      </div>
    </div>
  );
}
