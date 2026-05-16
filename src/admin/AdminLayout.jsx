import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminLogout, getOrders } from "./adminStore";
import "./admin.css";

// ─── Build admin notifications ────────────────────────────────────────────────
function getAdminNotifications() {
  const items = [];
  const orders = getOrders();

  // Pending orders
  orders.filter((o) => o.status === "pending").forEach((o) => {
    items.push({
      id: `ord-${o.id}`,
      type: "order",
      title: "New Pending Order",
      body: `${o.customer} — ${o.project}`,
      date: o.date,
      link: "/admin/orders",
    });
  });

  // Open support tickets from all students
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wx_student_tickets_")) {
        const tickets = JSON.parse(localStorage.getItem(key) || "[]");
        tickets.filter((t) => t.status === "open").forEach((t) => {
          items.push({
            id: `tkt-${t.id}`,
            type: "ticket",
            title: "Open Support Ticket",
            body: `${t.email || "Student"} — ${t.subject}`,
            date: t.createdAt,
            link: "/admin/orders",
          });
        });
      }
    }
  } catch { /* ignore */ }

  return items;
}

const NAV = [
  {
    label: "Dashboard", path: "/admin/dashboard",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    label: "Projects", path: "/admin/projects",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  },
  {
    label: "Coupons", path: "/admin/coupons",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  },
  {
    label: "Orders", path: "/admin/orders",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  },
  {
    label: "Settings", path: "/admin/settings",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const notifRef = useRef(null);

  const notifications = getAdminNotifications();
  const unread = notifications.length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  return (
    <div className="adm-shell">
      {/* ── Sidebar ── */}
      {sidebarOpen && <div className="adm-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`adm-sidebar ${sidebarOpen ? "adm-sidebar--open" : ""}`}>
        {/* Brand */}
        <div className="adm-sidebar__brand">
          <div className="adm-sidebar__logo">
            <div className="adm-sidebar__logo-icon">W</div>
            <div>
              <div className="adm-sidebar__logo-name">Webxter</div>
              <div className="adm-sidebar__logo-sub">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="adm-sidebar__nav">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={`adm-nav-item ${active ? "adm-nav-item--active" : ""}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="adm-nav-item__icon">{item.icon}</span>
                <span className="adm-nav-item__label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="adm-sidebar__bottom">
          <a href="/" target="_blank" rel="noopener noreferrer" className="adm-nav-item">
            <span className="adm-nav-item__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </span>
            <span className="adm-nav-item__label">View Site</span>
          </a>
          <button className="adm-nav-item adm-nav-item--logout" onClick={handleLogout}>
            <span className="adm-nav-item__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            <span className="adm-nav-item__label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="adm-main">
        {/* Topbar */}
        <header className="adm-topbar">
          <button className="adm-topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="adm-topbar__title">
            {NAV.find((n) => location.pathname.startsWith(n.path))?.label || "Admin"}
          </div>
          <div className="adm-topbar__right">
            {/* ── Notification bell ── */}
            <div className="adm-notif" ref={notifRef}>
              <button
                className={`adm-notif__btn${unread > 0 ? " adm-notif__btn--active" : ""}`}
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications${unread > 0 ? ` (${unread})` : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && <span className="adm-notif__badge">{unread > 9 ? "9+" : unread}</span>}
              </button>

              {notifOpen && (
                <div className="adm-notif__dropdown">
                  <div className="adm-notif__header">
                    <span>Notifications</span>
                    {unread > 0 && <span className="adm-notif__count">{unread} new</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="adm-notif__empty">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      <p>All caught up!</p>
                    </div>
                  ) : (
                    <div className="adm-notif__list">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          to={n.link}
                          className="adm-notif__item"
                          onClick={() => setNotifOpen(false)}
                        >
                          <div className={`adm-notif__dot adm-notif__dot--${n.type}`} />
                          <div className="adm-notif__text">
                            <div className="adm-notif__item-title">{n.title}</div>
                            <div className="adm-notif__item-body">{n.body}</div>
                            <div className="adm-notif__item-date">{n.date}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="adm-topbar__avatar">A</div>
          </div>
        </header>

        {/* Page content */}
        <div className="adm-content">
          {children}
        </div>
      </div>
    </div>
  );
}
