import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "./StudentLayout";
import { getOrdersApi, getProjectsApi, getStoredUser } from "./StudentApi";

// ─── License generator ────────────────────────────────────────────────────────
function downloadLicense(order, user) {
  const studentName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
    : "Student";
  const licenseText = `WEBXTER PROJECT LICENSE
========================

License ID   : LIC-${order.id}
Order ID     : ${order.id}
Project      : ${order.project || order.project_title}
Licensed To  : ${studentName}
Email        : ${user?.email || "—"}
Amount Paid  : ₹${(order.amount || 0).toLocaleString("en-IN")}
Date         : ${order.date || order.created_at}
Issued By    : Webxter (webxter.in)

TERMS OF USE
------------
1. This license grants the above-named individual a non-exclusive,
   non-transferable right to use the project for personal academic
   or learning purposes only.
2. Redistribution, resale, or sharing of the source code or any
   derivative work is strictly prohibited.
3. The project may not be submitted as original work in any
   institution without proper attribution to Webxter.
4. Webxter retains all intellectual property rights.

For support: projects@webxter.in | WhatsApp: +91-8264796534

© ${new Date().getFullYear()} Webxter. All rights reserved.
`;

  const blob = new Blob([licenseText], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `License-${order.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Invoice generator ────────────────────────────────────────────────────────
function downloadInvoice(order, user) {
  const studentName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
    : "Student";
  const invoiceText = `WEBXTER — INVOICE
=================

Invoice No   : INV-${order.id}
Order ID     : ${order.id}
Date         : ${order.date || new Date().toISOString().split("T")[0]}
Issued By    : Webxter (webxter.in)

BILL TO
-------
Name         : ${studentName}
Email        : ${user?.email || "—"}
Phone        : ${user?.phone || "—"}
College      : ${order.college || "—"}

ITEM
----
Project      : ${order.project || order.project_title}
Amount       : ₹${(order.amount || 0).toLocaleString("en-IN")}
Payment      : Razorpay

TOTAL        : ₹${(order.amount || 0).toLocaleString("en-IN")}

Thank you for your purchase!
For support: projects@webxter.in | WhatsApp: +91-8264796534

© ${new Date().getFullYear()} Webxter. All rights reserved.
`;
  const blob = new Blob([invoiceText], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Invoice-${order.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Human-readable status labels
const STATUS_LABELS = {
  pending:     "Pending",
  confirmed:   "Confirmed",
  in_progress: "In Progress",
  delivered:   "Delivered",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

const STATUS_BADGE = {
  completed:   "sd-badge--green",
  delivered:   "sd-badge--green",
  confirmed:   "sd-badge--blue",
  in_progress: "sd-badge--blue",
  pending:     "sd-badge--yellow",
  cancelled:   "sd-badge--red",
};

// Map backend status → display label
function statusLabel(s) {
  const map = { delivered: "completed", confirmed: "confirmed", in_progress: "in progress" };
  return map[s] || s;
}

// A "completed" order is one that is delivered or completed
function isCompleted(o) {
  return o.status === "delivered" || o.status === "completed";
}
const PAY_LABEL    = { upi: "UPI / GPay", whatsapp: "WhatsApp", bank: "Bank Transfer" };
const FILTERS      = ["all", "completed", "pending", "cancelled"];

const FILE_ICONS = {
  github: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
  drive: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9H9l-3-9H2"/><path d="M5.45 5.11L2 12h3l3-6.89M19.55 5.11L23 12h-3l-3-6.89"/><path d="M12 2L8.5 8.5h7L12 2z"/></svg>,
  zip:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  docs:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  demo:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  other: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

const DEFAULT_FILES = [
  { label: "Contact for Source Code", url: "https://wa.me/918264796534", type: "other" },
  { label: "Request Documentation",   url: "mailto:projects@webxter.in",  type: "docs"  },
];

// ─── SVG icons for view toggle ────────────────────────────────────────────────
const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6"  x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6"  x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3"  y="3"  width="7" height="7"/>
    <rect x="14" y="3"  width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3"  y="14" width="7" height="7"/>
  </svg>
);

// ─── Grid card (download view) ────────────────────────────────────────────────
function DownloadCard({ order, project, session }) {
  const delivered = isCompleted(order);
  // For delivered orders use project files; for pending show contact links
  const files = delivered
    ? (project?.projectFiles?.length > 0 ? project.projectFiles : DEFAULT_FILES)
    : [
        { label: "WhatsApp us for status update", url: "https://wa.me/918264796534", type: "other" },
        { label: "Email: projects@webxter.in",    url: "mailto:projects@webxter.in",  type: "docs"  },
      ];
  const thumb = project?.thumbnail || project?.media?.find((m) => m.is_featured || m.featured)?.url
    || project?.media?.[0]?.url || project?.screenshots?.[0];

  return (
    <div className="sd-dl-card">
      <div className="sd-dl-card__thumb">
        {thumb
          ? <img src={thumb} alt={order.project} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        }
        <span className={`sd-badge ${delivered ? "sd-badge--green" : "sd-badge--yellow"} sd-dl-card__status`}>
          {delivered ? "Delivered" : order.status}
        </span>
      </div>

      <div className="sd-dl-card__body">
        <div className="sd-dl-card__title">{order.project}</div>
        <div className="sd-dl-card__meta">
          <span>₹{(order.amount || 0).toLocaleString("en-IN")}</span>
          <span>·</span>
          <span>{order.date}</span>
        </div>

        {delivered && project?.includes?.length > 0 && (
          <div className="sd-dl-card__includes">
            {project.includes.map((inc) => (
              <span key={inc} className="sd-dl-card__chip">{inc}</span>
            ))}
          </div>
        )}

        {!delivered && (
          <div style={{ fontSize: ".78rem", color: "#d97706", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
            Your order is being processed. Files will appear here once delivered.
          </div>
        )}

        <div className="sd-dl-card__files">
          {files.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="sd-dl-file">
              <span className="sd-dl-file__icon">{FILE_ICONS[f.type] || FILE_ICONS.other}</span>
              <span className="sd-dl-file__label">{f.label}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sd-dl-file__arrow">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {delivered && (
            <button
              className="sd-btn sd-btn--ghost sd-btn--sm"
              onClick={() => downloadLicense(order, session)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              License
            </button>
          )}
          {project?.slug && (
            <Link to={`/projects/${project.slug}`} className="sd-btn sd-btn--ghost sd-btn--sm">
              View Project →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentOrders() {
  const session  = getStoredUser();
  const [orders,   setOrders]   = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Fetch orders and projects in parallel
    Promise.all([
      getOrdersApi().catch(() => []),
      getProjectsApi().catch(() => []),
    ]).then(([orderData, projectData]) => {
      const normalised = orderData.map((o) => ({
        ...o,
        project:   o.project_title  || o.project  || "Unknown Project",
        amount:    parseFloat(o.final_amount || o.total_amount || o.amount || 0),
        date:      (o.created_at || o.date || "").split("T")[0],
        status:    o.status || "pending",
        payMethod: o.pay_method || o.payMethod || "razorpay",
        college:   o.college || "",
      }));
      setOrders(normalised);
      setProjects(projectData);
    }).finally(() => setLoading(false));
  }, []);

  const [filter,   setFilter]   = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [selected, setSelected] = useState(null);
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // Grid view — show all filtered orders (pending shows contact links, delivered shows files)
  const gridFiltered = filtered;

  return (
    <StudentLayout title="My Orders">

      {/* ── Header ── */}
      <div className="sd-orders-header">
        <div>
          <div className="sd-page-header__title">My Orders</div>
          <div className="sd-page-header__sub">
            {loading ? "Loading…" : `${orders.length} total · ${orders.filter(isCompleted).length} completed`}
          </div>
        </div>

        {/* View toggle */}
        <div className="sd-view-toggle">
          <button
            className={`sd-view-toggle__btn ${viewMode === "list" ? "sd-view-toggle__btn--active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
            aria-label="List view"
          >
            <ListIcon />
          </button>
          <button
            className={`sd-view-toggle__btn ${viewMode === "grid" ? "sd-view-toggle__btn--active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid / Downloads view"
            aria-label="Grid view"
          >
            <GridIcon />
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="sd-filter-tabs">
        {FILTERS.map((s) => {
          const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`sd-btn sd-btn--sm ${filter === s ? "sd-btn--primary" : "sd-btn--ghost"}`}
              style={{ textTransform: "capitalize", flexShrink: 0 }}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Grid view — downloads ── */}
      {viewMode === "grid" && (
        <>
          {gridFiltered.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty__icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>No orders yet</h3>
              <p>Place an order to see your downloads here.</p>
              <Link to="/" className="sd-btn sd-btn--primary sd-btn--sm" style={{ marginTop: 8 }}>Browse Projects</Link>
            </div>
          ) : (
            <>
              <div className="sd-alert sd-alert--info" style={{ marginBottom: 20 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Delivered orders show download links. Pending orders show contact options. Issues? WhatsApp <strong>+91-8264796534</strong></span>
              </div>
              <div className="sd-dl-grid">
                {gridFiltered.map((o) => {
                  const proj = projects.find(
                    (p) => p.title === o.project || String(p.id) === String(o.project_id || o.project)
                  );
                  return <DownloadCard key={o.id} order={o} project={proj} session={session} />;
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── List view — orders ── */}
      {viewMode === "list" && (
        <>
          {filtered.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty__icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                </svg>
              </div>
              <h3>No {filter !== "all" ? filter : ""} orders</h3>
              <p>{filter === "all" ? "You haven't placed any orders yet." : `No ${filter} orders found.`}</p>
              {filter === "all" && (
                <Link to="/" className="sd-btn sd-btn--primary sd-btn--sm" style={{ marginTop: 8 }}>Browse Projects</Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((o) => (
                <div key={o.id} className="sd-order-card" onClick={() => setSelected(o)}>
                  <div className="sd-order-card__left">
                    <div className="sd-order-card__meta">
                      <span className={`sd-badge ${STATUS_BADGE[o.status] || "sd-badge--gray"}`}>{o.status}</span>
                      <span className="sd-order-card__date">{o.date}</span>
                    </div>
                    <div className="sd-order-card__project">{o.project}</div>
                    <div className="sd-order-card__pay">Payment: {PAY_LABEL[o.payMethod] || o.payMethod}</div>
                  </div>
                  <div className="sd-order-card__right">
                    <div className="sd-order-card__amount">₹{o.amount.toLocaleString("en-IN")}</div>
                    {isCompleted(o) && (
                      <div className="sd-order-card__actions">
                        <button
                          className="sd-btn sd-btn--primary sd-btn--sm"
                          onClick={(e) => { e.stopPropagation(); setViewMode("grid"); setFilter("completed"); }}
                          title="Switch to downloads view"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Download
                        </button>
                        <button
                          className="sd-btn sd-btn--ghost sd-btn--sm"
                          onClick={(e) => { e.stopPropagation(); downloadLicense(o, session); }}                          title="Download your license certificate"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="9" y1="13" x2="15" y2="13"/>
                            <line x1="9" y1="17" x2="12" y2="17"/>
                          </svg>
                          License
                        </button>
                      </div>
                    )}
                    {o.status === "pending" && (
                      <a href="https://wa.me/918264796534" target="_blank" rel="noopener noreferrer"
                        className="sd-btn sd-btn--ghost sd-btn--sm" style={{ marginTop: 8 }}
                        onClick={(e) => e.stopPropagation()}>
                        Contact Us
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Order detail modal ── */}
      {selected && (() => {
        const selProj = projects.find(
          (p) => p.title === selected.project || String(p.id) === String(selected.project_id || selected.project)
        );
        const selDelivered = isCompleted(selected);
        return (
          <div className="sd-modal-overlay" onClick={() => setSelected(null)}>
            <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="sd-modal__header">
                <div>
                  <span className={`sd-badge ${STATUS_BADGE[selected.status] || "sd-badge--gray"}`} style={{ display: "inline-flex" }}>
                    {STATUS_LABELS[selected.status] || selected.status}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="sd-modal__close">×</button>
              </div>

              {/* Details */}
              {[
                ["Project",  selected.project || selected.project_title],
                ["Amount",   `₹${(selected.amount || 0).toLocaleString("en-IN")}`],
                ["Payment",  PAY_LABEL[selected.payMethod || selected.pay_method] || selected.payMethod || selected.pay_method || "Razorpay"],
                ["Date",     selected.date || (selected.created_at || "").split("T")[0]],
                ["College",  selected.college || "—"],
              ].map(([k, v]) => (
                <div key={k} className="sd-modal__row">
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}

              {/* Download buttons — always available */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 4 }}>
                  Downloads
                </div>

                {/* License */}
                <button className="sd-btn sd-btn--ghost sd-btn--full" onClick={() => downloadLicense(selected, session)}
                  style={{ justifyContent: "flex-start", gap: 10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="12" y2="17"/>
                  </svg>
                  Download License Certificate
                </button>

                {/* Invoice */}
                <button className="sd-btn sd-btn--ghost sd-btn--full" onClick={() => downloadInvoice(selected, session)}
                  style={{ justifyContent: "flex-start", gap: 10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="12" y2="17"/>
                  </svg>
                  Download Invoice
                </button>

                {/* Project files — only if delivered and files exist */}
                {selDelivered && selProj?.projectFiles?.length > 0 && selProj.projectFiles.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                    className="sd-btn sd-btn--primary sd-btn--full"
                    style={{ justifyContent: "flex-start", gap: 10, textDecoration: "none" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {f.label || "Download Project Files"}
                  </a>
                ))}

                {/* Grid view shortcut */}
                <button className="sd-btn sd-btn--ghost sd-btn--full"
                  onClick={() => { setSelected(null); setViewMode("grid"); setFilter("all"); }}
                  style={{ justifyContent: "flex-start", gap: 10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  View All Downloads
                </button>
              </div>

              {/* Pending notice */}
              {!selDelivered && selected.status !== "cancelled" && (
                <div className="sd-alert sd-alert--warn" style={{ marginTop: 16 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Your order is {STATUS_LABELS[selected.status] || selected.status}. Project files will be available once delivered. WhatsApp: +91-8264796534
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </StudentLayout>
  );
}
