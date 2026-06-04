import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminApiLogout, getAdminUser } from "./adminApi";
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminRead,
  markAllAdminRead,
  clearAdminNotifications,
  relativeTime,
  NOTIF_META,
  seedDemoNotifications,
} from "../notificationStore";
import "./admin.css";

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
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState(() => getAdminNotifications());
  const [unread,      setUnread]      = useState(() => getAdminUnreadCount());
  const notifRef = useRef(null);

  const user     = getAdminUser();
  const initials = (user?.username || user?.first_name || "A")[0].toUpperCase();

  // Seed demo notifications on first load (admin side only)
  useEffect(() => {
    seedDemoNotifications(null);
    const refresh = () => {
      setNotifs(getAdminNotifications());
      setUnread(getAdminUnreadCount());
    };
    refresh();
    window.addEventListener("wx-notif-admin", refresh);
    const interval = setInterval(refresh, 10000);
    return () => {
      window.removeEventListener("wx-notif-admin", refresh);
      clearInterval(interval);
    };
  }, []);

  // Refresh count when dropdown closes (marks happen inside)
  const handleOpenNotif = () => {
    setNotifOpen((o) => !o);
    setNotifs(getAdminNotifications());
    setUnread(getAdminUnreadCount());
  };

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
        setNotifs(getAdminNotifications());
        setUnread(getAdminUnreadCount());
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleNotifClick = (n) => {
    markAdminRead(n.id);
    setNotifs(getAdminNotifications());
    setUnread(getAdminUnreadCount());
    setNotifOpen(false);
    navigate(n.link || "/admin/orders");
  };

  const handleMarkAll = () => {
    markAllAdminRead();
    setNotifs(getAdminNotifications());
    setUnread(0);
  };

  const handleClear = () => {
    clearAdminNotifications();
    setNotifs([]);
    setUnread(0);
  };

  const handleLogout = async () => {
    await adminApiLogout();
    navigate("/admin/login");
  };

  return (
    <div className="adm-shell">
      {sidebarOpen && <div className="adm-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? "adm-sidebar--open" : ""}`}>
        <div className="adm-sidebar__brand">
          <div className="adm-sidebar__logo">
            <div className="adm-sidebar__logo-icon">W</div>
            <div>
              <div className="adm-sidebar__logo-name">Webxter</div>
              <div className="adm-sidebar__logo-sub">Admin Panel</div>
            </div>
          </div>
        </div>

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
            {/* Notification bell */}
            <div className="adm-notif" ref={notifRef}>
              <button
                className="adm-notif__btn"
                onClick={handleOpenNotif}
                aria-label={`Notifications${unread > 0 ? ` (${unread})` : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && (
                  <span className="adm-notif__badge">{unread > 9 ? "9+" : unread}</span>
                )}
              </button>

              {notifOpen && (
                <div className="adm-notif__dropdown">
                  <div className="adm-notif__header">
                    <span className="adm-notif__header-title">Notifications</span>
                    {unread > 0 && <span className="adm-notif__new">{unread} new</span>}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      {unread > 0 && (
                        <button className="adm-notif__action-btn" onClick={handleMarkAll} title="Mark all read">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                      )}
                      {notifs.length > 0 && (
                        <button className="adm-notif__action-btn" onClick={handleClear} title="Clear all">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {notifs.length === 0 ? (
                    <div className="adm-notif__empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      <p>All caught up!</p>
                    </div>
                  ) : (
                    <div className="adm-notif__list">
                      {notifs.map((n) => {
                        const meta = NOTIF_META[n.type] || NOTIF_META.system;
                        return (
                          <button
                            key={n.id}
                            className={`adm-notif__item${n.read ? "" : " adm-notif__item--unread"}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <div className="adm-notif__item-dot" style={{ background: meta.bg, color: meta.color }}>
                              {n.type === "order_placed" && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                              )}
                              {n.type === "order_status" && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                              {n.type === "new_user" && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              )}
                              {(n.type === "ticket" || n.type === "system") && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              )}
                            </div>
                            <div className="adm-notif__item-text">
                              <div className="adm-notif__item-title">{n.title}</div>
                              <div className="adm-notif__item-body">{n.body}</div>
                              <div className="adm-notif__item-time">{relativeTime(n.createdAt)}</div>
                            </div>
                            {!n.read && <div className="adm-notif__unread-dot" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="adm-topbar__avatar" title={user?.username || "Admin"}>{initials}</div>
          </div>
        </header>

        <div className="adm-content">{children}</div>
      </div>
    </div>
  );
}
