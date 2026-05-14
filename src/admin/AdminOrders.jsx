import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { getOrders, updateOrderStatus } from "./adminStore";

const STATUS_OPTIONS = ["pending", "completed", "cancelled"];
const STATUS_BADGE = { completed: "adm-badge--green", pending: "adm-badge--yellow", cancelled: "adm-badge--red" };
const PAY_LABEL = { upi: "UPI / GPay", whatsapp: "WhatsApp", bank: "Bank Transfer" };

export default function AdminOrders() {
  const [orders, setOrders] = useState(() => getOrders());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.project.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (id, status) => {
    updateOrderStatus(id, status);
    setOrders(getOrders());
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0);

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Orders</div>
          <div className="adm-page-header__sub">
            {orders.length} total · ₹{totalRevenue.toLocaleString("en-IN")} revenue
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="adm-stats" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Orders", value: orders.length, cls: "adm-badge--blue" },
          { label: "Completed", value: orders.filter((o) => o.status === "completed").length, cls: "adm-badge--green" },
          { label: "Pending", value: orders.filter((o) => o.status === "pending").length, cls: "adm-badge--yellow" },
          { label: "Cancelled", value: orders.filter((o) => o.status === "cancelled").length, cls: "adm-badge--red" },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <div>
              <div className="adm-stat-card__label">{s.label}</div>
              <div className="adm-stat-card__value" style={{ fontSize: "1.5rem" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div className="adm-search" style={{ flex: "1 1 200px", maxWidth: 280 }}>
          <span className="adm-search__icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input className="adm-search__input" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
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

      <div className="adm-card" style={{ padding: 0 }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Project</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr>
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
                  <td style={{ fontWeight: 700, color: "#009fd4" }}>₹{o.amount.toLocaleString("en-IN")}</td>
                  <td><span className="adm-badge adm-badge--gray" style={{ fontSize: ".7rem" }}>{PAY_LABEL[o.payMethod] || o.payMethod}</span></td>
                  <td><span className={`adm-badge ${STATUS_BADGE[o.status] || "adm-badge--gray"}`}>{o.status}</span></td>
                  <td style={{ color: "#94a3b8", fontSize: ".8rem" }}>{o.date}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className="adm-field__input" style={{ padding: "5px 8px", fontSize: ".78rem", width: "auto" }}
                      value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="adm-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setSelected(null)}>
          <div className="adm-modal-box" style={{ background: "#fff", borderRadius: 18, padding: 32, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>{selected.id}</div>
                <div style={{ fontSize: ".8rem", color: "#94a3b8", marginTop: 2 }}>{selected.date}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.2rem" }}>×</button>
            </div>
            {[
              ["Customer", selected.customer],
              ["Email", selected.email],
              ["Phone", selected.phone],
              ["College", selected.college || "—"],
              ["Project", selected.project],
              ["Amount", `₹${selected.amount.toLocaleString("en-IN")}`],
              ["Payment", PAY_LABEL[selected.payMethod] || selected.payMethod],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: ".875rem" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>{k}</span>
                <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: ".82rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Update Status</label>
              <div style={{ display: "flex", gap: 8 }}>
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                    className={`adm-btn adm-btn--sm ${selected.status === s ? "adm-btn--primary" : "adm-btn--ghost"}`}
                    style={{ textTransform: "capitalize", flex: 1 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
