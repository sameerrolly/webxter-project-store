import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  fetchAdminDashboard,
  fetchAdminOrders,
  updateAdminOrderStatus,
  extractApiError,
} from "./adminApi";

const STATUS_BADGE = {
  completed: "adm-badge--green",
  pending:   "adm-badge--yellow",
  cancelled: "adm-badge--red",
};
const STATUS_OPTIONS = ["pending", "completed", "cancelled"];
const PAY_LABEL = { upi: "UPI / GPay", whatsapp: "WhatsApp", bank: "Bank Transfer" };

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, change }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-card__icon">{icon}</div>
      <div className="adm-stat-card__label">{label}</div>
      <div className="adm-stat-card__value">{value}</div>
      {change && <div className="adm-stat-card__change">{change}</div>}
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenue ?? d.value ?? 0), 1);
  return (
    <div className="adm-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="adm-bar-chart__col">
          <div
            className="adm-bar-chart__bar"
            style={{ height: `${Math.round(((d.revenue ?? d.value ?? 0) / max) * 100)}%` }}
            title={`₹${(d.revenue ?? d.value ?? 0).toLocaleString("en-IN")}`}
          />
          <div className="adm-bar-chart__label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#009fd4", animation: "adm-spin .7s linear infinite" }} />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,        setStats]        = useState(null);
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [selected,     setSelected]     = useState(null);
  const [statusSaving, setStatusSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, ords] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminOrders(),
      ]);
      setStats(dash);
      setOrders(ords);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id, status) => {
    setStatusSaving(id);
    try {
      const updated = await updateAdminOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      if (selected?.id === id) setSelected((s) => ({ ...s, ...updated }));
    } catch (err) {
      alert(extractApiError(err));
    } finally {
      setStatusSaving(null);
    }
  };

  const recentOrders = orders.slice(0, 5);

  // Normalise dashboard field names (snake_case from Django → camelCase)
  const s = stats ? {
    totalRevenue:    stats.total_revenue    ?? stats.totalRevenue    ?? 0,
    totalOrders:     stats.total_orders     ?? stats.totalOrders     ?? 0,
    completedOrders: stats.completed_orders ?? stats.completedOrders ?? 0,
    pendingOrders:   stats.pending_orders   ?? stats.pendingOrders   ?? 0,
    activeProjects:  stats.active_projects  ?? stats.activeProjects  ?? 0,
    conversionRate:  stats.conversion_rate  ?? stats.conversionRate  ?? 0,
    monthlyRevenue:  stats.monthly_revenue  ?? stats.monthlyRevenue  ?? [],
    topProjects:     stats.top_projects     ?? stats.topProjects     ?? [],
    payBreakdown:    stats.pay_breakdown    ?? stats.payBreakdown    ?? {},
  } : null;

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Dashboard</div>
          <div className="adm-page-header__sub">Welcome back, Admin</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={load} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          <Link to="/admin/projects/new" className="adm-btn adm-btn--primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Project
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: ".875rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
          <button onClick={load} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 600, fontSize: ".82rem" }}>Retry</button>
        </div>
      )}

      {loading ? <Spinner /> : s && (
        <>
          {/* Stat cards */}
          <div className="adm-stats">
            <StatCard label="Total Revenue"   value={`₹${s.totalRevenue.toLocaleString("en-IN")}`}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              change={`${s.completedOrders} completed orders`} />
            <StatCard label="Total Orders"    value={s.totalOrders}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
              change={`${s.pendingOrders} pending`} />
            <StatCard label="Active Projects" value={s.activeProjects}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
              change="Listed on store" />
            <StatCard label="Conversion Rate" value={`${s.conversionRate}%`}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              change="Orders / visits" />
          </div>

          {/* Charts row */}
          <div className="adm-charts-row">
            <div className="adm-card">
              <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 20 }}>Revenue (Last 6 Months)</div>
              {s.monthlyRevenue.length > 0
                ? <BarChart data={s.monthlyRevenue} />
                : <div style={{ color: "#94a3b8", fontSize: ".85rem", textAlign: "center", padding: 24 }}>No revenue data yet</div>
              }
            </div>

            <div className="adm-card">
              <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 20 }}>Payment Methods</div>
              <div className="adm-donut">
                <div className="adm-donut__ring" />
                <div className="adm-donut__legend">
                  {[
                    { label: "UPI / GPay", color: "#009fd4", count: s.payBreakdown.upi ?? 0 },
                    { label: "WhatsApp",   color: "#ff6eff", count: s.payBreakdown.whatsapp ?? 0 },
                    { label: "Bank",       color: "#e2e8f0", count: s.payBreakdown.bank ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="adm-donut__legend-item">
                      <div className="adm-donut__dot" style={{ background: item.color }} />
                      {item.label} <strong style={{ marginLeft: 4 }}>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {s.topProjects.length > 0 && (
                <div style={{ marginTop: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#0f172a", marginBottom: 10 }}>Top Projects</div>
                  {s.topProjects.map((p, i) => (
                    <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: ".78rem", color: "#334155", borderBottom: i < s.topProjects.length - 1 ? "1px solid #f8f9fb" : "none" }}>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{p.name}</span>
                      <span className="adm-badge adm-badge--blue">{p.count} orders</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div className="adm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a" }}>Recent Orders</div>
              <Link to="/admin/orders" className="adm-btn adm-btn--ghost adm-btn--sm">View All</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="adm-empty"><h3>No orders yet</h3></div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Project</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelected(o)}>
                        <td><span style={{ fontWeight: 600, color: "#009fd4" }}>{o.id}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: ".875rem" }}>{o.customer_name ?? o.customer}</div>
                          <div style={{ fontSize: ".75rem", color: "#94a3b8" }}>{o.email}</div>
                        </td>
                        <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.project_title ?? o.project}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(o.amount).toLocaleString("en-IN")}</td>
                        <td><span className={`adm-badge ${STATUS_BADGE[o.status] || "adm-badge--gray"}`}>{o.status}</span></td>
                        <td style={{ color: "#94a3b8", fontSize: ".8rem" }}>{o.date ?? o.created_at?.split("T")[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Order detail modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 32, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>{selected.id}</div>
                <div style={{ fontSize: ".8rem", color: "#94a3b8", marginTop: 2 }}>{selected.date ?? selected.created_at?.split("T")[0]}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
            </div>
            {[
              ["Customer", selected.customer_name ?? selected.customer],
              ["Email",    selected.email],
              ["Phone",    selected.phone || "—"],
              ["College",  selected.college || "—"],
              ["Project",  selected.project_title ?? selected.project],
              ["Amount",   `₹${Number(selected.amount).toLocaleString("en-IN")}`],
              ["Payment",  PAY_LABEL[selected.pay_method ?? selected.payMethod] || selected.pay_method || selected.payMethod],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: ".875rem" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>{k}</span>
                <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 10 }}>Update Status</div>
              <div style={{ display: "flex", gap: 8 }}>
                {STATUS_OPTIONS.map((st) => (
                  <button key={st} disabled={statusSaving === selected.id}
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
    </AdminLayout>
  );
}
