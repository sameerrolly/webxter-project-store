import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "./StudentLayout";
import { getStudentSession, getStudentOrders } from "./studentStore";
import { getProjects } from "../admin/adminStore";

// ─── License generator ────────────────────────────────────────────────────────
function downloadLicense(order, session) {
  const studentName = session?.name || session?.email || "Student";
  const licenseText = `WEBXTER PROJECT LICENSE
========================

License ID   : LIC-${order.id}
Order ID     : ${order.id}
Project      : ${order.project}
Licensed To  : ${studentName}
Email        : ${session?.email || "—"}
Amount Paid  : ₹${order.amount.toLocaleString("en-IN")}
Date         : ${order.date}
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

const STATUS_BADGE = { completed: "sd-badge--green", pending: "sd-badge--yellow", cancelled: "sd-badge--red" };
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
function DownloadCard({ order, project }) {
  const files = project?.projectFiles?.length > 0 ? project.projectFiles : DEFAULT_FILES;
  const thumb = project?.media?.[0]?.url || project?.screenshots?.[0];

  return (
    <div className="sd-dl-card">
      {/* Thumbnail */}
      <div className="sd-dl-card__thumb">
        {thumb
          ? <img src={thumb} alt={order.project} />
          : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        }
        <span className="sd-badge sd-badge--green sd-dl-card__status">Completed</span>
      </div>

      {/* Info */}
      <div className="sd-dl-card__body">
        <div className="sd-dl-card__title">{order.project}</div>
        <div className="sd-dl-card__meta">
          <span className="sd-dl-card__id">{order.id}</span>
          <span>·</span>
          <span>₹{order.amount.toLocaleString("en-IN")}</span>
          <span>·</span>
          <span>{order.date}</span>
        </div>

        {/* Includes chips */}
        {project?.includes?.length > 0 && (
          <div className="sd-dl-card__includes">
            {project.includes.map((inc) => (
              <span key={inc} className="sd-dl-card__chip">{inc}</span>
            ))}
          </div>
        )}

        {/* Download links */}
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

        {project?.slug && (
          <Link to={`/projects/${project.slug}`} className="sd-btn sd-btn--ghost sd-btn--sm" style={{ alignSelf: "flex-start", marginTop: 4 }}>
            View Project →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentOrders() {
  const session  = getStudentSession();
  const orders   = useMemo(() => getStudentOrders(session?.email || ""), [session]);
  const projects = useMemo(() => getProjects(), []);

  const [filter,   setFilter]   = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"
  const [selected, setSelected] = useState(null);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // For grid view — only completed orders have downloads
  const completedFiltered = filtered.filter((o) => o.status === "completed");

  return (
    <StudentLayout title="My Orders">

      {/* ── Header ── */}
      <div className="sd-orders-header">
        <div>
          <div className="sd-page-header__title">My Orders</div>
          <div className="sd-page-header__sub">
            {orders.length} total · {orders.filter((o) => o.status === "completed").length} completed
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
          {completedFiltered.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty__icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>No downloads available</h3>
              <p>
                {filter === "all"
                  ? "Completed orders will show download links here."
                  : `No completed orders match the "${filter}" filter.`}
              </p>
              <button className="sd-btn sd-btn--ghost sd-btn--sm" style={{ marginTop: 8 }} onClick={() => setFilter("all")}>
                Show all orders
              </button>
            </div>
          ) : (
            <>
              <div className="sd-alert sd-alert--info" style={{ marginBottom: 20 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Files are delivered via the links below. Issues? WhatsApp <strong>+91-8264796534</strong></span>
              </div>
              <div className="sd-dl-grid">
                {completedFiltered.map((o) => {
                  const proj = projects.find((p) => p.title === o.project);
                  return <DownloadCard key={o.id} order={o} project={proj} />;
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
                      <span className="sd-order-card__id">{o.id}</span>
                      <span className={`sd-badge ${STATUS_BADGE[o.status] || "sd-badge--gray"}`}>{o.status}</span>
                      <span className="sd-order-card__date">{o.date}</span>
                    </div>
                    <div className="sd-order-card__project">{o.project}</div>
                    <div className="sd-order-card__pay">Payment: {PAY_LABEL[o.payMethod] || o.payMethod}</div>
                  </div>
                  <div className="sd-order-card__right">
                    <div className="sd-order-card__amount">₹{o.amount.toLocaleString("en-IN")}</div>
                    {o.status === "completed" && (
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
                          onClick={(e) => { e.stopPropagation(); downloadLicense(o, session); }}
                          title="Download your license certificate"
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
      {selected && (
        <div className="sd-modal-overlay" onClick={() => setSelected(null)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal__header">
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>{selected.id}</div>
                <span className={`sd-badge ${STATUS_BADGE[selected.status] || "sd-badge--gray"}`} style={{ marginTop: 6, display: "inline-flex" }}>{selected.status}</span>
              </div>
              <button onClick={() => setSelected(null)} className="sd-modal__close">×</button>
            </div>

            {[
              ["Project",  selected.project],
              ["Amount",   `₹${selected.amount.toLocaleString("en-IN")}`],
              ["Payment",  PAY_LABEL[selected.payMethod] || selected.payMethod],
              ["Date",     selected.date],
              ["College",  selected.college || "—"],
            ].map(([k, v]) => (
              <div key={k} className="sd-modal__row">
                <span>{k}</span><span>{v}</span>
              </div>
            ))}

            {selected.status === "completed" && (
              <div className="sd-order-card__actions sd-order-card__actions--full" style={{ marginTop: 20 }}>
                <button
                  className="sd-btn sd-btn--primary sd-btn--full"
                  onClick={() => { setSelected(null); setViewMode("grid"); setFilter("completed"); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Downloads
                </button>
                <button
                  className="sd-btn sd-btn--ghost sd-btn--full"
                  onClick={() => downloadLicense(selected, session)}
                  title="Download your license certificate"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="12" y2="17"/>
                  </svg>
                  License
                </button>
              </div>
            )}
            {selected.status === "pending" && (
              <div className="sd-alert sd-alert--warn" style={{ marginTop: 16 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Your order is being processed. WhatsApp us at +91-8264796534 for updates.
              </div>
            )}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
