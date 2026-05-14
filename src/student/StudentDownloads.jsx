import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "./StudentLayout";
import { getStudentSession, getStudentOrders } from "./studentStore";
import { getProjects } from "../admin/adminStore";

const FILE_ICONS = {
  github: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
  drive: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9H9l-3-9H2"/><path d="M5.45 5.11L2 12h3l3-6.89M19.55 5.11L23 12h-3l-3-6.89"/><path d="M12 2L8.5 8.5h7L12 2z"/></svg>,
  zip: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  docs: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  demo: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  other: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

// Default files every completed project gets
const DEFAULT_FILES = [
  { label: "Contact for Source Code", url: "https://wa.me/918264796534", type: "other" },
  { label: "Request Documentation", url: "mailto:projects@webxter.in", type: "docs" },
];

export default function StudentDownloads() {
  const session = getStudentSession();
  const orders = useMemo(() => getStudentOrders(session?.email || ""), [session]);
  const projects = useMemo(() => getProjects(), []);

  const completed = orders.filter((o) => o.status === "completed");

  const downloadItems = completed.map((o) => {
    const proj = projects.find((p) => p.title === o.project);
    const files = proj?.projectFiles?.length > 0 ? proj.projectFiles : DEFAULT_FILES;
    return { order: o, project: proj, files };
  });

  return (
    <StudentLayout title="Downloads">
      <div className="sd-page-header">
        <div>
          <div className="sd-page-header__title">Downloads</div>
          <div className="sd-page-header__sub">{completed.length} project{completed.length !== 1 ? "s" : ""} available</div>
        </div>
      </div>

      {completed.length === 0 ? (
        <div className="sd-empty">
          <div className="sd-empty__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <h3>No downloads yet</h3>
          <p>Your project files will appear here once your order is completed. Pending orders are processed within the stated delivery window.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link to="/student/orders" className="sd-btn sd-btn--ghost sd-btn--sm">View Orders</Link>
            <Link to="/" className="sd-btn sd-btn--primary sd-btn--sm">Browse Projects</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="sd-alert sd-alert--info" style={{ marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Files are delivered via the links below. If a link isn't working, WhatsApp us at <strong>+91-8264796534</strong>.</span>
          </div>

          <div className="sd-download-grid">
            {downloadItems.map(({ order, project, files }) => (
              <div key={order.id} className="sd-download-card">
                <div className="sd-download-card__header">
                  <div className="sd-download-card__thumb">
                    {project?.media?.[0]?.url || project?.screenshots?.[0]
                      ? <img src={project?.media?.[0]?.url || project?.screenshots?.[0]} alt={order.project} />
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sd-download-card__title">{order.project}</div>
                    <div className="sd-download-card__meta">
                      <span style={{ fontFamily: "monospace", color: "#009fd4", fontSize: ".72rem" }}>{order.id}</span>
                      {" · "}₹{order.amount.toLocaleString("en-IN")}
                    </div>
                    <span className="sd-badge sd-badge--green" style={{ marginTop: 4, display: "inline-flex" }}>Completed</span>
                  </div>
                </div>

                {/* Includes list */}
                {project?.includes?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {project.includes.map((inc) => (
                      <span key={inc} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 5, padding: "2px 8px", fontSize: ".7rem", color: "#64748b" }}>{inc}</span>
                    ))}
                  </div>
                )}

                {/* Download links */}
                <div className="sd-download-card__files">
                  {files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="sd-download-file">
                      <span className="sd-download-file__icon">{FILE_ICONS[f.type] || FILE_ICONS.other}</span>
                      <span className="sd-download-file__label">{f.label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sd-download-file__arrow"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  ))}
                </div>

                {/* View on store */}
                {project?.slug && (
                  <Link to={`/projects/${project.slug}`} className="sd-btn sd-btn--ghost sd-btn--sm" style={{ alignSelf: "flex-start" }}>
                    View Project Page →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </StudentLayout>
  );
}
