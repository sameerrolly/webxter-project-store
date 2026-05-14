import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { addOrder, getSettings } from "./admin/adminStore";
import "./CheckoutPage.css";

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
function CheckoutSummary({ cart, total, coupon, setCoupon, couponApplied, setCouponApplied, finalTotal }) {
  const [couponError, setCouponError] = useState("");
  const settings = getSettings();
  const savings = cart.reduce((s, i) => s + (i.originalPrice - i.price), 0);
  const couponSaving = couponApplied ? Math.round(total * (settings.couponDiscount / 100)) : 0;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === settings.couponCode.toUpperCase()) {
      setCouponApplied(true); setCouponError("");
    } else {
      setCouponError(`Invalid code. Try ${settings.couponCode}`);
      setCouponApplied(false);
    }
  };

  return (
    <div className="ck-summary">
      <h2 className="ck-summary__title">Order Summary</h2>

      <div className="ck-summary__items">
        {cart.map((item) => (
          <div key={item.id} className="ck-summary__item">
            <div className="ck-summary__item-thumb">
              {item.screenshots?.[0]
                ? <img src={item.screenshots[0]} alt={item.title} />
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
        {couponApplied ? (
          <div className="ck-coupon__applied">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {settings.couponCode} applied — {settings.couponDiscount}% extra off!
            <button className="ck-coupon__remove" onClick={() => { setCouponApplied(false); setCoupon(""); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ) : (
          <>
            <div className="ck-coupon__row">
              <input type="text" placeholder={`e.g. ${settings.couponCode}`} value={coupon}
                onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                className={`ck-coupon__input${couponError ? " ck-coupon__input--error" : ""}`} />
              <button className="ck-btn ck-btn--outline ck-btn--sm" onClick={applyCoupon} type="button">Apply</button>
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
          <span>₹{cart.reduce((s, i) => s + i.originalPrice, 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="ck-total-row ck-total-row--green">
          <span>Project discount</span>
          <span>−₹{savings.toLocaleString("en-IN")}</span>
        </div>
        {couponApplied && (
          <div className="ck-total-row ck-total-row--green">
            <span>Coupon ({settings.couponCode})</span>
            <span>−₹{couponSaving.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="ck-divider" />
        <div className="ck-total-row ck-total-row--final">
          <span>Total</span>
          <span className="ck-total-val">₹{finalTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="ck-trust">
        {[
          { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "256-bit SSL encryption" },
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
  const settings = getSettings();

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [step, setStep] = useState("form");
  const [payMethod, setPayMethod] = useState("upi");
  const [orderId, setOrderId] = useState("");

  const finalTotal = couponApplied
    ? Math.round(total * (1 - settings.couponDiscount / 100))
    : total;

  const [form, setForm] = useState({ name: "", email: "", phone: "", college: "", year: "", upiId: "" });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Valid 10-digit phone required";
    if (payMethod === "upi" && !form.upiId.trim()) e.upiId = "UPI transaction ID is required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Save each cart item as a separate order in adminStore
    let lastOrderId = "";
    cart.forEach((item) => {
      const order = addOrder({
        customer: form.name,
        email: form.email,
        phone: form.phone,
        college: form.college || "",
        project: item.title,
        amount: item.price,
        payMethod,
        couponUsed: couponApplied ? settings.couponCode : null,
      });
      lastOrderId = order.id;
    });

    setOrderId(lastOrderId);
    clearCart();
    setStep("success");
  };

  // Empty cart guard
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

  // Success screen
  if (step === "success") {
    return (
      <div className="ck-success">
        <div className="ck-success__icon">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 className="ck-success__title">Order Placed!</h1>
        {orderId && <div className="ck-success__order-id">Order ID: <strong>{orderId}</strong></div>}
        <p className="ck-success__sub">
          Thank you, <strong>{form.name}</strong>! Your order has been received.<br />
          We'll send the project files to <strong>{form.email}</strong> within your delivery window.
        </p>
        <div className="ck-success__steps">
          {[
            { n: "1", label: "Order confirmed", done: true },
            { n: "2", label: "Payment verification", done: payMethod !== "upi" },
            { n: "3", label: "Files delivered to email", done: false },
          ].map((s) => (
            <div key={s.n} className={`ck-success__step ${s.done ? "ck-success__step--done" : ""}`}>
              <div className="ck-success__step-num">{s.done ? "✓" : s.n}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="ck-success__actions">
          <Link to="/" className="ck-btn ck-btn--primary ck-btn--lg">Browse More Projects</Link>
          <a href="https://webxter.in/contact" className="ck-btn ck-btn--ghost ck-btn--lg">Contact Support</a>
        </div>
        <p className="ck-success__note">
          Questions? WhatsApp: <strong>+91-8264796534</strong> · Email: <strong>projects@webxter.in</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="ck-page">
      <div className="ck-container">
        {/* Header + steps */}
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
          {/* ── Left: Form ── */}
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
                <span className="ck-section__num">3</span>Payment Method
              </h2>

              <div className="ck-pay-methods">
                {[
                  { id: "upi", label: "UPI / GPay / PhonePe",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
                  { id: "whatsapp", label: "Pay via WhatsApp",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                  { id: "bank", label: "Bank Transfer / NEFT",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg> },
                ].map((m) => (
                  <label key={m.id} className={`ck-pay-method${payMethod === m.id ? " ck-pay-method--active" : ""}`}>
                    <input type="radio" name="payMethod" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} />
                    <span className="ck-pay-method__icon">{m.icon}</span>
                    <span className="ck-pay-method__label">{m.label}</span>
                    {payMethod === m.id && (
                      <span className="ck-pay-method__check">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {payMethod === "upi" && (
                <div className="ck-pay-detail">
                  <div className="ck-upi-box">
                    <div className="ck-upi-box__label">Send payment to UPI ID</div>
                    <div className="ck-upi-box__id">webxter@upi</div>
                    <div className="ck-upi-box__note">After payment, enter your transaction ID below</div>
                  </div>
                  <Field label="UPI Transaction ID" id="upiId" placeholder="e.g. 123456789012" value={form.upiId} onChange={set("upiId")} error={errors.upiId} required />
                </div>
              )}

              {payMethod === "whatsapp" && (
                <div className="ck-info-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  After placing the order, our team will contact you on WhatsApp at <strong>+91-8264796534</strong> to complete the payment.
                </div>
              )}

              {payMethod === "bank" && (
                <div className="ck-info-box">
                  <div className="ck-bank-table">
                    {[["Account Name","Webxter Solutions"],["Account No.","XXXX XXXX XXXX"],["IFSC","XXXXXXXX"],["Bank","HDFC Bank"]].map(([k,v]) => (
                      <div key={k} className="ck-bank-table__row">
                        <span>{k}</span><strong>{v}</strong>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 10, fontSize: ".8rem", color: "#64748b" }}>Share the transfer screenshot on WhatsApp after payment.</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="ck-submit-btn">
              Place Order — ₹{finalTotal.toLocaleString("en-IN")}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>

            <p className="ck-terms">
              By placing this order you agree to our{" "}
              <a href="https://webxter.in/terms-of-service">Terms of Service</a> and{" "}
              <a href="https://webxter.in/privacy-policy">Privacy Policy</a>.
            </p>
          </form>

          {/* ── Right: Summary ── */}
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
