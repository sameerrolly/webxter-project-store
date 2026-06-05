import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { incrementCouponUsage } from "./admin/adminStore";
import { getSettings } from "./admin/adminStore";
import { getProjectsApi, validateCouponAnywhere } from "./student/StudentApi";
import "./ProjectDetailPage.css";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const LEVEL_COLORS = {
  Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444", Expert: "#8b5cf6",
};

/** Resolve a relative media URL to absolute */
function resolveUrl(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

/** Fetch a single project by slug or id from the public API */
async function fetchProjectBySlug(slug) {
  // Try slug first
  const res = await fetch(`${BASE}/api/v1/projects/?slug=${encodeURIComponent(slug)}`);
  if (res.ok) {
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results || []);
    if (list.length > 0) return list[0];
  }
  // Try by id (slug might be numeric id)
  if (/^\d+$/.test(slug)) {
    const r2 = await fetch(`${BASE}/api/v1/projects/${slug}/`);
    if (r2.ok) return r2.json();
  }
  // Fall back: fetch all and find by slug or id
  const r3 = await fetch(`${BASE}/api/v1/projects/`);
  if (r3.ok) {
    const data = await r3.json();
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.find((p) => p.slug === slug || String(p.id) === String(slug)) || null;
  }
  return null;
}

/** Normalise backend project → component-friendly shape */
function normalise(p) {
  if (!p) return null;
  const price         = parseFloat(p.sale_price      ?? p.price         ?? 0) || 0;
  const originalPrice = parseFloat(p.original_price  ?? p.originalPrice ?? 0) || price;
  return {
    ...p,
    id:            p.id,
    slug:          p.slug || String(p.id),
    title:         p.title || "",
    description:   p.short_description || p.description || "",
    longDesc:      p.description       || p.long_desc   || "",
    category:      p.category_display  || p.category    || "",
    level:         p.level_display     || p.level       || "",
    delivery:      p.delivery_time     || p.delivery    || "",
    badge:         (p.badge_display && p.badge_display !== "None") ? p.badge_display : (p.badge || ""),
    price,
    originalPrice,
    active:        p.status === "active" || p.active === true,
    soldOut:       p.is_sold_out ?? p.soldOut ?? false,
    tags:          Array.isArray(p.technologies)   ? p.technologies   : (p.tags     || []),
    features:      Array.isArray(p.key_features)   ? p.key_features   : (p.features || []),
    includes:      Array.isArray(p.whats_included) ? p.whats_included : (p.includes || []),
    screenshots:   Array.isArray(p.screenshots)    ? p.screenshots.map(resolveUrl)    : [],
    media:         Array.isArray(p.media)          ? p.media.map((m) => ({ ...m, url: resolveUrl(m.url) })) : [],
    projectFiles:  Array.isArray(p.project_links)  ? p.project_links  : (p.projectFiles || []),
    demoVideo:     p.demo_video_url || p.demoVideo || "",
    thumbnail:     resolveUrl(p.thumbnail || ""),
  };
}

// ─── Media Gallery ────────────────────────────────────────────────────────────
function MediaGallery({ project }) {
  // Build slides from media items only (images) — no YouTube/video
  const rawMedia = project.media?.length > 0
    ? project.media
    : project.screenshots.map((url, i) => ({
        type: "image", url, caption: `Screenshot ${i + 1}`,
        is_featured: i === 0, featured: i === 0,
      }));

  // Sort: featured first, then by order
  const slides = [...rawMedia]
    .filter(m => m.type === "image" || m.media_type === "image" || (!m.type && !m.media_type))
    .sort((a, b) => {
      const aFeat = a.is_featured || a.featured ? 0 : 1;
      const bFeat = b.is_featured || b.featured ? 0 : 1;
      if (aFeat !== bFeat) return aFeat - bFeat;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  // Thumbnail fallback if no media
  if (slides.length === 0 && project.thumbnail) {
    slides.push({ type: "image", url: project.thumbnail, caption: project.title, is_featured: true });
  }

  const hasContent = slides.length > 0;
  const displaySlides = hasContent ? slides : [null];
  const [active, setActive] = useState(0);
  const current = displaySlides[active];

  const renderMain = () => {
    if (!current) return (
      <div className="pdp-gallery__placeholder">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        <span>No preview available</span>
        <a href="https://webxter.in/contact" className="pdp-btn pdp-btn--primary pdp-btn--sm" style={{ marginTop: 12 }}>Request Demo</a>
      </div>
    );
    // Always render as image (no YouTube, no video)
    const imgUrl = current.url || current.file_url || "";
    return (
      <img
        src={imgUrl}
        alt={current.caption || project.title}
        className="pdp-gallery__img"
        onError={(e) => { e.currentTarget.src = project.thumbnail || `https://picsum.photos/seed/${project.id}/800/500`; }}
      />
    );
  };

  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery__main">
        {renderMain()}
        {project.badge && <span className="pdp-gallery__badge">{project.badge}</span>}
      </div>
      {displaySlides.length > 1 && (
        <div className="pdp-gallery__thumbs">
          {displaySlides.map((s, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`pdp-gallery__thumb ${i === active ? "pdp-gallery__thumb--active" : ""}`}>
              {!s
                ? <div className="pdp-gallery__thumb-placeholder">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                  </div>
                : <img
                    src={s.url || s.file_url || ""}
                    alt={s.caption || `Preview ${i + 1}`}
                    onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${i}/160/100`; }}
                  />
              }
              {(s?.is_featured || s?.featured) && i === 0 && (
                <div style={{ position: "absolute", bottom: 2, left: 2, background: "rgba(0,159,212,.85)", color: "#fff", fontSize: ".6rem", fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>★</div>
              )}
            </button>
          ))}
        </div>
      )}
      {current?.caption && <p className="pdp-gallery__caption">{current.caption}</p>}
    </div>
  );
}

// ─── Project Files ────────────────────────────────────────────────────────────
function ProjectFiles({ files }) {
  if (!files?.length) return null;
  const TYPE_META = {
    github: { label: "GitHub", color: "#0f172a", bg: "#f1f5f9" },
    drive:  { label: "Google Drive", color: "#1a73e8", bg: "#eff6ff" },
    zip:    { label: "Download", color: "#16a34a", bg: "#f0fdf4" },
    docs:   { label: "Docs", color: "#d97706", bg: "#fffbeb" },
    demo:   { label: "Live Demo", color: "#009fd4", bg: "#f0faff" },
    other:  { label: "Link", color: "#64748b", bg: "#f8f9fb" },
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div className="pdp-file-card__info">
                <div className="pdp-file-card__label">{f.label || f.title || "Link"}</div>
                <div className="pdp-file-card__type" style={{ color: meta.color }}>{meta.label}</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Purchase Panel ───────────────────────────────────────────────────────────
function PurchasePanel({ project, onAddToCart }) {
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponObj, setCouponObj] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const safePrice    = project.price         || 0;
  const safeOriginal = project.originalPrice || safePrice;
  const baseDiscount = safeOriginal > 0 ? Math.round(((safeOriginal - safePrice) / safeOriginal) * 100) : 0;
  const finalPrice   = applied ? Math.max(0, safePrice - couponDiscount) : safePrice;

  const applyCoupon = async () => {
    if (!coupon.trim()) { setCouponError("Please enter a coupon code."); return; }
    setCouponLoading(true);
    setCouponError("");
    const result = await validateCouponAnywhere(coupon.trim(), safePrice);
    setCouponLoading(false);
    if (result.valid) {
      setApplied(true);
      setCouponDiscount(result.discount);
      setCouponObj(result.coupon);
      setCouponError("");
    } else {
      setCouponError(result.error || "Invalid coupon code.");
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
    setAdded(true); setTimeout(() => setAdded(false), 2000);
  };
  const handleBuyNow = () => {
    if (applied && couponObj) incrementCouponUsage(couponObj.code);
    onAddToCart({ ...project, price: finalPrice });
    navigate("/checkout");
  };

  return (
    <div className="pdp-panel">
      <div className="pdp-panel__price-block">
        <span className="pdp-panel__price-current">₹{finalPrice.toLocaleString("en-IN")}</span>
        {safeOriginal > safePrice && <span className="pdp-panel__price-original">₹{safeOriginal.toLocaleString("en-IN")}</span>}
        {baseDiscount > 0 && <span className="pdp-panel__discount">{applied ? Math.round(((safeOriginal - finalPrice) / safeOriginal) * 100) : baseDiscount}% OFF</span>}
      </div>
      {applied && (
        <div className="pdp-panel__coupon-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {couponObj?.code} applied — saving ₹{couponDiscount.toLocaleString("en-IN")}!
          <button onClick={removeCoupon} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#16a34a" }}>✕</button>
        </div>
      )}
      <div className="pdp-panel__meta">
        {project.delivery && <span className="pdp-panel__meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Delivery: {project.delivery}</span>}
        {project.level && <span className="pdp-panel__meta-item" style={{ color: LEVEL_COLORS[project.level] }}><svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>{project.level}</span>}
      </div>
      {!applied && (
        <div className="pdp-panel__coupon">
          <label className="pdp-panel__coupon-label">Have a coupon?</label>
          <div className="pdp-panel__coupon-row">
            <input type="text" placeholder="Enter coupon code" value={coupon}
              onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); }}
              className={`pdp-panel__coupon-input${couponError ? " pdp-panel__coupon-input--error" : ""}`}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }} />
            <button className="pdp-btn pdp-btn--outline pdp-btn--sm" onClick={applyCoupon} type="button" disabled={couponLoading}>
              {couponLoading ? "..." : "Apply"}
            </button>
          </div>
          {couponError && <p className="pdp-panel__coupon-error">{couponError}</p>}
        </div>
      )}
      <div className="pdp-panel__actions">
        <button className="pdp-btn pdp-btn--primary pdp-btn--full" disabled={project.soldOut} onClick={handleBuyNow}>{project.soldOut ? "Sold Out" : "Buy Now"}</button>
        <button className="pdp-btn pdp-btn--outline pdp-btn--full" disabled={project.soldOut} onClick={handleAddToCart}>
          {added ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added!</> : "Add to Cart"}
        </button>
      </div>
      {project.includes?.length > 0 && (
        <div className="pdp-panel__includes">
          <h4 className="pdp-panel__includes-title">What's Included</h4>
          <ul className="pdp-panel__includes-list">
            {project.includes.map((item) => (
              <li key={item}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pdp-check-icon"><polyline points="20 6 9 17 4 12"/></svg>{item}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="pdp-panel__support"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>24/7 support via WhatsApp &amp; email</p>
    </div>
  );
}

// ─── Related Projects ─────────────────────────────────────────────────────────
function RelatedProjects({ current, allProjects }) {
  const related = allProjects
    .filter((p) => p.id !== current.id && p.category === current.category && p.active !== false)
    .slice(0, 3);
  if (related.length === 0) return null;
  return (
    <section className="pdp-related">
      <div className="pdp-container">
        <h2 className="pdp-related__title">Related Projects</h2>
        <div className="pdp-related__grid">
          {related.map((p) => {
            const disc = p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
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
                  {(p.tags || []).map((t) => <span key={t} className="pdp-tag">{t}</span>)}
                </div>
                <div className="pdp-related-card__price">
                  <span className="pdp-price-current">₹{(p.price || 0).toLocaleString("en-IN")}</span>
                  {p.originalPrice > p.price && <span className="pdp-price-original">₹{p.originalPrice.toLocaleString("en-IN")}</span>}
                  {disc > 0 && <span className="pdp-price-discount">{disc}% OFF</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Maintenance Banner ───────────────────────────────────────────────────────
function MaintenanceBanner() {
  const settings = getSettings();
  if (!settings.maintenanceMode) return null;

  const message =
    settings.maintenanceMessage ||
    "We're currently under maintenance. We'll be back shortly. For urgent queries, contact us on WhatsApp.";

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 999,
      background: "linear-gradient(90deg, #b91c1c 0%, #dc2626 100%)",
      color: "#fff",
      padding: "14px 24px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      boxShadow: "0 2px 12px rgba(185,28,28,.35)",
      flexWrap: "wrap", textAlign: "center",
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span style={{ fontWeight: 700, fontSize: ".9rem", letterSpacing: ".3px" }}>
        🔧 Site Under Maintenance
      </span>
      <span style={{ fontSize: ".85rem", opacity: .92, maxWidth: 600 }}>{message}</span>
      <a
        href="https://wa.me/918264796534"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: "#fff", color: "#b91c1c", fontWeight: 700,
          fontSize: ".78rem", padding: "5px 14px", borderRadius: 20,
          textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap",
        }}
      >
        Contact Us
      </a>
    </div>
  );
}

// ─── Main PDP ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getProjectsApi()
      .then((list) => {
        if (cancelled) return;
        setAllProjects(list);
        const found = list.find(
          (p) => p.slug === slug || String(p.id) === String(slug)
        );
        setProject(found || null);
        if (!found) setError("Project not found.");
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Could not load project. Please check your connection.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#009fd4", animation: "pdp-spin .7s linear infinite" }} />
        <style>{`@keyframes pdp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 16 }}>{error || "Project not found"}</h1>
        <Link to="/" className="pdp-btn pdp-btn--primary">← Back to Projects</Link>
      </div>
    );
  }

  const discount = project.originalPrice > project.price
    ? Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100)
    : 0;

  return (
    <div className="pdp-page">
      <MaintenanceBanner />
      <div className="pdp-breadcrumb">
        <div className="pdp-container">
          <Link to="/">Projects</Link>
          <span className="pdp-breadcrumb__sep">›</span>
          <span>{project.title}</span>
        </div>
      </div>

      <section className="pdp-hero">
        <div className="pdp-container pdp-hero__inner">
          <div className="pdp-hero__left">
            <div className="pdp-hero__meta">
              <span className="pdp-hero__category">{project.category}</span>
              {project.badge && <span className="pdp-hero__badge">{project.badge}</span>}
            </div>
            <h1 className="pdp-hero__title">{project.title}</h1>
            <p className="pdp-hero__desc">{project.longDesc || project.description}</p>
            <div className="pdp-hero__tags">
              {(project.tags || []).map((t) => <span key={t} className="pdp-tag pdp-tag--lg">{t}</span>)}
            </div>
            <MediaGallery project={project} />
            <ProjectFiles files={project.projectFiles} />
            {project.features?.length > 0 && (
              <div className="pdp-features">
                <h2 className="pdp-features__title">Key Features</h2>
                <div className="pdp-features__grid">
                  {project.features.map((f) => (
                    <div key={f} className="pdp-feature-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pdp-check-icon"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="pdp-hero__right">
            <PurchasePanel project={project} onAddToCart={addToCart} />
          </div>
        </div>
      </section>

      <RelatedProjects current={project} allProjects={allProjects} />
    </div>
  );
}
