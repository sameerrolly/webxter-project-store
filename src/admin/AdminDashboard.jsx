import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { getAnalytics, getOrders } from "./adminStore";

const STATUS_BADGE = {
  completed: "adm-badge--green",
  pending:   "adm-badge--yellow",
  cancelled: "adm-badge--red",
};

function StatCard({ label, value, icon, change, changeDown }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-card__icon">{icon}</div>
      <div className="adm-stat-card__label">{label}</div>
      <div className="adm-stat-card__value">{value}</div>
      {change && <div className={`adm-stat-card__change ${changeDown ? "adm-stat-card__change--down" : ""}`}>{change}</div>}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="adm-bar-chart">
      {data.map((d) => (
        <div key={d.label} className="adm-bar-chart__col">
          <div className="adm-bar-chart__bar" style={{ height: `${Math.round((d.revenue / max) * 100)}%` }} title={`₹${d.revenue.toLocaleString("en-IN")}`} />
          <div className="adm-bar-chart__label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const analytics = useMemo(() => getAnalytics(), []);
  const recentOrders = useMemo(() => getOrders().slice(0, 5), []);

  return (
    <AdminLayout>
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Dashboard</div>
          <div className="adm-page-header__sub">Welcome back, Admin</div>
        </div>
        <Link to="/admin/projects/new" className="adm-btn adm-btn--primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Project
        </Link>
      </div>

      {/* Stat cards */}
      <div className="adm-stats">
        <StatCard label="Total Revenue" value={`₹${analytics.totalRevenue.toLocaleString("en-IN")}`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          change="↑ from completed orders" />
        <StatCard label="Total Orders" value={analytics.totalOrders}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
          change={`${analytics.completedOrders} completed`} />
        <StatCard label="Active Projects" value={analytics.activeProjects}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
          change="Listed on store" />
        <StatCard label="Conversion Rate" value={`${analytics.conversionRate}%`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          change={`${analytics.pendingOrders} pending`} />
      </div>

      {/* Charts row */}
      <div className="adm-charts-row">
        {/* Revenue chart */}
        <div className="adm-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a" }}>Revenue (Last 6 Months)</div>
          </div>
          <BarChart data={analytics.monthlyRevenue} />
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {analytics.monthlyRevenue.map((d) => (
              <div key={d.label} style={{ fontSize: ".72rem", color: "#64748b" }}>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{d.label}</span>{" "}
                ₹{d.revenue.toLocaleString("en-IN")}
              </div>
            ))}
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="adm-card">
          <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 20 }}>Payment Methods</div>
          <div className="adm-donut">
            <div className="adm-donut__ring" />
            <div className="adm-donut__legend">
              {[
                { label: "UPI / GPay", color: "#009fd4", count: analytics.payBreakdown.upi },
                { label: "WhatsApp", color: "#ff6eff", count: analytics.payBreakdown.whatsapp },
                { label: "Bank", color: "#e2e8f0", count: analytics.payBreakdown.bank },
              ].map((item) => (
                <div key={item.label} className="adm-donut__legend-item">
                  <div className="adm-donut__dot" style={{ background: item.color }} />
                  {item.label} <strong style={{ marginLeft: 4 }}>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#0f172a", marginBottom: 10 }}>Top Projects</div>
            {analytics.topProjects.map((p, i) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: ".78rem", color: "#334155", borderBottom: i < analytics.topProjects.length - 1 ? "1px solid #f8f9fb" : "none" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{p.name}</span>
                <span className="adm-badge adm-badge--blue">{p.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="adm-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a" }}>Recent Orders</div>
          <Link to="/admin/orders" className="adm-btn adm-btn--ghost adm-btn--sm">View All</Link>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Project</th>
                <th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><span style={{ fontWeight: 600, color: "#009fd4" }}>{o.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: ".875rem" }}>{o.customer}</div>
                    <div style={{ fontSize: ".75rem", color: "#94a3b8" }}>{o.email}</div>
                  </td>
                  <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.project}</td>
                  <td style={{ fontWeight: 700 }}>₹{o.amount.toLocaleString("en-IN")}</td>
                  <td><span className={`adm-badge ${STATUS_BADGE[o.status] || "adm-badge--gray"}`}>{o.status}</span></td>
                  <td style={{ color: "#94a3b8", fontSize: ".8rem" }}>{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
