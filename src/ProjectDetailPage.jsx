import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { getProjects, validateCoupon, incrementCouponUsage } from "./admin/adminStore";
import "./ProjectDetailPage.css";

const LEVEL_COLORS = {
  Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444", Expert: "#8b5cf6",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

// ─── Media Gallery — supports images, videos, YouTube ─────────────────────────
function MediaGallery({ project }) {
  // Build unified slide list: demoVideo first (if set), then media items
  const slides = [];
  if (project.demoVideo) {
    slides.push({ type: "video", url: project.demoVideo, caption: "Demo Video", featured: true });
  }
  const mediaItems = project.media?.length > 0
    ? project.media
    : (project.screenshots || []).map((url, i) => ({ type: "image", url, caption: `Screenshot ${i + 1}`, featured: i === 0 }));
  slides.push(...mediaItems);

  // If nothing at all, show 3 placeholders
  const hasContent = slides.length > 0;
  const displaySlides = hasContent ? slides : [null, null, null];

  const [active, setActive] = useState(0);
  const current = displaySlides[active];

  const renderMain = () => {
    if (!current) return (
      <div className="pdp-gallery__placeholder">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        <span>Demo Preview</span>
        <a href="https://webxter.in/contact" className="pdp-btn pdp-btn--primary pdp-btn--sm" style={{ marginTop: 12 }}>Request Demo</a>
      </div>
    );

    const ytId = current.type === "video" ? getYouTubeId(current.url) : null;

    if (ytId) return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
        title={current.caption || "Demo Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="pdp-gallery__iframe"
      />
    );

    if (current.type === "video") return (
      <video controls className="pdp-gallery__img" src={current.url}>
        Your browser does not support video.
      </video>
    );

    return <img src={current.url} alt={current.caption || "Screenshot"} className="pdp-gallery__img" />;
  };

  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery__main">
        {renderMain()}
        {project.badge && <span className="pdp-gallery__badge">{project.badge}</span>}
        {current?.type === "video" && (
          <span className="pdp-gallery__video-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Video
          </span>
        )}
      </div>

      {displaySlides.length > 1 && (
        <div className="pdp-gallery__thumbs">
          {displaySlides.map((s, i) => {
            const ytId = s?.type === "video" ? getYouTubeId(s.url) : null;
            return (
              <button key={i} onClick={() => setActive(i)}
                className={`pdp-gallery__thumb ${i === active ? "pdp-gallery__thumb--active" : ""}`}
                title={s?.caption || `Slide ${i + 1}`}>
                {!s ? (
                  <div className="pdp-gallery__thumb-placeholder">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                  </div>
                ) : ytId ? (
                  <div className="pdp-gallery__thumb-video">
                    <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="YouTube" />
                    <div className="pdp-gallery__thumb-play">▶</div>
                  </div>
                ) : s.type === "video" ? (
                  <div className="pdp-gallery__thumb-video">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  </div>
                ) : (
                  <img src={s.url} alt={s.caption || `Thumb ${i + 1}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
      {current?.caption && (
        <p className="pdp-gallery__caption">{current.caption}</p>
      )}
    </div>
  );
}

// ─── Project Files section ────────────────────────────────────────────────────
function ProjectFiles({ files }) {
  if (!files?.length) return null;

  const TYPE_META = {
    github:  { label: "GitHub",       color: "#0f172a", bg: "#f1f5f9" },
    drive:   { label: "Google Drive", color: "#1a73e8", bg: "#eff6ff" },
    zip:     { label: "Download",     color: "#16a34a", bg: "#f0fdf4" },
    docs:    { label: "Docs",         color: "#d97706", bg: "#fffbeb" },
    demo:    { label: "Live Demo",    color: "#009fd4", bg: "#f0faff" },
    other:   { label: "Link",         color: "#64748b", bg: "#f8f9fb" },
  };

  const icons = {
    github: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
    drive:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9H9l-3-9H2"/><path d="M5.45 5.11L2 12h3l3-6.89M19.55 5.11L23 12h-3l-3-6.89"/><path d="M12 2L8.5 8.5h7L12 2z"/></svg>,
    zip:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    docs:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    demo:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
    other:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  };

  return (
    <div className="pdp-files">
      <h2 className="pdp-files__title">Project Files & Links</h2>
      <div className="pdp-files__grid">
        {files.map((f, i) => {
          const meta = TYPE_META[f.type] || TYPE_META.other;
          return (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="pdp-file-card">
              <div className="pdp-file-card__icon" style={{ background: meta.bg, color: meta.color }}>
                {icons[f.type] || icons.other}
              </div>
              <div className="pdp-file-card__info">
                <div className="pdp-file-card__label">{f.label}</div>
                <div className="pdp-file-card__type" style={{ color: meta.color }}>{meta.label}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pdp-file-card__arrow">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Purchase panel ───────────────────────────────────────────────────────────
function PurchasePanel({ project, onAddToCart }) {
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponObj, setCouponObj] = useState(null);
  const [added, setAdded] = useState(false);

  const baseDiscount = Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100);
  const finalPrice = applied ? Math.max(0, project.price - couponDiscount) : project.price;

  const applyCoupon = () => {
    const result = validateCoupon(coupon, project.price);
    if (result.valid) {
      setApplied(true);
      setCouponDiscount(result.discount);
      setCouponObj(result.coupon);
      setCouponError("");
    } else {
      setCouponError(result.error);
      setApplied(false);
      setCouponDiscount(0);
    }
  };

  const removeCoupon = () => {
    setApplied(false); setCouponDiscount(0); setCoupon(""); setCouponObj(null); setCouponError("");
  };

  const handleAddToCart = () => {
    if (applied && couponObj) incrementCouponUsage(couponObj.code);
    onAddToCart({ ...project, price: finalPrice });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (applied && couponObj) incrementCouponUsage(couponObj.code);
    onAddToCart({ ...project, price: finalPrice });
    navigate("/checkout");
  };

  return (
    <div className="pdp-panel">
      {/* Price */}
      <div className="pdp-panel__price-block">
        <span className="pdp-panel__price-current">₹{finalPrice.toLocaleString("en-IN")}</span>
        <span className="pdp-panel__price-original">₹{project.originalPrice.toLocaleString("en-IN")}</span>
        <span className="pdp-panel__discount">
          {applied
            ? Math.round(((project.originalPrice - finalPrice) / project.originalPrice) * 100)
            : baseDiscount}% OFF
        </span>
      </div>

      {applied && (
        <div className="pdp-panel__coupon-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {couponObj?.code} applied — saving ₹{couponDiscount.toLocaleString("en-IN")}!
          <button onClick={removeCoupon} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#16a34a", fontSize: ".85rem" }}>✕</button>
        </div>
      )}

      {/* Meta */}
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
      {!applied && (
        <div className="pdp-panel__coupon">
          <label className="pdp-panel__coupon-label">Have a coupon?</label>
          <div className="pdp-panel__coupon-row">
            <input type="text" placeholder="Enter coupon code"
              value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); }}
              className={`pdp-panel__coupon-input${couponError ? " pdp-panel__coupon-input--error" : ""}`} />
            <button className="pdp-btn pdp-btn--outline pdp-btn--sm" onClick={applyCoupon} type="button">Apply</button>
          </div>
          {couponError && <p className="pdp-panel__coupon-error">{couponError}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="pdp-panel__actions">
        <button className="pdp-btn pdp-btn--primary pdp-btn--full" disabled={project.soldOut} onClick={handleBuyNow}>
          {project.soldOut ? "Sold Out" : "Buy Now"}
        </button>
        <button className="pdp-btn pdp-btn--outline pdp-btn--full" disabled={project.soldOut} onClick={handleAddToCart}>
          {added ? (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added!</>
          ) : "Add to Cart"}
        </button>
      </div>

      {/* What's included */}
      <div className="pdp-panel__includes">
        <h4 className="pdp-panel__includes-title">What's Included</h4>
        <ul className="pdp-panel__includes-list">
          {(project.includes || []).map((item) => (
            <li key={item}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pdp-check-icon"><polyline points="20 6 9 17 4 12"/></svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Support */}
      <p className="pdp-panel__support">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        24/7 support via WhatsApp &amp; email
      </p>
    </div>
  );
}

// ─── Related projects ─────────────────────────────────────────────────────────
function RelatedProjects({ current }) {
  const related = getProjects()
    .filter((p) => p.id !== current.id && p.category === current.category && p.active !== false)
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

  const PROJECTS = getProjects();
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

            {/* Project files & links */}
            <ProjectFiles files={project.projectFiles} />

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

