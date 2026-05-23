import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
  extractApiError,
} from "./adminApi";

const STATUS_OPTIONS = ["pending", "completed", "cancelled"];
const STATUS_BADGE   = { completed: "adm-badge--green", pending: "adm-badge--yellow", cancelled: "adm-badge--red" };
const PAY_LABEL      = { upi: "UPI / GPay", whatsapp: "WhatsApp", bank: "Bank Transfer" };

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
  const norm = (o) => ({
    ...o,
    customer: o.customer_name ?? o.customer ?? "",
    project:  o.project_title ?? o.project  ?? "",
    payMethod: o.pay_method   ?? o.payMethod ?? "",
    date:     (o.date ?? o.created_at ?? "").split("T")[0],
  });

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
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Orders</div>
          <div className="adm-page-header__sub">
            {orders.length} total · ₹{totalRevenue.toLocaleString("en-IN")} revenue
          </div>
        </div>
        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={load} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      <div className="adm-stats" style={{ marginBottom: 24 }}>
        {[
          { label: "Total",     value: orders.length,                                          cls: "adm-badge--blue"   },
          { label: "Completed", value: orders.filter((o) => o.status === "completed").length,  cls: "adm-badge--green"  },
          { label: "Pending",   value: orders.filter((o) => o.status === "pending").length,    cls: "adm-badge--yellow" },
          { label: "Cancelled", value: orders.filter((o) => o.status === "cancelled").length,  cls: "adm-badge--red"    },
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
          {["all", "pending", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`adm-btn adm-btn--sm ${statusFilter === s ? "adm-btn--primary" : "adm-btn--ghost"}`}
              style={{ textTransform: "capitalize" }}>
              {s}
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
                    <td><span className={`adm-badge ${STATUS_BADGE[o.status] || "adm-badge--gray"}`}>{o.status}</span></td>
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
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>)}
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
          <div className="adm-modal-box" style={{ background: "#fff", borderRadius: 18, padding: 32, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>{selected.id}</div>
                <div style={{ fontSize: ".8rem", color: "#94a3b8", marginTop: 2 }}>{selected.date}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.2rem" }}>×</button>
            </div>
            {[
              ["Customer", selected.customer],
              ["Email",    selected.email],
              ["Phone",    selected.phone || "—"],
              ["College",  selected.college || "—"],
              ["Project",  selected.project],
              ["Amount",   `₹${Number(selected.amount).toLocaleString("en-IN")}`],
              ["Payment",  PAY_LABEL[selected.payMethod] || selected.payMethod || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: ".875rem" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>{k}</span>
                <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: ".82rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Update Status</label>
              <div style={{ display: "flex", gap: 8 }}>
                {STATUS_OPTIONS.map((st) => (
                  <button key={st} disabled={saving === selected.id}
                    onClick={() => handleStatusChange(selected.id, st)}
                    className={`adm-btn adm-btn--sm ${selected.status === st ? "adm-btn--primary" : "adm-btn--ghost"}`}
                    style={{ textTransform: "capitalize", flex: 1 }}>
                    {st}
                  </button>
                ))}
              </div>
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
