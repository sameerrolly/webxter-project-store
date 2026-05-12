import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "./CartContext";
import "./Layout.css";

// ─── Shared SVG icons ─────────────────────────────────────────────────────────
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

// ─── Logo ─────────────────────────────────────────────────────────────────────
function SiteLogo({ size = "navbar" }) {
  const isFooter = size === "footer";
  return (
    <a className={`layout-logo layout-logo--${size}`} href="https://webxter.in">
      <video muted autoPlay loop playsInline
        width={isFooter ? 70 : 50} height={50}>
        <source src="https://www.webxter.in/webxter-preloader.mp4" type="video/mp4" />
        <img alt="logo" loading="lazy" width={isFooter ? 70 : 50} height={50} decoding="async"
          src="https://www.webxter.in/favicon-extra-space.svg" style={{ color: "transparent" }} />
      </video>
      <img
        alt="Webxter" loading="lazy"
        width={isFooter ? 200 : 120} height={25} decoding="async"
        srcSet={
          isFooter
            ? "https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75 1x, https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=640&q=75 2x"
            : "https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=128&q=75 1x, https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75 2x"
        }
        src={
          isFooter
            ? "https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=640&q=75"
            : "https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75"
        }
        style={{ color: "transparent" }}
      />
    </a>
  );
}

// ─── Mobile Sidebar ───────────────────────────────────────────────────────────
function MobileSidebar({ open, onClose }) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      {open && <div className="layout-backdrop" onClick={onClose} aria-hidden="true" />}
      <div role="dialog" aria-label="Navigation menu"
        className={`layout-sidebar ${open ? "layout-sidebar--open" : "layout-sidebar--closed"}`}
        tabIndex={-1}>
        <nav className="layout-sidebar__nav">
          {/* Logo */}
          <a className="layout-sidebar__logo" href="https://webxter.in">
            <video autoPlay loop playsInline muted width="50" height="50">
              <source src="https://www.webxter.in/webxter-preloader.mp4" type="video/mp4" />
              <img alt="logo" loading="lazy" width="50" height="50" decoding="async"
                src="https://www.webxter.in/favicon-extra-space.svg" style={{ color: "transparent" }} />
            </video>
            <img alt="Webxter" loading="lazy" width="120" height="25" decoding="async"
              srcSet="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=128&q=75 1x, https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75 2x"
              src="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75"
              style={{ color: "transparent" }} />
          </a>

          {/* Links */}
          <div className="layout-sidebar__links">
            <div className="layout-sidebar__dropdown-row">
              <button className="layout-sidebar__dropdown-btn">
                Services
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
            <a className="layout-sidebar__link" href="https://webxter.in/careers">Careers</a>
            <a className="layout-sidebar__link" href="https://webxter.in/courses">Courses</a>
            <Link className="layout-sidebar__link layout-sidebar__link--active" to="/" onClick={onClose}>Projects</Link>
            <a className="layout-sidebar__link" href="https://student.webxter.in">Student Portal</a>
            <a className="layout-sidebar__link" href="https://webxter.in/verify-certificate">Verify</a>
            <a className="layout-sidebar__link" href="https://webxter.in/blogs">Blogs</a>
            <a className="layout-sidebar__link" href="https://webxter.in/about">About</a>
            <div className="layout-sidebar__dropdown-row">
              <button className="layout-sidebar__dropdown-btn">
                More
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="layout-sidebar__actions">
            <button className="layout-sidebar__btn-outline">
              <a href="https://webxter.in/login">Sign In</a>
            </button>
            <button className="layout-sidebar__btn-primary">Apply Now</button>
          </div>
        </nav>

        {/* Close */}
        <button type="button" className="layout-sidebar__close" onClick={onClose} aria-label="Close menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { cart } = useCart();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Marquee */}
      <div className="layout-marquee" aria-hidden="true">
        <div className="layout-marquee__track">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} className="layout-marquee__item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              20% OFF for Final Year Students!
            </span>
          ))}
        </div>
      </div>

      <nav className="layout-navbar">
        <div className="layout-container layout-navbar__inner">
          <SiteLogo size="navbar" />

          {/* Desktop links */}
          <div className="layout-navbar__links">
            <a href="https://webxter.in/courses" className={isActive("/courses") ? "layout-active" : ""}>Courses</a>
            <Link to="/" className={isActive("/") ? "layout-active" : ""}>Projects</Link>
            <a href="https://webxter.in/about">About</a>
            <a href="https://webxter.in/contact">Contact</a>
          </div>

          {/* Desktop actions */}
          <div className="layout-navbar__actions">
            <Link to="/cart" className="layout-navbar__cart" aria-label={`Cart (${cart.length} items)`}>
              <CartIcon />
              {cart.length > 0 && <span className="layout-navbar__cart-count">{cart.length}</span>}
            </Link>
            <a href="https://webxter.in/login" className="layout-btn layout-btn--ghost">Sign In</a>
            <a href="https://webxter.in/contact" className="layout-btn layout-btn--primary">Get Quote</a>
          </div>

          {/* Mobile actions */}
          <div className="layout-navbar__mobile-actions">
            <Link to="/cart" className="layout-navbar__cart" aria-label="Cart">
              <CartIcon />
              {cart.length > 0 && <span className="layout-navbar__cart-count">{cart.length}</span>}
            </Link>
            <button className="layout-navbar__hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="layout-footer">
      <div className="layout-container">
        <div className="layout-footer__grid">

          {/* Brand */}
          <div className="layout-footer__brand">
            <SiteLogo size="footer" />
            <p className="layout-footer__tagline">
              Empowering individuals through quality education and innovative learning experiences since 2010.
            </p>
            <div className="layout-footer__contact">
              {[
                {
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
                  text: "info@webxter.in"
                },
                {
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                  text: "+91 (826) 479-6534"
                },
                {
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>,
                  text: "Building D900, Second Floor, Ranjit Avenue, Amritsar, Punjab, India - 143001"
                },
                {
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>,
                  text: "Business Village, Port saeed, Deira, Dubai, UAE"
                },
              ].map((row, i) => (
                <div key={i} className="layout-footer__contact-row">
                  <span className="layout-footer__contact-icon">{row.icon}</span>
                  <span>{row.text}</span>
                </div>
              ))}
            </div>
            <div className="layout-footer__social">
              <span className="layout-footer__social-label">Follow us on</span>
              <a href="https://www.instagram.com/webxter_webs/" className="layout-footer__social-link" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/webxter/" className="layout-footer__social-link" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect width="4" height="12" x="2" y="9"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="layout-footer__links">
            <h3 className="layout-footer__col-title">Quick Links</h3>
            <ul className="layout-footer__link-list">
              <li><a href="https://webxter.in/about">About Us</a></li>
              <li><Link to="/">Projects</Link></li>
              <li><a href="https://webxter.in/courses">Courses</a></li>
              <li><a href="https://student.webxter.in" target="_blank" rel="noopener noreferrer">Student Portal</a></li>
              <li><a href="https://webxter.in/contact">Contact</a></li>
              <li><a href="https://webxter.in/blogs">Blogs</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="layout-footer__links">
            <h3 className="layout-footer__col-title">Resources</h3>
            <ul className="layout-footer__link-list">
              <li><a href="https://webxter.in/terms-of-service">Terms of Service</a></li>
              <li><a href="https://webxter.in/privacy-policy">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="layout-footer__newsletter">
            <h3 className="layout-footer__col-title">Subscribe to Our Newsletter</h3>
            <p className="layout-footer__newsletter-desc">
              Stay updated with the latest courses, events, and educational resources.
            </p>
            <form className="layout-footer__newsletter-form" onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}>
              {subscribed ? (
                <div className="layout-footer__newsletter-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Thanks for subscribing!
                </div>
              ) : (
                <div className="layout-footer__newsletter-input-wrap">
                  <input type="email" placeholder="Enter your email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="layout-footer__newsletter-input" />
                  <button type="submit" className="layout-footer__newsletter-btn" aria-label="Subscribe">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              )}
              <p className="layout-footer__newsletter-note">
                By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
              </p>
            </form>
          </div>
        </div>

        <div className="layout-footer__divider" />

        <div className="layout-footer__bottom">
          <p>© 2026 Webxter. All rights reserved. ISO 9001:2015 Certified</p>
          <div className="layout-footer__bottom-links">
            <a href="https://webxter.in/terms-of-service">Terms of Service</a>
            <a href="https://webxter.in/privacy-policy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Cart FAB (floating, shown on all pages except /cart & /checkout) ─────────
export function CartFAB() {
  const { cart, toast } = useCart();
  const location = useLocation();
  const hide = ["/cart", "/checkout"].includes(location.pathname);
  if (hide) return null;

  return (
    <>
      <Link to="/cart" className="layout-cart-fab" aria-label="View cart">
        <CartIcon />
        {cart.length > 0 && <span className="layout-cart-fab__count">{cart.length}</span>}
      </Link>
      {toast && <div className="layout-toast">{toast}</div>}
    </>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  return (
    <div className="layout-page">
      <Navbar />
      <main className="layout-main">{children}</main>
      <Footer />
      <CartFAB />
    </div>
  );
}
