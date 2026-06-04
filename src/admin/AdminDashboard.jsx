import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { fetchAdminDashboard, fetchAdminOrders, updateAdminOrderStatus, extractApiError } from "./adminApi";

const RANGES = [
  { key: "1W", label: "1 Week"   },
  { key: "1M", label: "1 Month"  },
  { key: "3M", label: "3 Months" },
  { key: "6M", label: "6 Months" },
  { key: "1Y", label: "1 Year"   },
];

const PAID_STATUSES = new Set(["delivered", "completed"]);

const STATUS_BADGE = {
  pending:"adm-badge--yellow", confirmed:"adm-badge--blue",
  in_progress:"adm-badge--blue", delivered:"adm-badge--green",
  completed:"adm-badge--green", cancelled:"adm-badge--red",
};
const STATUS_OPTIONS = ["pending","confirmed","in_progress","delivered","cancelled"];
const STATUS_LABEL = {
  pending:"Pending", confirmed:"Confirmed", in_progress:"In Progress",
  delivered:"Delivered", completed:"Completed", cancelled:"Cancelled",
};
const PAY_LABEL = {
  upi:"UPI / GPay", whatsapp:"WhatsApp", bank:"Bank Transfer",
  razorpay:"Razorpay", other:"Other",
};

// ─── Normalise any order shape into consistent fields ─────────────────────────
function normOrder(o) {
  const notes = o.notes || "";
  const extract = (key) => {
    const m = notes.match(new RegExp(key + ":\\s*([^|\\n]+)"));
    return m ? m[1].trim() : "";
  };

  // Customer name — handles Django nested student obj, DRF flat fields, local fallbacks
  let customerName =
    o.customer_name ||
    o.client_name ||
    o.customer ||
    "";
  if (!customerName && o.student) {
    customerName = [o.student.first_name, o.student.last_name].filter(Boolean).join(" ");
  }
  if (!customerName) customerName = extract("Customer");
  if (!customerName) customerName = "—";

  const email =
    o.email ||
    o.client_email ||
    (o.student && o.student.email) ||
    extract("Email") ||
    "";

  const project =
    o.project_title ||
    o.project ||
    (o.project_obj && o.project_obj.title) ||
    "";

  const amount = parseFloat(o.final_amount ?? o.total_amount ?? o.amount ?? 0) || 0;
  const date   = (o.date || o.created_at || "").split("T")[0];
  const payMethod = o.pay_method || o.payMethod || extract("Payment") || "razorpay";

  return {
    ...o,
    _name:      customerName,
    _email:     email,
    _project:   project,
    _amount:    amount,
    _date:      date,
    _payMethod: payMethod,
    _phone:     o.phone || extract("Phone") || "",
    _college:   o.college || extract("College") || "",
  };
}

// ─── Analytics from normed orders ────────────────────────────────────────────
function computeAnalytics(normed, range) {
  const now  = new Date();
  const days = { "1W":7, "1M":30, "3M":90, "6M":180, "1Y":365 }[range] || 30;
  const from = new Date(now.getTime() - days * 86400000);

  // Exclude demo orders from revenue
  const real = normed.filter((o) => !o._isDemo);

  const inRange = real.filter((o) => new Date(o._date || 0) >= from);
  const paid    = inRange.filter((o) => PAID_STATUSES.has(o.status));

  const totalRevenue = paid.reduce((s, o) => s + o._amount, 0);

  // Payment breakdown — all-time paid
  const allPaid = real.filter((o) => PAID_STATUSES.has(o.status));
  const payBreakdown = { razorpay:0, upi:0, whatsapp:0, bank:0, other:0 };
  allPaid.forEach((o) => {
    const m = o._payMethod.toLowerCase();
    if (m in payBreakdown) payBreakdown[m]++;
    else payBreakdown.other++;
  });

  // Revenue series
  const series = buildSeries(paid, range, now);

  // Top projects
  const projMap = {};
  paid.forEach((o) => {
    const n = o._project || "Unknown";
    if (!projMap[n]) projMap[n] = { name:n, count:0, revenue:0 };
    projMap[n].count++;
    projMap[n].revenue += o._amount;
  });
  const topProjects = Object.values(projMap).sort((a,b) => b.revenue - a.revenue).slice(0,5);

  return {
    totalRevenue,
    totalOrders:     inRange.length,
    completedOrders: paid.length,
    pendingOrders:   inRange.filter((o) => o.status === "pending").length,
    cancelledOrders: inRange.filter((o) => o.status === "cancelled").length,
    payBreakdown, series, topProjects,
  };
}

function buildSeries(paid, range, now) {
  if (range === "1W") {
    return Array.from({ length:7 }, (_, i) => {
      const d  = new Date(now); d.setDate(d.getDate() - (6-i));
      const ds = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", { weekday:"short" });
      const revenue = paid.filter((o) => o._date === ds).reduce((s,o) => s + o._amount, 0);
      return { label, revenue };
    });
  }
  if (range === "1M") {
    return Array.from({ length:4 }, (_, i) => {
      const end   = new Date(now); end.setDate(end.getDate() - i*7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      const revenue = paid
        .filter((o) => { const d = new Date(o._date||0); return d >= start && d <= end; })
        .reduce((s,o) => s + o._amount, 0);
      return { label:`W${4-i}`, revenue };
    }).reverse();
  }
  const months = { "3M":3, "6M":6, "1Y":12 }[range] || 6;
  return Array.from({ length:months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months-1-i), 1);
    const fmt = range === "1Y" ? { month:"short", year:"2-digit" } : { month:"short" };
    const label = d.toLocaleDateString("en-IN", fmt);
    const revenue = paid
      .filter((o) => {
        const od = new Date(o._date||0);
        return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
      })
      .reduce((s,o) => s + o._amount, 0);
    return { label, revenue };
  });
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="adm-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="adm-bar-chart__col">
          <div className="adm-bar-chart__bar-wrap">
            <div
              className="adm-bar-chart__bar"
              style={{ height:`${Math.max(2, Math.round((d.revenue/max)*100))}%` }}
            >
              {d.revenue > 0 && (
                <span className="adm-bar-chart__tooltip">
                  ₹{Math.round(d.revenue).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
          <div className="adm-bar-chart__label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
const DONUT_COLORS = ["#009fd4","#ff6eff","#f59e0b","#22c55e","#8b5cf6"];

function DonutChart({ breakdown }) {
  const entries = Object.entries(breakdown).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
  const total = entries.reduce((s,[,v]) => s+v, 0) || 1;
  let offset = 0;
  const segs = entries.map(([key,val],i) => {
    const pct = (val/total)*100;
    const s = { key, val, pct, offset, color:DONUT_COLORS[i % DONUT_COLORS.length] };
    offset += pct;
    return s;
  });
  const conic = segs.length === 0
    ? "#e2e8f0 0deg 360deg"
    : segs.map((s) => `${s.color} ${s.offset.toFixed(1)}% ${(s.offset+s.pct).toFixed(1)}%`).join(", ");

  return (
    <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
      <div style={{ width:96, height:96, borderRadius:"50%", flexShrink:0, background:`conic-gradient(${conic})`, position:"relative" }}>
        <div style={{ position:"absolute", inset:18, borderRadius:"50%", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:".65rem", color:"#64748b", fontWeight:600 }}>Total</span>
          <span style={{ fontSize:".9rem", fontWeight:800, color:"#0f172a" }}>{total}</span>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1, minWidth:120 }}>
        {segs.map((s) => (
          <div key={s.key} style={{ display:"flex", alignItems:"center", gap:8, fontSize:".78rem" }}>
            <div style={{ width:10, height:10, borderRadius:2, background:s.color, flexShrink:0 }} />
            <span style={{ flex:1, color:"#334155" }}>{PAY_LABEL[s.key] || s.key}</span>
            <strong style={{ color:"#0f172a" }}>{s.val}</strong>
            <span style={{ color:"#94a3b8", minWidth:30, textAlign:"right" }}>{s.pct.toFixed(0)}%</span>
          </div>
        ))}
        {segs.length === 0 && <span style={{ color:"#94a3b8", fontSize:".8rem" }}>No data yet</span>}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, sub, highlight }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-card__icon">{icon}</div>
      <div className="adm-stat-card__label">{label}</div>
      <div className="adm-stat-card__value" style={highlight ? {
        background:"linear-gradient(45deg,#009fd4,#ff6eff)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
      } : {}}>{value}</div>
      {sub && <div className="adm-stat-card__change">{sub}</div>}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #e2e8f0", borderTopColor:"#009fd4", animation:"adm-spin .7s linear infinite" }} />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [range,        setRange]    = useState("1M");
  const [normed,       setNormed]   = useState([]);
  const [apiStats,     setApiStats] = useState(null);
  const [loading,      setLoading]  = useState(true);
  const [error,        setError]    = useState("");
  const [selected,     setSelected] = useState(null);
  const [statusSaving, setSaving]   = useState(null);

  const load = useCallback(async (r) => {
    setLoading(true); setError("");
    try {
      const [ordsResult, dashResult] = await Promise.allSettled([
        fetchAdminOrders(),
        fetchAdminDashboard(r),
      ]);

      let rawOrders = [];
      if (ordsResult.status === "fulfilled" && Array.isArray(ordsResult.value) && ordsResult.value.length > 0) {
        rawOrders = ordsResult.value;
      } else {
        // Fall back to demo data from store
        const { getOrders } = await import("./adminStore");
        rawOrders = getOrders();
      }
      setNormed(rawOrders.map(normOrder));

      if (dashResult.status === "fulfilled") setApiStats(dashResult.value);
      else setApiStats(null);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range]);

  const handleStatusChange = async (id, status) => {
    setSaving(id);
    try {
      const updated = await updateAdminOrderStatus(id, status);
      setNormed((prev) => prev.map((o) => o.id === id ? normOrder({ ...o, ...updated }) : o));
      if (selected?.id === id) setSelected((s) => normOrder({ ...s, ...updated }));
    } catch (err) { alert(extractApiError(err)); }
    finally { setSaving(null); }
  };

  const analytics = computeAnalytics(normed, range);
  const s = {
    totalRevenue:    analytics.totalRevenue,
    totalOrders:     analytics.totalOrders,
    completedOrders: analytics.completedOrders,
    pendingOrders:   analytics.pendingOrders,
    cancelledOrders: analytics.cancelledOrders,
    activeProjects:  apiStats?.active_projects ?? 0,
    series:          analytics.series,
    topProjects:     analytics.topProjects,
    payBreakdown:    analytics.payBreakdown,
  };
  const convRate = s.totalOrders > 0 ? Math.round((s.completedOrders / s.totalOrders) * 100) : 0;
  const rangeLabel = RANGES.find((r) => r.key === range)?.label || "";

  return (
    <AdminLayout>
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-header__title">Dashboard</div>
          <div className="adm-page-header__sub">Welcome back, Admin</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {/* Range picker */}
          <div style={{ display:"flex", gap:3, background:"#f8f9fb", borderRadius:10, padding:3, border:"1px solid #e2e8f0" }}>
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{
                padding:"5px 11px", borderRadius:8, border:"none",
                fontSize:".75rem", fontWeight:600, cursor:"pointer",
                background: range === r.key ? "#009fd4" : "transparent",
                color: range === r.key ? "#fff" : "#64748b",
                transition:"all .15s",
              }}>{r.label}</button>
            ))}
          </div>
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => load(range)} disabled={loading}>
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
        <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:10, padding:"12px 16px", color:"#dc2626", fontSize:".875rem", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
          <button onClick={() => load(range)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#dc2626", fontWeight:600, fontSize:".82rem" }}>Retry</button>
        </div>
      )}

      {loading ? <Spinner /> : (<>
        {/* Stat cards */}
        <div className="adm-stats">
          <StatCard highlight label="Total Revenue"
            value={`₹${Math.round(s.totalRevenue).toLocaleString("en-IN")}`}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            sub={`${s.completedOrders} paid orders · ${rangeLabel}`} />
          <StatCard label="Total Orders" value={s.totalOrders}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
            sub={`${s.pendingOrders} pending · ${s.cancelledOrders} cancelled`} />
          <StatCard label="Active Projects" value={s.activeProjects || "—"}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
            sub="Listed on store" />
          <StatCard label="Conversion Rate" value={`${convRate}%`}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            sub="Paid / total orders" />
        </div>

        {/* Charts row */}
        <div className="adm-charts-row">
          <div className="adm-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:8 }}>
              <div style={{ fontWeight:700, fontSize:".95rem", color:"#0f172a" }}>Revenue — {rangeLabel}</div>
              <div style={{ fontSize:".82rem", color:"#009fd4", fontWeight:700 }}>
                ₹{Math.round(s.totalRevenue).toLocaleString("en-IN")} total
              </div>
            </div>
            {s.series.some((d) => d.revenue > 0)
              ? <BarChart data={s.series} />
              : <div style={{ color:"#94a3b8", fontSize:".85rem", textAlign:"center", padding:"32px 0" }}>No revenue in this period</div>
            }
          </div>

          <div className="adm-card">
            <div style={{ fontWeight:700, fontSize:".95rem", color:"#0f172a", marginBottom:18 }}>Payment Methods</div>
            <DonutChart breakdown={s.payBreakdown} />
            {s.topProjects.length > 0 && (
              <div style={{ marginTop:20, borderTop:"1px solid #f1f5f9", paddingTop:16 }}>
                <div style={{ fontWeight:700, fontSize:".85rem", color:"#0f172a", marginBottom:10 }}>Top Projects by Revenue</div>
                {s.topProjects.map((p, i) => (
                  <div key={p.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", fontSize:".78rem", color:"#334155", borderBottom: i < s.topProjects.length-1 ? "1px solid #f8f9fb" : "none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                      <span style={{ width:18, height:18, borderRadius:4, background:"linear-gradient(45deg,#009fd4,#ff6eff)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".6rem", fontWeight:800, flexShrink:0 }}>{i+1}</span>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
                      <span className="adm-badge adm-badge--blue">{p.count} orders</span>
                      {p.revenue > 0 && <span style={{ fontSize:".75rem", fontWeight:700, color:"#009fd4" }}>₹{Math.round(p.revenue).toLocaleString("en-IN")}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="adm-card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ fontWeight:700, fontSize:".95rem", color:"#0f172a" }}>Recent Orders</div>
            <Link to="/admin/orders" className="adm-btn adm-btn--ghost adm-btn--sm">View All</Link>
          </div>
          {normed.length === 0 ? (
            <div className="adm-empty"><h3>No orders yet</h3></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Order ID</th><th>Customer</th><th>Project</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {normed.slice(0, 8).map((o) => (
                    <tr key={o.id} style={{ cursor:"pointer" }} onClick={() => setSelected(o)}>
                      <td>
                        <span style={{ fontWeight:600, color:"#009fd4" }}>{o.id}</span>
                        {o._isDemo && (
                          <span style={{ marginLeft:6, fontSize:".6rem", background:"#fef3c7", color:"#d97706", border:"1px solid #fde68a", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>DEMO</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:".875rem", color:"#0f172a" }}>
                          {o._name || "—"}
                        </div>
                        <div style={{ fontSize:".75rem", color:"#94a3b8" }}>{o._email || "—"}</div>
                      </td>
                      <td style={{ maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:".85rem" }}>
                        {o._project || "—"}
                      </td>
                      <td style={{ fontWeight:700, color: o._amount > 0 ? "#0f172a" : "#94a3b8" }}>
                        {o._amount > 0 ? `₹${o._amount.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td><span className={`adm-badge ${STATUS_BADGE[o.status] || "adm-badge--gray"}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                      <td style={{ color:"#94a3b8", fontSize:".8rem" }}>{o._date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>)}

      {/* Order detail modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
          onClick={() => setSelected(null)}>
          <div style={{ background:"#fff", borderRadius:18, padding:32, maxWidth:480, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.2)", maxHeight:"90vh", overflowY:"auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:"1.1rem", color:"#0f172a" }}>Order #{selected.id}</div>
                <span className={`adm-badge ${STATUS_BADGE[selected.status] || "adm-badge--gray"}`} style={{ marginTop:6, display:"inline-flex" }}>
                  {STATUS_LABEL[selected.status] || selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:"1.4rem", lineHeight:1 }}>×</button>
            </div>
            {[
              ["Customer", selected._name],
              ["Email",    selected._email],
              ["Phone",    selected._phone || "—"],
              ["College",  selected._college || "—"],
              ["Project",  selected._project],
              ["Amount",   selected._amount > 0 ? `₹${selected._amount.toLocaleString("en-IN")}` : "—"],
              ["Payment",  PAY_LABEL[selected._payMethod] || selected._payMethod || "Razorpay"],
              ["Date",     selected._date],
            ].map(([k, v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:".875rem" }}>
                <span style={{ color:"#64748b", fontWeight:500 }}>{k}</span>
                <span style={{ color:"#0f172a", fontWeight:600, textAlign:"right", maxWidth:"60%", wordBreak:"break-word" }}>{v || "—"}</span>
              </div>
            ))}
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:".78rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".4px", marginBottom:10 }}>Update Status</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {STATUS_OPTIONS.map((st) => (
                  <button key={st} disabled={statusSaving === selected.id}
                    onClick={() => handleStatusChange(selected.id, st)}
                    className={`adm-btn adm-btn--sm ${selected.status === st ? "adm-btn--primary" : "adm-btn--ghost"}`}>
                    {STATUS_LABEL[st]}
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
