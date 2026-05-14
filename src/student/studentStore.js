// ─── Student Auth & Data Store ────────────────────────────────────────────────
import { getOrders, saveOrders } from "../admin/adminStore";

const KEYS = {
  SESSION:  "wx_student_session",
  ACCOUNTS: "wx_student_accounts",
  PROFILE:  "wx_student_profile_",
  TICKETS:  "wx_student_tickets_",
  OTP:      "wx_student_otp_",
};

// ─── Demo accounts (pre-seeded) ───────────────────────────────────────────────
// These 3 accounts are always available for testing.
// Each maps to real orders in adminStore so the dashboard is populated.
const DEMO_ACCOUNTS = [
  {
    email: "rahul@example.com",
    password: "Student@123",
    name: "Rahul Sharma",
    phone: "9876543210",
    college: "IIT Delhi",
    year: "Final Year",
    bio: "Computer Science student passionate about full-stack development.",
    createdAt: "2024-03-01",
    isDemo: true,
  },
  {
    email: "priya@example.com",
    password: "Student@123",
    name: "Priya Patel",
    phone: "9123456789",
    college: "NIT Surat",
    year: "4th Year",
    bio: "Engineering student interested in web technologies and AI.",
    createdAt: "2024-03-05",
    isDemo: true,
  },
  {
    email: "amit@example.com",
    password: "Student@123",
    name: "Amit Kumar",
    phone: "9988776655",
    college: "VIT Vellore",
    year: "Final Year",
    bio: "Data science enthusiast working on ML projects.",
    createdAt: "2024-03-10",
    isDemo: true,
  },
];

// ─── Account helpers ──────────────────────────────────────────────────────────
function getAccounts() {
  try {
    const raw = localStorage.getItem(KEYS.ACCOUNTS);
    const stored = raw ? JSON.parse(raw) : [];
    // Merge demo accounts — demo accounts always exist but stored ones take priority
    const storedEmails = stored.map((a) => a.email.toLowerCase());
    const demosToAdd = DEMO_ACCOUNTS.filter(
      (d) => !storedEmails.includes(d.email.toLowerCase())
    );
    return [...stored, ...demosToAdd];
  } catch { return DEMO_ACCOUNTS; }
}

function saveAccounts(accounts) {
  // Never persist demo accounts — they're always injected at read time
  const nonDemo = accounts.filter((a) => !a.isDemo);
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(nonDemo));
}

function findAccount(email) {
  return getAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

// Simple hash — not cryptographic, just obfuscation for localStorage
function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  }
  return `wx_${Math.abs(h).toString(36)}_${pw.length}`;
}

// ─── Registration ─────────────────────────────────────────────────────────────
export function studentRegister({ name, email, password, phone, college, year }) {
  const existing = findAccount(email);
  if (existing) return { success: false, error: "An account with this email already exists. Please sign in." };

  const accounts = getAccounts();
  const newAccount = {
    email: email.toLowerCase().trim(),
    password: hashPassword(password),
    name: name.trim(),
    phone: phone || "",
    college: college || "",
    year: year || "",
    bio: "",
    createdAt: new Date().toISOString().split("T")[0],
    isDemo: false,
  };
  saveAccounts([...accounts.filter((a) => !a.isDemo), newAccount]);

  // Auto-login after registration
  const session = createSession(newAccount);
  return { success: true, student: session };
}

// ─── Login ────────────────────────────────────────────────────────────────────
export function studentLogin(email, password) {
  const account = findAccount(email);
  if (!account) return { success: false, field: "email", error: "No account found with this email address." };

  // Demo accounts use plain password comparison
  const passwordMatch = account.isDemo
    ? password === account.password
    : hashPassword(password) === account.password;

  if (!passwordMatch) return { success: false, field: "password", error: "Incorrect password. Please try again." };

  const session = createSession(account);
  return { success: true, student: session };
}

function createSession(account) {
  const session = {
    email: account.email,
    name: account.name,
    phone: account.phone || "",
    college: account.college || "",
    year: account.year || "",
    isDemo: account.isDemo || false,
    loginTime: Date.now(),
  };
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  return session;
}

export function studentLogout() {
  localStorage.removeItem(KEYS.SESSION);
}

export function getStudentSession() {
  try {
    const raw = localStorage.getItem(KEYS.SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() - session.loginTime > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEYS.SESSION);
      return null;
    }
    return session;
  } catch { return null; }
}

export function isStudentLoggedIn() {
  return getStudentSession() !== null;
}

// ─── Password reset (OTP simulation) ─────────────────────────────────────────
export function requestPasswordReset(email) {
  const account = findAccount(email);
  if (!account) return { success: false, error: "No account found with this email." };
  if (account.isDemo) return { success: false, error: "Demo accounts cannot reset passwords." };

  // Generate 6-digit OTP, store with 10-min expiry
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = Date.now() + 10 * 60 * 1000;
  localStorage.setItem(KEYS.OTP + email.toLowerCase(), JSON.stringify({ otp, expiry }));

  // In a real app this would send an email. We return the OTP for demo purposes.
  return { success: true, otp, message: `OTP sent to ${email}. (Demo: OTP is ${otp})` };
}

export function verifyOtpAndReset(email, otp, newPassword) {
  const raw = localStorage.getItem(KEYS.OTP + email.toLowerCase());
  if (!raw) return { success: false, error: "No reset request found. Please request a new OTP." };

  const { otp: storedOtp, expiry } = JSON.parse(raw);
  if (Date.now() > expiry) {
    localStorage.removeItem(KEYS.OTP + email.toLowerCase());
    return { success: false, error: "OTP has expired. Please request a new one." };
  }
  if (otp.trim() !== storedOtp) return { success: false, error: "Incorrect OTP. Please try again." };

  // Update password
  const accounts = getAccounts().filter((a) => !a.isDemo);
  const updated = accounts.map((a) =>
    a.email.toLowerCase() === email.toLowerCase()
      ? { ...a, password: hashPassword(newPassword) }
      : a
  );
  saveAccounts(updated);
  localStorage.removeItem(KEYS.OTP + email.toLowerCase());
  return { success: true };
}

// ─── Student orders ───────────────────────────────────────────────────────────
export function getStudentOrders(email) {
  const orders = getOrders();
  return orders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export function getStudentProfile(email) {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE + email.toLowerCase());
    const session = getStudentSession();
    const account = findAccount(email);
    const defaults = {
      name: account?.name || session?.name || "",
      email: email.toLowerCase(),
      phone: account?.phone || session?.phone || "",
      college: account?.college || session?.college || "",
      year: account?.year || session?.year || "",
      bio: account?.bio || "",
    };
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return {}; }
}

export function saveStudentProfile(email, profile) {
  localStorage.setItem(KEYS.PROFILE + email.toLowerCase(), JSON.stringify(profile));
  // Notify same-tab listeners (navbar avatar) immediately
  window.dispatchEvent(new CustomEvent("wx-profile-updated"));
  // Update session
  const session = getStudentSession();
  if (session) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify({
      ...session,
      name: profile.name,
      phone: profile.phone,
      college: profile.college,
      year: profile.year,
    }));
  }
  // Update stored account
  const accounts = getAccounts().filter((a) => !a.isDemo);
  const updated = accounts.map((a) =>
    a.email.toLowerCase() === email.toLowerCase()
      ? { ...a, name: profile.name, phone: profile.phone, college: profile.college, year: profile.year, bio: profile.bio }
      : a
  );
  saveAccounts(updated);
}

// ─── Support tickets ──────────────────────────────────────────────────────────
export function getStudentTickets(email) {
  try {
    const raw = localStorage.getItem(KEYS.TICKETS + email.toLowerCase());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addStudentTicket(email, ticket) {
  const tickets = getStudentTickets(email);
  const newTicket = {
    ...ticket,
    id: `TKT-${Date.now()}`,
    status: "open",
    createdAt: new Date().toISOString().split("T")[0],
    replies: [],
  };
  localStorage.setItem(KEYS.TICKETS + email.toLowerCase(), JSON.stringify([newTicket, ...tickets]));
  return newTicket;
}

// ─── Demo account info (for display on login page) ────────────────────────────
export const DEMO_USERS = DEMO_ACCOUNTS.map(({ email, password, name, college }) => ({
  email, password, name, college,
}));
