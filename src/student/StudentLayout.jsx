import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { studentLogout, getStudentSession, getStudentOrders, getStudentTickets } from "./studentStore";
import "./student.css";

// ─── Chatbot knowledge base ───────────────────────────────────────────────────
const BOT_NAME = "Webxter AI";
const QUICK_REPLIES = [
  "Track my order",
  "Download project files",
  "Payment help",
  "Contact support",
  "How to submit a ticket?",
];

function getBotReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes("order") || m.includes("track")) {
    return { text: "You can track all your orders in the **My Orders** section. Completed orders have a Download button. Pending orders are being processed — usually within 24 hrs.", link: { label: "Go to My Orders →", to: "/student/orders" } };
  }
  if (m.includes("download") || m.includes("file") || m.includes("source")) {
    return { text: "Once your order is marked **Completed**, switch to the grid/downloads view in My Orders to access all project files, GitHub links, and documentation.", link: { label: "My Orders →", to: "/student/orders" } };
  }
  if (m.includes("payment") || m.includes("paid") || m.includes("refund")) {
    return { text: "For payment issues or refund requests, please WhatsApp us at **+91-8264796534** or raise a support ticket. We resolve payment queries within 12 hours.", link: { label: "Raise a Ticket →", to: "/student/support" } };
  }
  if (m.includes("ticket") || m.includes("support") || m.includes("help") || m.includes("issue")) {
    return { text: "Head to the **Support** page to raise a ticket. You can also view all your existing tickets there. We respond within 24 hours via email or WhatsApp.", link: { label: "Go to Support →", to: "/student/support" } };
  }
  if (m.includes("contact") || m.includes("whatsapp") || m.includes("email") || m.includes("call")) {
    return { text: "You can reach us via:\n📱 WhatsApp: +91-8264796534\n📧 Email: projects@webxter.in\n\nWe're available Mon–Sat, 9 AM – 8 PM." };
  }
  if (m.includes("license") || m.includes("certificate")) {
    return { text: "You can download your **License Certificate** directly from My Orders — click the License button next to any completed order.", link: { label: "My Orders →", to: "/student/orders" } };
  }
  if (m.includes("profile") || m.includes("account") || m.includes("password")) {
    return { text: "Update your name, college, bio, and profile photo in the **Profile** section.", link: { label: "Go to Profile →", to: "/student/profile" } };
  }
  if (m.includes("project") || m.includes("browse") || m.includes("buy") || m.includes("purchase")) {
    return { text: "Browse all available projects on the main store. Each project includes a live demo, tech stack details, and pricing.", link: { label: "Browse Projects →", to: "/" } };
  }
  if (m.includes("hi") || m.includes("hello") || m.includes("hey") || m.includes("hii")) {
    return { text: `Hey there! 👋 I'm ${BOT_NAME}. I can help you with orders, downloads, payments, and support. What do you need help with?` };
  }
  if (m.includes("thank")) {
    return { text: "You're welcome! 😊 Feel free to ask anything else. I'm here 24/7." };
  }
  return { text: "I'm not sure about that, but our support team can help! You can raise a ticket or WhatsApp us at **+91-8264796534**.", link: { label: "Contact Support →", to: "/student/support" } };
}

// ─── Render bot message text (bold via **) ────────────────────────────────────
function BotText({ text }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i}>{p}</strong> : p.split("\n").map((line, j, arr) => (
          <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
        ))
      )}
    </span>
  );
}

// ─── Chatbot widget ───────────────────────────────────────────────────────────
function ChatBot({ session }) {
  const navigate = useNavigate();
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [showPulse, setShowPulse] = useState(true);
  const [messages, setMessages] = useState([
    { from: "bot", text: `Hi ${session?.name?.split(" ")[0] || "there"} 👋 I'm ${BOT_NAME}. How can I help you today?`, id: 0 },
  ]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Hide pulse after first open
  useEffect(() => { if (open) setShowPulse(false); }, [open]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const sendMessage = (text) => {
    const userMsg = text.trim();
    if (!userMsg) return;
    const uid = Date.now();
    setMessages((m) => [...m, { from: "user", text: userMsg, id: uid }]);
    setInput("");
    // Typing delay
    setTimeout(() => {
      const reply = getBotReply(userMsg);
      setMessages((m) => [...m, { from: "bot", ...reply, id: uid + 1 }]);
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* FAB */}
      <button
        className={`sd-chat-fab${open ? " sd-chat-fab--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with Webxter AI"
      >
        {showPulse && <span className="sd-chat-fab__pulse" />}
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="1" fill="currentColor"/>
            <circle cx="12" cy="10" r="1" fill="currentColor"/>
            <circle cx="15" cy="10" r="1" fill="currentColor"/>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="sd-chat-window">
          {/* Header */}
          <div className="sd-chat-header">
            <div className="sd-chat-header__avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                <path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <div>
              <div className="sd-chat-header__name">{BOT_NAME}</div>
              <div className="sd-chat-header__status">
                <span className="sd-chat-header__dot" />
                Online · replies instantly
              </div>
            </div>
            <button className="sd-chat-header__close" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="sd-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`sd-chat-msg sd-chat-msg--${msg.from}`}>
                {msg.from === "bot" && (
                  <div className="sd-chat-msg__avatar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                      <path d="M12 8v4l3 3"/>
                    </svg>
                  </div>
                )}
                <div className="sd-chat-msg__bubble">
                  <BotText text={msg.text} />
                  {msg.link && (
                    <button
                      className="sd-chat-msg__link"
                      onClick={() => { navigate(msg.link.to); setOpen(false); }}
                    >
                      {msg.link.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="sd-chat-quick">
            {QUICK_REPLIES.map((q) => (
              <button key={q} className="sd-chat-quick__btn" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div className="sd-chat-input">
            <input
              ref={inputRef}
              className="sd-chat-input__field"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              maxLength={300}
            />
            <button
              className="sd-chat-input__send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

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

      {/* ── Floating chatbot ── */}
      <ChatBot session={session} />
    </div>
  );
}
