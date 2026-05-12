import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./ProjectDetailPage.css";

// ─── Shared project data (single source of truth) ────────────────────────────
export const PROJECTS = [
  {
    id: 1, slug: "library-management-system",
    title: "Library Management System",
    description: "Complete library management with book tracking, member management, and automated fine calculation. Built with a modern stack and ready for deployment.",
    longDesc: "This project covers the full lifecycle of a library — from cataloguing books and managing members to issuing/returning books and auto-calculating fines. Comes with an admin dashboard, search & filter, and detailed reports.",
    category: "Web Development",
    tags: ["React", "Django", "PostgreSQL"],
    level: "Intermediate", delivery: "1 week",
    originalPrice: 15000, price: 9999,
    features: ["Book Catalog", "Member Management", "Issue/Return System", "Fine Calculation"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    screenshots: [], badge: "Popular",
  },
  {
    id: 2, slug: "hardware-store-management",
    title: "Hardware Store Management",
    description: "Inventory management system for hardware stores with billing and stock tracking.",
    longDesc: "Manage your hardware store inventory end-to-end. Track stock levels, generate bills, manage suppliers, and get low-stock alerts. Includes a clean POS-style billing interface.",
    category: "Web Development",
    tags: ["Next.js", "Django", "MySQL"],
    level: "Advanced", delivery: "1 week",
    originalPrice: 19000, price: 14999,
    features: ["Inventory Tracking", "Billing System", "Supplier Management", "Reports"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    screenshots: [], badge: null,
  },
  {
    id: 3, slug: "code-collaboration-platform",
    title: "Code Collaboration Platform",
    description: "Real-time code sharing and collaboration platform with version control.",
    longDesc: "A GitHub-meets-CodePen platform where teams can write, share, and review code in real time. Includes live cursors, inline comments, version history, and a built-in chat.",
    category: "Web Development",
    tags: ["React", "Node.js", "Socket.io"],
    level: "Advanced", delivery: "2–3 weeks",
    originalPrice: 25000, price: 14999,
    features: ["Real-time Editing", "Version Control", "Chat System", "Project Management"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    screenshots: [], badge: "Hot",
  },
  {
    id: 4, slug: "hospital-management-system",
    title: "Hospital Management System",
    description: "Comprehensive hospital management with patient records, appointments, and billing.",
    longDesc: "A full-featured HMS covering patient registration, doctor scheduling, OPD/IPD management, pharmacy, and billing. Role-based access for admin, doctors, and staff.",
    category: "Web Development",
    tags: ["Django", "React", "PostgreSQL"],
    level: "Advanced", delivery: "1 week",
    originalPrice: 19000, price: 14999,
    features: ["Patient Records", "Appointment System", "Billing", "Doctor Management"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    screenshots: [], badge: null, soldOut: true,
  },
  {
    id: 5, slug: "inventory-management-system",
    title: "Inventory Management System",
    description: "Advanced inventory tracking with analytics, alerts, and multi-location support.",
    longDesc: "Track stock across multiple warehouses, set reorder alerts, scan barcodes, and generate analytics dashboards. Integrates with popular e-commerce platforms.",
    category: "Web Development",
    tags: ["React", "Django", "Redis"],
    level: "Intermediate", delivery: "1–2 weeks",
    originalPrice: 15500, price: 12999,
    features: ["Multi-location", "Analytics", "Alerts", "Barcode Support"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    screenshots: [], badge: null,
  },
  {
    id: 6, slug: "ai-chatbot-system",
    title: "AI ChatBot System",
    description: "Intelligent chatbot with natural language processing and learning capabilities.",
    longDesc: "An NLP-powered chatbot that learns from conversations, supports multi-platform deployment (web, WhatsApp, Telegram), and provides analytics on user interactions.",
    category: "AI/ML",
    tags: ["Python", "TensorFlow", "Flask"],
    level: "Expert", delivery: "1 week",
    originalPrice: 20500, price: 14999,
    features: ["NLP Processing", "Learning Algorithm", "Multi-platform", "Analytics"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Model Weights"],
    screenshots: [], badge: "New",
  },
  {
    id: 7, slug: "expense-tracker-app",
    title: "Expense Tracker App",
    description: "Mobile-first expense tracking app with charts, budgets, and category management.",
    longDesc: "Track daily expenses, set monthly budgets per category, visualise spending with charts, and export reports as PDF/CSV. Works offline with local storage sync.",
    category: "Mobile",
    tags: ["React Native", "Firebase"],
    level: "Beginner", delivery: "3–5 days",
    originalPrice: 10000, price: 7499,
    features: ["Budget Tracking", "Charts", "Categories", "Export Reports"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial"],
    screenshots: [], badge: null,
  },
  {
    id: 8, slug: "stock-price-prediction",
    title: "Stock Price Prediction",
    description: "ML-powered stock price prediction using LSTM neural networks and historical data.",
    longDesc: "Uses LSTM deep learning to predict stock prices from historical OHLCV data. Includes backtesting, live data feeds, interactive charts, and a Flask API for integration.",
    category: "Data Science",
    tags: ["Python", "Keras", "Pandas"],
    level: "Expert", delivery: "1–2 weeks",
    originalPrice: 22000, price: 16999,
    features: ["LSTM Model", "Live Data", "Visualization", "Backtesting"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Trained Model"],
    screenshots: [], badge: "Popular",
  },
];

const LEVEL_COLORS = {
  Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444", Expert: "#8b5cf6",
};

const COUPON_CODE = "STUDENT20";
const COUPON_DISCOUNT = 0.20;

// ─── Navbar (same as main page) ───────────────────────────────────────────────
function NavLogo() {
  return (
    <a className="pdp-navbar__logo" href="/">
      <video autoPlay loop playsInline width="50" height="50">
        <source src="https://www.webxter.in/webxter-preloader.mp4" type="video/mp4" />
        <img alt="logo" loading="lazy" width="50" height="50" decoding="async"
          src="https://www.webxter.in/favicon-extra-space.svg" style={{ color: "transparent" }} />
      </video>
      <img alt="logo" loading="lazy" width="120" height="25" decoding="async"
        srcSet="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=128&q=75 1x, https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75 2x"
        src="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75"
        style={{ color: "transparent" }} />
    </a>
  );
}

function PDPNavbar() {
  return (
    <nav className="pdp-navbar">
      <div className="pdp-container pdp-navbar__inner">
        <NavLogo />
        <div className="pdp-navbar__links">
          <a href="/">Projects</a>
          <a href="https://webxter.in/courses">Courses</a>
          <a href="https://webxter.in/about">About</a>
          <a href="https://webxter.in/contact">Contact</a>
        </div>
        <div className="pdp-navbar__actions">
          <a href="https://webxter.in/login" className="pdp-btn pdp-btn--ghost">Sign In</a>
          <a href="https://webxter.in/contact" className="pdp-btn pdp-btn--primary">Get Quote</a>
        </div>
      </div>
    </nav>
  );
}

// ─── Screenshot / demo placeholder ───────────────────────────────────────────
function MediaGallery({ project }) {
  const [active, setActive] = useState(0);
  const slides = project.screenshots.length > 0
    ? project.screenshots
    : [null, null, null]; // placeholders

  return (
    <div className="pdp-gallery">
      {/* Main view */}
      <div className="pdp-gallery__main">
        {slides[active] ? (
          <img src={slides[active]} alt={`Screenshot ${active + 1}`} className="pdp-gallery__img" />
        ) : (
          <div className="pdp-gallery__placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            <span>Demo Preview</span>
            <a href="https://webxter.in/contact" className="pdp-btn pdp-btn--primary pdp-btn--sm" style={{ marginTop: 12 }}>
              Request Demo
            </a>
          </div>
        )}
        {project.badge && <span className="pdp-gallery__badge">{project.badge}</span>}
      </div>
      {/* Thumbnails */}
      <div className="pdp-gallery__thumbs">
        {slides.map((s, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`pdp-gallery__thumb ${i === active ? "pdp-gallery__thumb--active" : ""}`}>
            {s ? <img src={s} alt={`Thumb ${i + 1}`} /> : (
              <div className="pdp-gallery__thumb-placeholder">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Purchase panel ───────────────────────────────────────────────────────────
function PurchasePanel({ project, onAddToCart }) {
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [added, setAdded] = useState(false);

  const discount = Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100);
  const finalPrice = applied
    ? Math.round(project.price * (1 - COUPON_DISCOUNT))
    : project.price;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === COUPON_CODE) {
      setApplied(true);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try STUDENT20");
      setApplied(false);
    }
  };

  const handleAddToCart = () => {
    onAddToCart({ ...project, price: finalPrice });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    onAddToCart({ ...project, price: finalPrice });
    navigate("/checkout");
  };

  return (
    <div className="pdp-panel">
      {/* Price block */}
      <div className="pdp-panel__price-block">
        <span className="pdp-panel__price-current">₹{finalPrice.toLocaleString("en-IN")}</span>
        <span className="pdp-panel__price-original">₹{project.originalPrice.toLocaleString("en-IN")}</span>
        <span className="pdp-panel__discount">{applied ? Math.round(discount + COUPON_DISCOUNT * 100) : discount}% OFF</span>
      </div>
      {applied && (
        <div className="pdp-panel__coupon-success">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          STUDENT20 applied — extra 20% off!
        </div>
      )}

      {/* Delivery */}
      <div className="pdp-panel__meta">
        <span className="pdp-panel__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Delivery: {project.delivery}
        </span>
        <span className="pdp-panel__meta-item" style={{ color: LEVEL_COLORS[project.level] }}>
          <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
          {project.level}
        </span>
      </div>

      {/* Coupon */}
      <div className="pdp-panel__coupon">
        <label className="pdp-panel__coupon-label">Have a coupon?</label>
        <div className="pdp-panel__coupon-row">
          <input
            type="text"
            placeholder="Enter code (e.g. STUDENT20)"
            value={coupon}
            onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
            className={`pdp-panel__coupon-input ${couponError ? "pdp-panel__coupon-input--error" : ""}`}
          />
          <button className="pdp-btn pdp-btn--outline pdp-btn--sm" onClick={applyCoupon}>Apply</button>
        </div>
        {couponError && <p className="pdp-panel__coupon-error">{couponError}</p>}
      </div>

      {/* Actions */}
      <div className="pdp-panel__actions">
        <button
          className="pdp-btn pdp-btn--primary pdp-btn--full"
          disabled={project.soldOut}
          onClick={handleBuyNow}
        >
          {project.soldOut ? "Sold Out" : "Buy Now"}
        </button>
        <button
          className="pdp-btn pdp-btn--outline pdp-btn--full"
          disabled={project.soldOut}
          onClick={handleAddToCart}
        >
          {added ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Added to Cart
            </>
          ) : "Add to Cart"}
        </button>
      </div>

      {/* What's included */}
      <div className="pdp-panel__includes">
        <h4 className="pdp-panel__includes-title">What's Included</h4>
        <ul className="pdp-panel__includes-list">
          {project.includes.map((item) => (
            <li key={item}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pdp-check-icon">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Support note */}
      <p className="pdp-panel__support">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        24/7 support via WhatsApp &amp; email
      </p>
    </div>
  );
}

// ─── Related projects ─────────────────────────────────────────────────────────
function RelatedProjects({ current }) {
  const related = PROJECTS
    .filter((p) => p.id !== current.id && p.category === current.category)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="pdp-related">
      <div className="pdp-container">
        <h2 className="pdp-related__title">Related Projects</h2>
        <div className="pdp-related__grid">
          {related.map((p) => {
            const disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            return (
              <Link to={`/projects/${p.slug}`} key={p.id} className="pdp-related-card">
                {p.badge && <span className="pdp-related-card__badge">{p.badge}</span>}
                <div className="pdp-related-card__header">
                  <span className="pdp-related-card__level" style={{ color: LEVEL_COLORS[p.level] }}>
                    <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                    {p.level}
                  </span>
                  <span className="pdp-related-card__delivery">{p.delivery}</span>
                </div>
                <h3 className="pdp-related-card__title">{p.title}</h3>
                <p className="pdp-related-card__desc">{p.description}</p>
                <div className="pdp-related-card__tags">
                  {p.tags.map((t) => <span key={t} className="pdp-tag">{t}</span>)}
                </div>
                <div className="pdp-related-card__price">
                  <span className="pdp-price-current">₹{p.price.toLocaleString("en-IN")}</span>
                  <span className="pdp-price-original">₹{p.originalPrice.toLocaleString("en-IN")}</span>
                  <span className="pdp-price-discount">{disc}% OFF</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Main PDP ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 16 }}>Project not found</h1>
        <Link to="/" className="pdp-btn pdp-btn--primary">← Back to Projects</Link>
      </div>
    );
  }

  const discount = Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100);

  return (
    <div className="pdp-page">

      {/* Breadcrumb */}
      <div className="pdp-breadcrumb">
        <div className="pdp-container">
          <Link to="/">Projects</Link>
          <span className="pdp-breadcrumb__sep">›</span>
          <span>{project.title}</span>
        </div>
      </div>

      {/* Hero section */}
      <section className="pdp-hero">
        <div className="pdp-container pdp-hero__inner">
          {/* Left: media + details */}
          <div className="pdp-hero__left">
            {/* Title + badges */}
            <div className="pdp-hero__meta">
              <span className="pdp-hero__category">{project.category}</span>
              {project.badge && <span className="pdp-hero__badge">{project.badge}</span>}
            </div>
            <h1 className="pdp-hero__title">{project.title}</h1>
            <p className="pdp-hero__desc">{project.longDesc}</p>

            {/* Tech stack */}
            <div className="pdp-hero__tags">
              {project.tags.map((t) => <span key={t} className="pdp-tag pdp-tag--lg">{t}</span>)}
            </div>

            {/* Media gallery */}
            <MediaGallery project={project} />

            {/* Features */}
            <div className="pdp-features">
              <h2 className="pdp-features__title">Key Features</h2>
              <div className="pdp-features__grid">
                {project.features.map((f) => (
                  <div key={f} className="pdp-feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pdp-check-icon">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* What's included (detailed) */}
            <div className="pdp-includes-detail">
              <h2 className="pdp-includes-detail__title">What's Included</h2>
              <div className="pdp-includes-detail__grid">
                {[
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
                    label: "Source Code", desc: "Complete, well-commented source code"
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
                    label: "Documentation", desc: "Detailed PDF documentation"
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
                    label: "PPT Presentation", desc: "Ready-to-present slides"
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
                    label: "Video Tutorial", desc: "Step-by-step walkthrough video"
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                    label: "Deployment Guide", desc: "How to host and go live"
                  },
                  {
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                    label: "Support", desc: "WhatsApp & email support"
                  },
                ].map((item) => (
                  <div key={item.label} className="pdp-include-card">
                    <span className="pdp-include-card__icon">{item.icon}</span>
                    <div>
                      <div className="pdp-include-card__label">{item.label}</div>
                      <div className="pdp-include-card__desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: sticky purchase panel */}
          <div className="pdp-hero__right">
            <PurchasePanel project={project} onAddToCart={addToCart} />
          </div>
        </div>
      </section>

      {/* Related projects */}
      <RelatedProjects current={project} />
    </div>
  );
}

