// ─── Notification Store (localStorage-backed) ────────────────────────────────
// Shared between admin and student. Notifications are stored per-audience.
//
// Notification shape:
// {
//   id:        string  — unique ID (timestamp-based)
//   type:      "order_placed" | "order_status" | "new_user" | "ticket" | "system"
//   title:     string
//   body:      string
//   link:      string  — route to navigate on click
//   read:      boolean
//   createdAt: string  — ISO timestamp
// }

const KEYS = {
  ADMIN:   "wx_notif_admin",
  STUDENT: "wx_notif_student", // prefix; per-email: wx_notif_student_{email}
};

const MAX_NOTIFS = 50; // keep latest N

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export { relativeTime };

// ─── Admin Notifications ──────────────────────────────────────────────────────

function readAdminNotifs() {
  try {
    const raw = localStorage.getItem(KEYS.ADMIN);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeAdminNotifs(list) {
  // Keep only the latest MAX_NOTIFS
  const trimmed = list.slice(0, MAX_NOTIFS);
  localStorage.setItem(KEYS.ADMIN, JSON.stringify(trimmed));
  // Broadcast to other tabs / same-tab listeners
  try {
    window.dispatchEvent(new CustomEvent("wx-notif-admin"));
  } catch {}
}

export function getAdminNotifications() {
  return readAdminNotifs();
}

export function getAdminUnreadCount() {
  return readAdminNotifs().filter((n) => !n.read).length;
}

export function addAdminNotification({ type, title, body, link = "/admin/orders" }) {
  const notifs = readAdminNotifs();
  const notif = {
    id: genId(),
    type,
    title,
    body,
    link,
    read: false,
    createdAt: nowISO(),
  };
  writeAdminNotifs([notif, ...notifs]);
  return notif;
}

export function markAdminRead(id) {
  const notifs = readAdminNotifs().map((n) => n.id === id ? { ...n, read: true } : n);
  writeAdminNotifs(notifs);
}

export function markAllAdminRead() {
  const notifs = readAdminNotifs().map((n) => ({ ...n, read: true }));
  writeAdminNotifs(notifs);
}

export function clearAdminNotifications() {
  writeAdminNotifs([]);
}

// ─── Student Notifications ────────────────────────────────────────────────────
// Keyed per student email so multiple students on the same device don't share notifs.

function studentKey(email) {
  return `${KEYS.STUDENT}_${(email || "guest").toLowerCase()}`;
}

function readStudentNotifs(email) {
  try {
    const raw = localStorage.getItem(studentKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeStudentNotifs(email, list) {
  const trimmed = list.slice(0, MAX_NOTIFS);
  localStorage.setItem(studentKey(email), JSON.stringify(trimmed));
  try {
    window.dispatchEvent(new CustomEvent("wx-notif-student", { detail: { email } }));
  } catch {}
}

export function getStudentNotifications(email) {
  if (!email) return [];
  return readStudentNotifs(email);
}

export function getStudentUnreadCount(email) {
  if (!email) return 0;
  return readStudentNotifs(email).filter((n) => !n.read).length;
}

export function addStudentNotification(email, { type, title, body, link = "/student/orders" }) {
  if (!email) return;
  const notifs = readStudentNotifs(email);
  const notif = {
    id: genId(),
    type,
    title,
    body,
    link,
    read: false,
    createdAt: nowISO(),
  };
  writeStudentNotifs(email, [notif, ...notifs]);
  return notif;
}

export function markStudentRead(email, id) {
  if (!email) return;
  const notifs = readStudentNotifs(email).map((n) => n.id === id ? { ...n, read: true } : n);
  writeStudentNotifs(email, notifs);
}

export function markAllStudentRead(email) {
  if (!email) return;
  const notifs = readStudentNotifs(email).map((n) => ({ ...n, read: true }));
  writeStudentNotifs(email, notifs);
}

export function clearStudentNotifications(email) {
  if (!email) return;
  writeStudentNotifs(email, []);
}

// ─── Type → icon/colour config (used by both bells) ──────────────────────────
export const NOTIF_META = {
  order_placed:  { color: "#16a34a", bg: "rgba(34,197,94,.12)",  label: "New Order"     },
  order_status:  { color: "#009fd4", bg: "rgba(0,159,212,.12)",  label: "Order Update"  },
  new_user:      { color: "#8b5cf6", bg: "rgba(139,92,246,.12)", label: "New Student"   },
  ticket:        { color: "#f59e0b", bg: "rgba(245,158,11,.12)", label: "Support Ticket"},
  system:        { color: "#64748b", bg: "rgba(100,116,139,.12)",label: "System"        },
};

// ─── Demo notifications seed ──────────────────────────────────────────────────
// Seeds realistic demo notifications so the bell is never empty on first load.
// Only runs once — guarded by wx_notif_seeded flag. Call from main.jsx or App.jsx.

const SEED_KEY = "wx_notif_seeded_v1";

function ago(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

export function seedDemoNotifications(studentEmail) {
  // ── Admin demos ────────────────────────────────────────────────────────────
  if (!localStorage.getItem(SEED_KEY + "_admin")) {
    const adminNotifs = [
      {
        id: "demo-adm-1",
        type: "order_placed",
        title: "New order from Rahul Sharma",
        body: "₹9,999 · Library Management System",
        link: "/admin/orders",
        read: false,
        createdAt: ago(8),
      },
      {
        id: "demo-adm-2",
        type: "order_placed",
        title: "New order from Priya Patel",
        body: "₹14,999 · Hospital Management System",
        link: "/admin/orders",
        read: false,
        createdAt: ago(45),
      },
      {
        id: "demo-adm-3",
        type: "new_user",
        title: "New student registered",
        body: "amit@example.com just created an account",
        link: "/admin/orders",
        read: true,
        createdAt: ago(120),
      },
      {
        id: "demo-adm-4",
        type: "order_placed",
        title: "New order from Sneha Reddy",
        body: "₹16,999 · Stock Price Prediction",
        link: "/admin/orders",
        read: true,
        createdAt: ago(300),
      },
      {
        id: "demo-adm-5",
        type: "system",
        title: "Coupon STUDENT20 used",
        body: "20% discount applied — ₹2,500 off",
        link: "/admin/orders",
        read: true,
        createdAt: ago(1440),
      },
    ];
    // Only write if admin notifs are currently empty
    if (readAdminNotifs().length === 0) {
      writeAdminNotifs(adminNotifs);
    }
    localStorage.setItem(SEED_KEY + "_admin", "1");
  }

  // ── Student demos ──────────────────────────────────────────────────────────
  if (studentEmail && !localStorage.getItem(SEED_KEY + "_student_" + studentEmail.toLowerCase())) {
    const studentNotifs = [
      {
        id: "demo-std-1",
        type: "order_placed",
        title: "Order placed successfully!",
        body: "Your order for Library Management System is confirmed. We'll deliver within 1 week.",
        link: "/student/orders",
        read: false,
        createdAt: ago(10),
      },
      {
        id: "demo-std-2",
        type: "order_status",
        title: "Order Confirmed",
        body: "Your order has been confirmed! We're getting started on it.",
        link: "/student/orders",
        read: false,
        createdAt: ago(60),
      },
      {
        id: "demo-std-3",
        type: "order_status",
        title: "Order In Progress",
        body: "Great news — your project is now in progress! Expected delivery: 5 days.",
        link: "/student/orders",
        read: true,
        createdAt: ago(180),
      },
      {
        id: "demo-std-4",
        type: "system",
        title: "Welcome to Webxter Student Portal!",
        body: "Your dashboard is ready. Browse projects, track orders, and get support.",
        link: "/student/dashboard",
        read: true,
        createdAt: ago(600),
      },
    ];
    // Only write if student notifs are currently empty
    if (readStudentNotifs(studentEmail).length === 0) {
      writeStudentNotifs(studentEmail, studentNotifs);
    }
    localStorage.setItem(SEED_KEY + "_student_" + studentEmail.toLowerCase(), "1");
  }
}
