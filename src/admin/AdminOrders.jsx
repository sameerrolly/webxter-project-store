import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
  extractApiError,
} from "./adminApi";
import { addStudentNotification } from "../notificationStore";

// Backend status values
const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending"     },
  { value: "confirmed",   label: "Confirmed"   },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered",   label: "Delivered"   },
  { value: "cancelled",   label: "Cancelled"   },
];

const STATUS_BADGE = {
  pending:     "adm-badge--yellow",
  confirmed:   "adm-badge--blue",
  in_progress: "adm-badge--blue",
  delivered:   "adm-badge--green",
  completed:   "adm-badge--green",
  cancelled:   "adm-badge--red",
};

const STATUS_LABEL = {
  pending:     "Pending",
  confirmed:   "Confirmed",
  in_progress: "In Progress",
  delivered:   "Delivered",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

const PAY_LABEL = { upi: "UPI / GPay", whatsapp: "WhatsApp", bank: "Bank Transfer", razorpay: "Razorpay" };

// ─── License text generator ───────────────────────────────────────────────────
function generateLicense(order, template) {
  if (template) return template
    .replace(/\{order_id\}/g,   order.id)
    .replace(/\{project\}/g,    order.customer_name ?? order.customer ?? "")
    .replace(/\{customer\}/g,   order.customer_name ?? order.customer ?? "")
    .replace(/\{email\}/g,      order.email ?? "")
    .replace(/\{amount\}/g,     `₹${Number(order.amount || 0).toLocaleString("en-IN")}`)
    .replace(/\{date\}/g,       order.date ?? order.created_at ?? "")
    .replace(/\{year\}/g,       new Date().getFullYear());

  return `WEBXTER PROJECT LICENSE
========================
License ID   : LIC-${order.id}
Order ID     : ${order.id}
Project      : ${order.project ?? order.project_title ?? ""}
Licensed To  : ${order.customer_name ?? order.customer ?? ""}
Email        : ${order.email ?? "—"}
Amount Paid  : ₹${Number(order.amount || 0).toLocaleString("en-IN")}
Date         : ${order.date ?? (order.created_at ?? "").split("T")[0]}
Issued By    : Webxter (webxter.in)

TERMS OF USE
------------
1. Non-exclusive, non-transferable license for personal academic use only.
2. Redistribution or resale is strictly prohibited.
3. Webxter retains all intellectual property rights.

For support: projects@webxter.in | WhatsApp: +91-8264796534
© ${new Date().getFullYear()} Webxter. All rights reserved.`;
}

function generateInvoice(order, template) {
  if (template) return template
    .replace(/\{order_id\}/g,   order.id)
    .replace(/\{project\}/g,    order.project ?? order.project_title ?? "")
    .replace(/\{customer\}/g,   order.customer_name ?? order.customer ?? "")
    .replace(/\{email\}/g,      order.email ?? "")
    .replace(/\{amount\}/g,     `₹${Number(order.amount || 0).toLocaleString("en-IN")}`)
    .replace(/\{date\}/g,       order.date ?? (order.created_at ?? "").split("T")[0])
    .replace(/\{year\}/g,       new Date().getFullYear());

  return `WEBXTER — INVOICE
=================
Invoice No   : INV-${order.id}
Order ID     : ${order.id}
Date         : ${order.date ?? (order.created_at ?? "").split("T")[0]}
Issued By    : Webxter (webxter.in)

BILL TO
-------
Name         : ${order.customer_name ?? order.customer ?? ""}
Email        : ${order.email ?? "—"}

ITEM
----
Project      : ${order.project ?? order.project_title ?? ""}
Amount       : ₹${Number(order.amount || 0).toLocaleString("en-IN")}
Payment      : ${PAY_LABEL[order.payMethod ?? order.pay_method] ?? "Razorpay"}

TOTAL        : ₹${Number(order.amount || 0).toLocaleString("en-IN")}

Thank you for your purchase!
For support: projects@webxter.in | WhatsApp: +91-8264796534
© ${new Date().getFullYear()} Webxter. All rights reserved.`;
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#009fd4", animation: "adm-spin .7s linear infinite" }} />
    </div>
  );
}

export default function AdminOrders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected,     setSelected]     = useState(null);
  const [saving,       setSaving]       = useState(null);
  const [deleting,     setDeleting]     = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Normalise field names from Django (snake_case) or legacy (camelCase)
  const norm = (o) => {
    const notes = o.notes || "";
    const extract = (key) => {
      const m = notes.match(new RegExp(key + ":\\s*([^|]+)"));
      return m ? m[1].trim() : "";
    };
    const phone   = o.phone   || extract("Phone")   || "";
    const college = o.college || extract("College")  || "";
    const txnId   = o.txn_id  || extract("TxnID")   || "";
    const payMethod = o.pay_method ?? o.payMethod ?? extract("Payment") ?? "razorpay";

    // Amount: prefer final_amount (post-coupon) → total_amount → amount
    const amount = parseFloat(o.final_amount ?? o.total_amount ?? o.amount ?? 0) || 0;

    return {
      ...o,
      customer:  o.client_name   ?? o.customer_name ?? o.customer ?? "",
      email:     o.client_email  ?? o.email         ?? "",
      project:   o.project_title ?? o.project       ?? "",
      amount,
      payMethod,
      phone,
      college,
      txnId,
      date:      (o.date ?? o.created_at ?? "").split("T")[0],
      status:    o.status || "pending",
    };
  };

  const filtered = orders.map(norm).filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      o.customer.toLowerCase().includes(q) ||
      String(o.id).toLowerCase().includes(q) ||
      o.project.toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (id, status) => {
    setSaving(id);
    try {
      const updated = await updateAdminOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      if (selected?.id === id) setSelected((s) => ({ ...s, ...updated }));

      // ── Notify the student whose order was updated ──────────────────────
      const order = orders.find((o) => String(o.id) === String(id));
      const email = order?.email || order?.client_email || "";
      const project = order?.project_title || order?.project || `Order #${id}`;
      if (email) {
        const STATUS_MSG = {
          confirmed:   "Your order has been confirmed! We're getting started on it.",
          in_progress: "Great news — your project is now in progress!",
          delivered:   "Your project has been delivered! Check your email for files.",
          completed:   "Your order is complete. Download your files from My Orders.",
          cancelled:   "Your order has been cancelled. Contact support if this is a mistake.",
        };
        addStudentNotification(email.toLowerCase(), {
          type:  "order_status",
          title: `Order ${STATUS_LABEL[status] || status}`,
          body:  STATUS_MSG[status] || `Your order for "${project}" is now ${STATUS_LABEL[status] || status}.`,
          link:  "/student/orders",
        });
      }
      // ── End notification ────────────────────────────────────────────────

    } catch (err) {
      alert(extractApiError(err));
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteAdminOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(extractApiError(err));
    } finally {
      setDeleting(null);
      setConfirmDel(null);
    }
  };

  const totalRevenue = orders
    .map(norm)
    .filter((o) => o.status === "delivered" || o.status === "completed")
    .reduce((s, o) => s + (o.amount || 0), 0);

  const [licenseTemplate, setLicenseTemplate] = React.useState(
    () => localStorage.getItem("wx_admin_license_template") || ""
  );
  const [invoiceTemplate, setInvoiceTemplate] = React.useState(
    () => localStorage.getItem("wx_admin_invoice_template") || ""
  );
  const [showTemplateEditor, setShowTemplateEditor] = React.useState(false);

  const saveTemplates = () => {
    localStorage.setItem("wx_admin_license_template", licenseTemplate);
    localStorage.setItem("wx_admin_invoice_template", invoiceTemplate);
    setShowTemplateEditor(false);
  };

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Orders</div>
          <div className="adm-page-header__sub">
            {orders.length} total · ₹{totalRevenue.toLocaleString("en-IN")} revenue
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setShowTemplateEditor(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit License/Invoice
          </button>
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={load} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="adm-stats" style={{ marginBottom: 24 }}>
        {[
          { label: "Total",       value: orders.length },
          { label: "Delivered",   value: orders.filter((o) => o.status === "delivered" || o.status === "completed").length },
          { label: "In Progress", value: orders.filter((o) => o.status === "in_progress" || o.status === "confirmed").length },
          { label: "Pending",     value: orders.filter((o) => o.status === "pending").length },
          { label: "Cancelled",   value: orders.filter((o) => o.status === "cancelled").length },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <div>
              <div className="adm-stat-card__label">{s.label}</div>
              <div className="adm-stat-card__value" style={{ fontSize: "1.5rem" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: ".875rem", marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
          <button onClick={load} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 600, fontSize: ".82rem" }}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div className="adm-search" style={{ flex: "1 1 200px", maxWidth: 280 }}>
          <span className="adm-search__icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input className="adm-search__input" placeholder="Search orders…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="adm-filter-row" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "pending", "confirmed", "in_progress", "delivered", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`adm-btn adm-btn--sm ${statusFilter === s ? "adm-btn--primary" : "adm-btn--ghost"}`}>
              {STATUS_LABEL[s] || s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="adm-card" style={{ padding: 0 }}>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Project</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="adm-empty">
                      <div className="adm-empty__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></div>
                      <h3>No orders found</h3><p>Try adjusting your search or filter.</p>
                    </div>
                  </td></tr>
                ) : filtered.map((o) => (
                  <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelected(o)}>
                    <td><span style={{ fontWeight: 700, color: "#009fd4" }}>{o.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: ".875rem" }}>{o.customer}</div>
                      <div style={{ fontSize: ".75rem", color: "#94a3b8" }}>{o.email}</div>
                    </td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: ".85rem" }}>{o.project}</td>
                    <td style={{ fontWeight: 700, color: "#009fd4" }}>₹{Number(o.amount).toLocaleString("en-IN")}</td>
                    <td><span className="adm-badge adm-badge--gray" style={{ fontSize: ".7rem" }}>{PAY_LABEL[o.payMethod] || o.payMethod || "—"}</span></td>
                    <td><span className={`adm-badge ${STATUS_BADGE[o.status] || "adm-badge--gray"}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                    <td style={{ color: "#94a3b8", fontSize: ".8rem" }}>{o.date}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <select
                          className="adm-field__input"
                          style={{ padding: "5px 8px", fontSize: ".78rem", width: "auto" }}
                          value={o.status}
                          disabled={saving === o.id}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <button
                          className="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon"
                          title="Delete order"
                          disabled={deleting === o.id}
                          onClick={(e) => { e.stopPropagation(); setConfirmDel(o.id); }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selected && (
        <div className="adm-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setSelected(null)}>
          <div className="adm-modal-box" style={{ background: "#fff", borderRadius: 18, padding: 32, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>Order #{selected.id}</div>
                <span className={`adm-badge ${STATUS_BADGE[selected.status] || "adm-badge--gray"}`} style={{ marginTop: 6, display: "inline-flex" }}>
                  {STATUS_LABEL[selected.status] || selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
            </div>
            {[
              ["Customer", selected.customer],
              ["Email",    selected.email],
              ["Phone",    selected.phone || "—"],
              ["College",  selected.college || "—"],
              ["Project",  selected.project],
              ["Amount",   `₹${Number(selected.amount).toLocaleString("en-IN")}`],
              ["Payment",  PAY_LABEL[selected.payMethod] || selected.payMethod || "Razorpay"],
              ["Txn ID",   selected.txnId || "—"],
              ["Date",     selected.date],
              ["Notes",    selected.notes || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: ".875rem" }}>
                <span style={{ color: "#64748b", fontWeight: 500, flexShrink: 0, marginRight: 12 }}>{k}</span>
                <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", wordBreak: "break-word", maxWidth: "65%" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 10 }}>Update Status</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map((st) => (
                  <button key={st.value} disabled={saving === selected.id}
                    onClick={() => handleStatusChange(selected.id, st.value)}
                    className={`adm-btn adm-btn--sm ${selected.status === st.value ? "adm-btn--primary" : "adm-btn--ghost"}`}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 10 }}>Documents</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="adm-btn adm-btn--ghost adm-btn--sm"
                  onClick={() => downloadText(generateLicense(selected, licenseTemplate), `License-${selected.id}.txt`)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  License
                </button>
                <button className="adm-btn adm-btn--ghost adm-btn--sm"
                  onClick={() => downloadText(generateInvoice(selected, invoiceTemplate), `Invoice-${selected.id}.txt`)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                  Invoice
                </button>
                <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setShowTemplateEditor(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Templates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template editor modal */}
      {showTemplateEditor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setShowTemplateEditor(false)}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 32, maxWidth: 680, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>Edit License & Invoice Templates</div>
              <button onClick={() => setShowTemplateEditor(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.4rem" }}>×</button>
            </div>
            <div style={{ background: "rgba(0,159,212,.06)", border: "1px solid rgba(0,159,212,.2)", borderRadius: 10, padding: "10px 14px", fontSize: ".78rem", color: "#0369a1", marginBottom: 20 }}>
              Variables: <code>{"{order_id}"}</code> <code>{"{project}"}</code> <code>{"{customer}"}</code> <code>{"{email}"}</code> <code>{"{amount}"}</code> <code>{"{date}"}</code> <code>{"{year}"}</code> — Leave blank to use the default.
            </div>
            <div className="adm-field" style={{ marginBottom: 20 }}>
              <label className="adm-field__label">License Certificate Template</label>
              <textarea className="adm-field__input" rows={10} value={licenseTemplate}
                onChange={(e) => setLicenseTemplate(e.target.value)}
                placeholder="Leave blank to use default template…" />
            </div>
            <div className="adm-field" style={{ marginBottom: 24 }}>
              <label className="adm-field__label">Invoice Template</label>
              <textarea className="adm-field__input" rows={10} value={invoiceTemplate}
                onChange={(e) => setInvoiceTemplate(e.target.value)}
                placeholder="Leave blank to use default template…" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => { setLicenseTemplate(""); setInvoiceTemplate(""); }}>Reset to Default</button>
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowTemplateEditor(false)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={saveTemplates}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Save Templates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 10, color: "#0f172a" }}>Delete Order?</div>
            <p style={{ color: "#64748b", fontSize: ".875rem", marginBottom: 24 }}>This order will be permanently deleted and cannot be recovered.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="adm-btn adm-btn--danger" disabled={!!deleting} onClick={() => handleDelete(confirmDel)}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
