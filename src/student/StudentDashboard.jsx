import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "./StudentLayout";
import { getStudentSession, getStudentOrders } from "./studentStore";

const STATUS_BADGE = {
  completed: "sd-badge--green",
  pending:   "sd-badge--yellow",
  cancelled: "sd-badge--red",
};

export default function StudentDashboard() {
  const session    = getStudentSession();
  const orders     = useMemo(() => getStudentOrders(session?.email || ""), [session]);
  const completed  = orders.filter((o) => o.status === "completed");
  const pending    = orders.filter((o) => o.status === "pending");
  const totalSpent = completed.reduce((s, o) => s + o.amount, 0);
  const recent     = orders.slice(0, 5);

  return (
    <StudentLayout title="Overview">

      {/* ── Welcome banner ── */}
      <div className="sd-welcome-banner">
        <div>
          <div className="sd-welcome-banner__title">
            Welcome back, {session?.name?.split(" ")[0] || "Student"}!
          </div>
          <div className="sd-welcome-banner__sub">
            {completed.length > 0
              ? `${completed.length} project${completed.length > 1 ? "s" : ""} ready to download.`
              : "Browse our projects and place your first order."}
          </div>
        </div>
        <Link to="/student/orders" className="sd-btn sd-btn--primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          My Orders
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="sd-stats">
        {[
          { label: "Total Orders", value: orders.length,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
          { label: "Completed", value: completed.length,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { label: "Pending", value: pending.length,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}`,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
        ].map((s) => (
          <div key={s.label} className="sd-stat">
            <div className="sd-stat__icon">{s.icon}</div>
            <div className="sd-stat__label">{s.label}</div>
            <div className="sd-stat__value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="sd-dashboard-grid">

        {/* Recent orders */}
        <div className="sd-card">
          <div className="sd-card-header">
            <div className="sd-card-header__title">Recent Orders</div>
            <Link to="/student/orders" className="sd-btn sd-btn--ghost sd-btn--sm">View All</Link>
          </div>

          {recent.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                </svg>
              </div>
              <h3>No orders yet</h3>
              <p>Browse our projects and place your first order.</p>
              <Link to="/" className="sd-btn sd-btn--primary sd-btn--sm" style={{ marginTop: 8 }}>Browse Projects</Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="sd-recent-table">
                <table className="sd-table">
                  <thead>
                    <tr><th>Order</th><th>Project</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: "#009fd4", fontFamily: "monospace", fontSize: ".82rem" }}>{o.id}</span>
                          <div style={{ fontSize: ".72rem", color: "#94a3b8" }}>{o.date}</div>
                        </td>
                        <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: ".85rem" }}>{o.project}</td>
                        <td style={{ fontWeight: 700, color: "#009fd4" }}>₹{o.amount.toLocaleString("en-IN")}</td>
                        <td><span className={`sd-badge ${STATUS_BADGE[o.status] || "sd-badge--gray"}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sd-recent-mobile">
                {recent.map((o) => (
                  <div key={o.id} className="sd-recent-mobile__item">
                    <div className="sd-recent-mobile__top">
                      <span className="sd-recent-mobile__id">{o.id}</span>
                      <span className={`sd-badge ${STATUS_BADGE[o.status] || "sd-badge--gray"}`}>{o.status}</span>
                    </div>
                    <div className="sd-recent-mobile__project">{o.project}</div>
                    <div className="sd-recent-mobile__bottom">
                      <span className="sd-recent-mobile__date">{o.date}</span>
                      <span className="sd-recent-mobile__amount">₹{o.amount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right column */}
        <div className="sd-dashboard-right">

          {/* Quick actions */}
          <div className="sd-card">
            <div className="sd-card-header">
              <div className="sd-card-header__title">Quick Actions</div>
            </div>
            <div className="sd-quick-actions-list">
              {[
                { label: "My Orders & Downloads", to: "/student/orders",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg> },
                { label: "Edit Profile",          to: "/student/profile", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { label: "Get Support",           to: "/student/support", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                { label: "Browse Projects",       to: "/",                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
              ].map((a) => (
                <Link key={a.label} to={a.to} className="sd-quick-action">
                  <span className="sd-quick-action__icon">{a.icon}</span>
                  <span className="sd-quick-action__label">{a.label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sd-quick-action__arrow">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="sd-card sd-support-card">
            <div className="sd-support-card__title">Need Help?</div>
            <div className="sd-support-card__body">
              Our team is available 24/7 via WhatsApp and email.
            </div>
            <a href="https://wa.me/918264796534" target="_blank" rel="noopener noreferrer"
              className="sd-btn sd-btn--primary sd-btn--sm sd-btn--full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              WhatsApp Support
            </a>
          </div>

        </div>
      </div>

    </StudentLayout>
  );
}
