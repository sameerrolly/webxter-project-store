import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { studentLogout, getStudentSession, getStudentOrders, getStudentTickets } from "./studentStore";
import "./student.css";

const NAV = [
  {
    label: "Overview", path: "/student/dashboard",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    label: "My Orders", path: "/student/orders",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  },
  {
    label: "Profile", path: "/student/profile",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    label: "Support", path: "/student/support",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
];

export default function StudentLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getStudentSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Build notifications from pending orders + open tickets
  const notifications = (() => {
    const email = session?.email || "";
    const orders  = getStudentOrders(email);
    const tickets = getStudentTickets(email);
    const items = [];
    orders.filter((o) => o.status === "pending").forEach((o) => {
      items.push({ id: `ord-${o.id}`, type: "order", title: "Order Pending", body: o.project, date: o.date, link: "/student/orders" });
    });
    tickets.filter((t) => t.status === "open").forEach((t) => {
      items.push({ id: `tkt-${t.id}`, type: "ticket", title: "Open Ticket", body: t.subject, date: t.createdAt, link: "/student/support" });
    });
    return items;
  })();

  const unread = notifications.length;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (session?.name || "S").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // Re-read profile from localStorage on every render so avatar updates instantly after save
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(`wx_student_profile_${session?.email?.toLowerCase()}`);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  // Listen for storage changes (same-tab saves trigger a custom event)
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem(`wx_student_profile_${session?.email?.toLowerCase()}`);
        setProfile(raw ? JSON.parse(raw) : {});
      } catch { setProfile({}); }
    };
    window.addEventListener("wx-profile-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wx-profile-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [session?.email]);

  const handleLogout = () => {
    studentLogout();
    navigate("/student/login");
  };

  const pageTitle = title || NAV.find((n) => location.pathname === n.path)?.label || "Dashboard";

  return (
    <div className="sd-shell">
      {sidebarOpen && <div className="sd-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sd-sidebar ${sidebarOpen ? "sd-sidebar--open" : ""}`}>

        {/* Close button — mobile only */}
        <button className="sd-sidebar__close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Brand */}
        <div className="sd-sidebar__brand">
          <div className="sd-sidebar__brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <div>
            <div className="sd-sidebar__brand-name">Student Portal</div>
            <div className="sd-sidebar__brand-sub">Webxter</div>
          </div>
        </div>

        {/* Student info */}
        <div className="sd-sidebar__student">
          <div className={`sd-nav-avatar${profile?.avatar ? " sd-nav-avatar--photo" : ""}`}>
            {profile?.avatar
              ? <img src={profile.avatar} alt={initials} className="sd-nav-avatar__img" />
              : <span>{initials}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="sd-sidebar__student-name">{session?.name || "Student"}</div>
            <div className="sd-sidebar__student-email">{session?.email || ""}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sd-sidebar__nav">
          {NAV.map((item) => (
            <Link key={item.path} to={item.path}
              className={`sd-nav-item ${location.pathname === item.path ? "sd-nav-item--active" : ""}`}
              onClick={() => setSidebarOpen(false)}>
              <span className="sd-nav-item__icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sd-sidebar__bottom">
          <Link to="/" className="sd-nav-item" onClick={() => setSidebarOpen(false)}>
            <span className="sd-nav-item__icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </span>
            <span>Browse Projects</span>
          </Link>
          <button className="sd-nav-item sd-nav-item--logout" onClick={handleLogout}>
            <span className="sd-nav-item__icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="sd-main">
        {/* Topbar */}
        <header className="sd-topbar">
          <button className="sd-topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="sd-topbar__title">{pageTitle}</div>
          <div className="sd-topbar__right">
            <Link to="/student/support" className="sd-btn sd-btn--ghost sd-btn--sm" style={{ gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Help
            </Link>

            {/* ── Notification bell ── */}
            <div className="sd-notif" ref={notifRef}>
              <button
                className={`sd-notif__btn${unread > 0 ? " sd-notif__btn--active" : ""}`}
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications${unread > 0 ? ` (${unread})` : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && <span className="sd-notif__badge">{unread > 9 ? "9+" : unread}</span>}
              </button>

              {notifOpen && (
                <div className="sd-notif__dropdown">
                  <div className="sd-notif__header">
                    <span>Notifications</span>
                    {unread > 0 && <span className="sd-notif__count">{unread} new</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="sd-notif__empty">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      <p>You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="sd-notif__list">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          to={n.link}
                          className="sd-notif__item"
                          onClick={() => setNotifOpen(false)}
                        >
                          <div className={`sd-notif__dot sd-notif__dot--${n.type}`} />
                          <div className="sd-notif__text">
                            <div className="sd-notif__item-title">{n.title}</div>
                            <div className="sd-notif__item-body">{n.body}</div>
                            <div className="sd-notif__item-date">{n.date}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`sd-nav-avatar${profile?.avatar ? " sd-nav-avatar--photo" : ""}`} style={{ cursor: "default" }}>
              {profile?.avatar
                ? <img src={profile.avatar} alt={initials} className="sd-nav-avatar__img" />
                : <span>{initials}</span>
              }
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="sd-content">{children}</div>
      </div>
    </div>
  );
}
