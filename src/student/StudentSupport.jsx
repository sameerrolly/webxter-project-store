import React, { useState } from "react";
import StudentLayout from "./StudentLayout";
import { getStudentSession, getStudentTickets, addStudentTicket } from "./studentStore";

const CATEGORIES = ["Project Files", "Order Status", "Payment Issue", "Technical Help", "Refund Request", "Other"];
const STATUS_BADGE = { open: "sd-badge--yellow", resolved: "sd-badge--green", closed: "sd-badge--gray" };

export default function StudentSupport() {
  const session = getStudentSession();
  const [tickets, setTickets] = useState(() => getStudentTickets(session?.email || ""));
  const [view, setView] = useState("list"); // "list" | "new"
  const [form, setForm] = useState({ subject: "", category: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.category) e.category = "Please select a category";
    if (!form.message.trim() || form.message.trim().length < 20) e.message = "Please describe your issue (min 20 characters)";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    addStudentTicket(session?.email || "", { ...form, email: session?.email, name: session?.name });
    setTickets(getStudentTickets(session?.email || ""));
    setSubmitted(true);
    setForm({ subject: "", category: "", message: "" });
    setTimeout(() => { setSubmitted(false); setView("list"); }, 2000);
  };

  return (
    <StudentLayout title="Support">
      <div className="sd-page-header">
        <div>
          <div className="sd-page-header__title">Support</div>
          <div className="sd-page-header__sub">Get help with your orders and projects</div>
        </div>
        {view === "list" && (
          <button className="sd-btn sd-btn--primary" onClick={() => setView("new")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Ticket
          </button>
        )}
        {view === "new" && (
          <button className="sd-btn sd-btn--ghost" onClick={() => setView("list")}>← Back</button>
        )}
      </div>

      {/* Contact options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
            label: "WhatsApp", sub: "+91-8264796534", href: "https://wa.me/918264796534", color: "#16a34a",
          },
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
            label: "Email", sub: "projects@webxter.in", href: "mailto:projects@webxter.in", color: "#009fd4",
          },
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
            label: "Call", sub: "+91-8264796534", href: "tel:+918264796534", color: "#7c3aed",
          },
        ].map((c) => (
          <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, textDecoration: "none", transition: "all .15s", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.boxShadow = `0 4px 14px ${c.color}22`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,.05)"; }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0 }}>{c.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: ".875rem", color: "#0f172a" }}>{c.label}</div>
              <div style={{ fontSize: ".75rem", color: "#64748b" }}>{c.sub}</div>
            </div>
          </a>
        ))}
      </div>

      {view === "new" ? (
        <div className="sd-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 20 }}>Submit a Support Ticket</div>
          {submitted ? (
            <div className="sd-alert sd-alert--success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
              Ticket submitted! We'll respond within 24 hours via email or WhatsApp.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="sd-form" noValidate>
              <div className="sd-form__grid">
                <div className="sd-field">
                  <label className="sd-field__label">Subject *</label>
                  <input className={`sd-field__input${errors.subject ? " sd-field__input--error" : ""}`}
                    placeholder="e.g. Can't access project files" value={form.subject} onChange={set("subject")} />
                  {errors.subject && <p style={{ fontSize: ".75rem", color: "#ef4444" }}>{errors.subject}</p>}
                </div>
                <div className="sd-field">
                  <label className="sd-field__label">Category *</label>
                  <select className={`sd-field__input${errors.category ? " sd-field__input--error" : ""}`}
                    value={form.category} onChange={set("category")}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {errors.category && <p style={{ fontSize: ".75rem", color: "#ef4444" }}>{errors.category}</p>}
                </div>
              </div>
              <div className="sd-field">
                <label className="sd-field__label">Message *</label>
                <textarea className={`sd-field__input${errors.message ? " sd-field__input--error" : ""}`}
                  placeholder="Describe your issue in detail. Include your order ID if relevant."
                  value={form.message} onChange={set("message")} rows={5} />
                {errors.message && <p style={{ fontSize: ".75rem", color: "#ef4444" }}>{errors.message}</p>}
                <p className="sd-field__hint">{form.message.length} characters</p>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="sd-btn sd-btn--ghost" onClick={() => setView("list")}>Cancel</button>
                <button type="submit" className="sd-btn sd-btn--primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Submit Ticket
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 14 }}>
            My Tickets {tickets.length > 0 && <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: ".82rem" }}>({tickets.length})</span>}
          </div>
          {tickets.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
              <h3>No tickets yet</h3>
              <p>Submit a ticket if you need help with your order or project files.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tickets.map((t) => (
                <div key={t.id} className="sd-ticket sd-ticket--clickable" onClick={() => setSelectedTicket(t)}>
                  <div className="sd-ticket__header">
                    <span className="sd-ticket__id">{t.id}</span>
                    <span className={`sd-badge ${STATUS_BADGE[t.status] || "sd-badge--gray"}`}>{t.status}</span>
                    {t.category && <span className="sd-badge sd-badge--blue">{t.category}</span>}
                  </div>
                  <div className="sd-ticket__subject">{t.subject}</div>
                  <div className="sd-ticket__body sd-ticket__body--preview">{t.message}</div>
                  <div className="sd-ticket__footer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Submitted {t.createdAt}
                    <span style={{ marginLeft: "auto", color: "#009fd4", fontSize: ".75rem", fontWeight: 600 }}>View →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Ticket detail modal ── */}
      {selectedTicket && (
        <div className="sd-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sd-modal__header">
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>{selectedTicket.subject}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span className="sd-ticket__id">{selectedTicket.id}</span>
                  <span className={`sd-badge ${STATUS_BADGE[selectedTicket.status] || "sd-badge--gray"}`}>{selectedTicket.status}</span>
                  {selectedTicket.category && <span className="sd-badge sd-badge--blue">{selectedTicket.category}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="sd-modal__close">×</button>
            </div>

            {/* Meta rows */}
            <div className="sd-modal__row">
              <span>Ticket ID</span>
              <span style={{ fontFamily: "monospace", color: "#009fd4" }}>{selectedTicket.id}</span>
            </div>
            <div className="sd-modal__row">
              <span>Submitted</span>
              <span>{selectedTicket.createdAt}</span>
            </div>
            {selectedTicket.email && (
              <div className="sd-modal__row">
                <span>Email</span>
                <span>{selectedTicket.email}</span>
              </div>
            )}

            {/* Message body */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 8 }}>
                Message
              </div>
              <div style={{
                background: "#f8f9fb", border: "1px solid #e2e8f0",
                borderRadius: 10, padding: "14px 16px",
                fontSize: ".875rem", color: "#334155", lineHeight: 1.7,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                maxHeight: 260, overflowY: "auto"
              }}>
                {selectedTicket.message}
              </div>
            </div>

            {/* Response notice */}
            <div className="sd-alert sd-alert--warn" style={{ marginTop: 16 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>We'll respond within 24 hours via email or WhatsApp <strong>+91-8264796534</strong></span>
            </div>

            <button className="sd-btn sd-btn--ghost sd-btn--full" style={{ marginTop: 16 }} onClick={() => setSelectedTicket(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
