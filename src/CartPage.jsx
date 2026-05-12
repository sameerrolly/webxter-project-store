import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./CartPage.css";

// ─── Cart Item Row ────────────────────────────────────────────────────────────
function CartItem({ item, onRemove }) {
  const disc = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
  return (
    <div className="cp-item">
      <div className="cp-item__thumb">
        {item.screenshots && item.screenshots[0] ? (
          <img src={item.screenshots[0]} alt={item.title} />
        ) : (
          <div className="cp-item__thumb-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}
      </div>

      <div className="cp-item__info">
        <Link to={`/projects/${item.slug}`} className="cp-item__title">{item.title}</Link>
        <div className="cp-item__tags">
          {item.tags.map((t) => <span key={t} className="cp-tag">{t}</span>)}
        </div>
        <div className="cp-item__meta">
          <span className="cp-item__level">{item.level}</span>
          <span className="cp-item__delivery">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {item.delivery}
          </span>
        </div>
      </div>

      <div className="cp-item__right">
        <div className="cp-item__price-block">
          <span className="cp-item__price">₹{item.price.toLocaleString("en-IN")}</span>
          <span className="cp-item__original">₹{item.originalPrice.toLocaleString("en-IN")}</span>
          <span className="cp-item__disc">{disc}% OFF</span>
        </div>
        <button className="cp-item__remove" onClick={() => onRemove(item.id)} aria-label="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────
function OrderSummary({ cart, total }) {
  const navigate = useNavigate();
  const savings = cart.reduce((s, i) => s + (i.originalPrice - i.price), 0);

  return (
    <div className="cp-summary">
      <h2 className="cp-summary__title">Order Summary</h2>

      <div className="cp-summary__rows">
        {cart.map((item) => (
          <div key={item.id} className="cp-summary__row">
            <span className="cp-summary__row-name">{item.title}</span>
            <span className="cp-summary__row-price">₹{item.price.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>

      <div className="cp-summary__divider" />

      <div className="cp-summary__row cp-summary__row--savings">
        <span>You save</span>
        <span className="cp-summary__savings">₹{savings.toLocaleString("en-IN")}</span>
      </div>
      <div className="cp-summary__row cp-summary__row--total">
        <span>Total</span>
        <span className="cp-summary__total">₹{total.toLocaleString("en-IN")}</span>
      </div>

      <button className="cp-btn cp-btn--primary cp-btn--full cp-btn--lg" onClick={() => navigate("/checkout")}>
        Proceed to Checkout
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </button>

      <Link to="/" className="cp-btn cp-btn--ghost cp-btn--full" style={{ marginTop: 10 }}>
        ← Continue Shopping
      </Link>

      <div className="cp-summary__trust">
        {[
          { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: "Secure checkout" },
          { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, text: "Instant delivery" },
          { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, text: "24/7 support" },
        ].map((t) => (
          <div key={t.text} className="cp-trust-item">
            <span className="cp-trust-item__icon">{t.icon}</span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Cart Page ───────────────────────────────────────────────────────────
export default function CartPage() {
  const { cart, removeFromCart, total } = useCart();

  return (
    <div className="cp-page">
      <div className="cp-container">
        <div className="cp-header">
          <h1 className="cp-header__title">
            Your Cart
            {cart.length > 0 && (
              <span className="cp-header__count">{cart.length} item{cart.length > 1 ? "s" : ""}</span>
            )}
          </h1>
          <nav className="cp-steps">
            <span className="cp-step cp-step--active">1. Cart</span>
            <span className="cp-step__sep">›</span>
            <span className="cp-step">2. Checkout</span>
            <span className="cp-step__sep">›</span>
            <span className="cp-step">3. Confirmation</span>
          </nav>
        </div>

        {cart.length === 0 ? (
          <div className="cp-empty">
            <div className="cp-empty__icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <h2>Your cart is empty</h2>
            <p>Browse our projects and add something you like.</p>
            <Link to="/" className="cp-btn cp-btn--primary cp-btn--lg">Browse Projects</Link>
          </div>
        ) : (
          <div className="cp-layout">
            <div className="cp-items">
              {cart.map((item) => (
                <CartItem key={item.id} item={item} onRemove={removeFromCart} />
              ))}
            </div>
            <OrderSummary cart={cart} total={total} />
          </div>
        )}
      </div>
    </div>
  );
}
