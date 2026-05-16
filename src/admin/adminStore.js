// ─── Admin Data Store (localStorage-backed) ──────────────────────────────────
// Single source of truth for all dynamic data the admin manages.

const KEYS = {
  AUTH:     "wx_admin_auth",
  PROJECTS: "wx_admin_projects",
  ORDERS:   "wx_admin_orders",
  SETTINGS: "wx_admin_settings",
  ANALYTICS:"wx_admin_analytics",
  COUPONS:  "wx_admin_coupons",
};

// ─── Default projects (seeded from the original static list) ─────────────────
const DEFAULT_PROJECTS = [
  {
    id: 1, slug: "library-management-system",
    title: "Library Management System",
    description: "Complete library management with book tracking, member management, and automated fine calculation.",
    longDesc: "This project covers the full lifecycle of a library — from cataloguing books and managing members to issuing/returning books and auto-calculating fines. Comes with an admin dashboard, search & filter, and detailed reports.",
    category: "Web Development",
    tags: ["React", "Django", "PostgreSQL"],
    level: "Intermediate", delivery: "1 week",
    originalPrice: 15000, price: 9999,
    features: ["Book Catalog", "Member Management", "Issue/Return System", "Fine Calculation"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    // media: array of { type: "image"|"video", url, caption, featured }
    media: [
      { type: "image", url: "https://picsum.photos/seed/lib1/800/500", caption: "Dashboard Overview", featured: true },
      { type: "image", url: "https://picsum.photos/seed/lib2/800/500", caption: "Book Catalog", featured: false },
      { type: "image", url: "https://picsum.photos/seed/lib3/800/500", caption: "Member Management", featured: false },
    ],
    // legacy screenshots kept for backward compat
    screenshots: ["https://picsum.photos/seed/lib1/800/500","https://picsum.photos/seed/lib2/800/500","https://picsum.photos/seed/lib3/800/500"],
    // demoVideo: optional YouTube/direct video URL shown as featured
    demoVideo: "",
    // projectFiles: array of { label, url, type: "github"|"drive"|"zip"|"docs"|"other" }
    projectFiles: [
      { label: "Source Code (GitHub)", url: "https://github.com/webxter/library-mgmt", type: "github" },
      { label: "Documentation (PDF)", url: "https://drive.google.com/file/d/example", type: "drive" },
    ],
    badge: "Popular", active: true, createdAt: "2024-01-10",
  },
  {
    id: 2, slug: "hardware-store-management",
    title: "Hardware Store Management",
    description: "Inventory management system for hardware stores with billing and stock tracking.",
    longDesc: "Manage your hardware store inventory end-to-end. Track stock levels, generate bills, manage suppliers, and get low-stock alerts.",
    category: "Web Development",
    tags: ["Next.js", "Django", "MySQL"],
    level: "Advanced", delivery: "1 week",
    originalPrice: 19000, price: 14999,
    features: ["Inventory Tracking", "Billing System", "Supplier Management", "Reports"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    media: [
      { type: "image", url: "https://picsum.photos/seed/hw1/800/500", caption: "Inventory Dashboard", featured: true },
      { type: "image", url: "https://picsum.photos/seed/hw2/800/500", caption: "Billing Interface", featured: false },
    ],
    screenshots: ["https://picsum.photos/seed/hw1/800/500","https://picsum.photos/seed/hw2/800/500"],
    demoVideo: "",
    projectFiles: [
      { label: "Source Code (GitHub)", url: "https://github.com/webxter/hardware-store", type: "github" },
    ],
    badge: null, active: true, createdAt: "2024-01-15",
  },
  {
    id: 3, slug: "code-collaboration-platform",
    title: "Code Collaboration Platform",
    description: "Real-time code sharing and collaboration platform with version control.",
    longDesc: "A GitHub-meets-CodePen platform where teams can write, share, and review code in real time.",
    category: "Web Development",
    tags: ["React", "Node.js", "Socket.io"],
    level: "Advanced", delivery: "2–3 weeks",
    originalPrice: 25000, price: 14999,
    features: ["Real-time Editing", "Version Control", "Chat System", "Project Management"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    media: [
      { type: "image", url: "https://picsum.photos/seed/code1/800/500", caption: "Editor View", featured: true },
      { type: "image", url: "https://picsum.photos/seed/code2/800/500", caption: "Collaboration Panel", featured: false },
    ],
    screenshots: ["https://picsum.photos/seed/code1/800/500","https://picsum.photos/seed/code2/800/500"],
    demoVideo: "",
    projectFiles: [],
    badge: "Hot", active: true, createdAt: "2024-02-01",
  },
  {
    id: 4, slug: "hospital-management-system",
    title: "Hospital Management System",
    description: "Comprehensive hospital management with patient records, appointments, and billing.",
    longDesc: "A full-featured HMS covering patient registration, doctor scheduling, OPD/IPD management, pharmacy, and billing.",
    category: "Web Development",
    tags: ["Django", "React", "PostgreSQL"],
    level: "Advanced", delivery: "1 week",
    originalPrice: 19000, price: 14999,
    features: ["Patient Records", "Appointment System", "Billing", "Doctor Management"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    media: [
      { type: "image", url: "https://picsum.photos/seed/hosp1/800/500", caption: "Patient Dashboard", featured: true },
    ],
    screenshots: ["https://picsum.photos/seed/hosp1/800/500"],
    demoVideo: "",
    projectFiles: [],
    badge: null, active: false, soldOut: true, createdAt: "2024-02-10",
  },
  {
    id: 5, slug: "inventory-management-system",
    title: "Inventory Management System",
    description: "Advanced inventory tracking with analytics, alerts, and multi-location support.",
    longDesc: "Track stock across multiple warehouses, set reorder alerts, scan barcodes, and generate analytics dashboards.",
    category: "Web Development",
    tags: ["React", "Django", "Redis"],
    level: "Intermediate", delivery: "1–2 weeks",
    originalPrice: 15500, price: 12999,
    features: ["Multi-location", "Analytics", "Alerts", "Barcode Support"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    media: [
      { type: "image", url: "https://picsum.photos/seed/inv1/800/500", caption: "Analytics View", featured: true },
      { type: "image", url: "https://picsum.photos/seed/inv2/800/500", caption: "Stock Management", featured: false },
    ],
    screenshots: ["https://picsum.photos/seed/inv1/800/500","https://picsum.photos/seed/inv2/800/500"],
    demoVideo: "",
    projectFiles: [],
    badge: null, active: true, createdAt: "2024-02-20",
  },
  {
    id: 6, slug: "ai-chatbot-system",
    title: "AI ChatBot System",
    description: "Intelligent chatbot with natural language processing and learning capabilities.",
    longDesc: "An NLP-powered chatbot that learns from conversations, supports multi-platform deployment.",
    category: "AI/ML",
    tags: ["Python", "TensorFlow", "Flask"],
    level: "Expert", delivery: "1 week",
    originalPrice: 20500, price: 14999,
    features: ["NLP Processing", "Learning Algorithm", "Multi-platform", "Analytics"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Model Weights"],
    media: [
      { type: "image", url: "https://picsum.photos/seed/ai1/800/500", caption: "Chat Interface", featured: true },
      { type: "image", url: "https://picsum.photos/seed/ai2/800/500", caption: "Analytics Dashboard", featured: false },
    ],
    screenshots: ["https://picsum.photos/seed/ai1/800/500","https://picsum.photos/seed/ai2/800/500"],
    demoVideo: "",
    projectFiles: [],
    badge: "New", active: true, createdAt: "2024-03-01",
  },
  {
    id: 7, slug: "expense-tracker-app",
    title: "Expense Tracker App",
    description: "Mobile-first expense tracking app with charts, budgets, and category management.",
    longDesc: "Track daily expenses, set monthly budgets per category, visualise spending with charts.",
    category: "Mobile",
    tags: ["React Native", "Firebase"],
    level: "Beginner", delivery: "3–5 days",
    originalPrice: 10000, price: 7499,
    features: ["Budget Tracking", "Charts", "Categories", "Export Reports"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial"],
    media: [
      { type: "image", url: "https://picsum.photos/seed/exp1/800/500", caption: "Home Screen", featured: true },
    ],
    screenshots: ["https://picsum.photos/seed/exp1/800/500"],
    demoVideo: "",
    projectFiles: [],
    badge: null, active: true, createdAt: "2024-03-10",
  },
  {
    id: 8, slug: "stock-price-prediction",
    title: "Stock Price Prediction",
    description: "ML-powered stock price prediction using LSTM neural networks and historical data.",
    longDesc: "Uses LSTM deep learning to predict stock prices from historical OHLCV data.",
    category: "Data Science",
    tags: ["Python", "Keras", "Pandas"],
    level: "Expert", delivery: "1–2 weeks",
    originalPrice: 22000, price: 16999,
    features: ["LSTM Model", "Live Data", "Visualization", "Backtesting"],
    includes: ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Trained Model"],
    media: [
      { type: "image", url: "https://picsum.photos/seed/stock1/800/500", caption: "Prediction Chart", featured: true },
      { type: "image", url: "https://picsum.photos/seed/stock2/800/500", caption: "Backtesting Results", featured: false },
    ],
    screenshots: ["https://picsum.photos/seed/stock1/800/500","https://picsum.photos/seed/stock2/800/500"],
    demoVideo: "",
    projectFiles: [],
    badge: "Popular", active: true, createdAt: "2024-03-15",
  },
];

const DEFAULT_ORDERS = [
  { id: "ORD-001", customer: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210", college: "IIT Delhi", project: "Library Management System", amount: 9999, status: "completed", payMethod: "upi", date: "2024-03-20" },
  { id: "ORD-002", customer: "Priya Patel", email: "priya@example.com", phone: "9123456789", college: "NIT Surat", project: "Hospital Management System", amount: 14999, status: "pending", payMethod: "whatsapp", date: "2024-03-22" },
  { id: "ORD-003", customer: "Amit Kumar", email: "amit@example.com", phone: "9988776655", college: "VIT Vellore", project: "AI ChatBot System", amount: 14999, status: "completed", payMethod: "bank", date: "2024-03-25" },
  { id: "ORD-004", customer: "Sneha Reddy", email: "sneha@example.com", phone: "9871234560", college: "BITS Pilani", project: "Stock Price Prediction", amount: 16999, status: "completed", payMethod: "upi", date: "2024-04-01" },
  { id: "ORD-005", customer: "Karan Singh", email: "karan@example.com", phone: "9765432100", college: "DTU Delhi", project: "Expense Tracker App", amount: 7499, status: "cancelled", payMethod: "upi", date: "2024-04-03" },
  { id: "ORD-006", customer: "Meera Nair", email: "meera@example.com", phone: "9654321098", college: "NSIT Delhi", project: "Code Collaboration Platform", amount: 14999, status: "completed", payMethod: "upi", date: "2024-04-05" },
];

const DEFAULT_SETTINGS = {
  siteName: "Webxter Student Projects",
  tagline: "Professional projects for final year students",
  email: "projects@webxter.in",
  phone: "+91-8264796534",
  whatsapp: "+91-8264796534",
  couponCode: "STUDENT20",
  couponDiscount: 20,
  maintenanceMode: false,
  showMarquee: true,
  marqueeText: "20% OFF for Final Year Students!",
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
const ADMIN_CREDENTIALS = { username: "admin", password: "webxter@2024" };

export function adminLogin(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const session = { loggedIn: true, username, loginTime: Date.now() };
    localStorage.setItem(KEYS.AUTH, JSON.stringify(session));
    return true;
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem(KEYS.AUTH);
}

export function isAdminLoggedIn() {
  try {
    const raw = localStorage.getItem(KEYS.AUTH);
    if (!raw) return false;
    const session = JSON.parse(raw);
    // session expires after 8 hours
    if (Date.now() - session.loginTime > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(KEYS.AUTH);
      return false;
    }
    return session.loggedIn === true;
  } catch { return false; }
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export function getProjects() {
  try {
    const raw = localStorage.getItem(KEYS.PROJECTS);
    return raw ? JSON.parse(raw) : DEFAULT_PROJECTS;
  } catch { return DEFAULT_PROJECTS; }
}

export function saveProjects(projects) {
  localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
}

export function addProject(project) {
  const projects = getProjects();
  const newProject = {
    ...project,
    id: Date.now(),
    slug: project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    createdAt: new Date().toISOString().split("T")[0],
    active: true,
  };
  saveProjects([...projects, newProject]);
  return newProject;
}

export function updateProject(id, updates) {
  const projects = getProjects();
  const updated = projects.map((p) => p.id === id ? { ...p, ...updates } : p);
  saveProjects(updated);
}

export function deleteProject(id) {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export function getOrders() {
  try {
    const raw = localStorage.getItem(KEYS.ORDERS);
    return raw ? JSON.parse(raw) : DEFAULT_ORDERS;
  } catch { return DEFAULT_ORDERS; }
}

export function saveOrders(orders) {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

export function addOrder(order) {
  const orders = getOrders();
  const newOrder = {
    ...order,
    id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
  };
  saveOrders([newOrder, ...orders]);
  return newOrder;
}

export function updateOrderStatus(id, status) {
  const orders = getOrders().map((o) => o.id === id ? { ...o, status } : o);
  saveOrders(orders);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function getSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ─── Coupons ──────────────────────────────────────────────────────────────────
const DEFAULT_COUPONS = [
  {
    id: 1, code: "STUDENT20", type: "percent", value: 20,
    minOrder: 5000, maxUses: 500, usedCount: 47,
    active: true, expiresAt: "2025-12-31",
    description: "20% off for all students",
    applicableTo: "all", // "all" | "category" | "project"
    createdAt: "2024-01-01",
  },
  {
    id: 2, code: "FLAT500", type: "flat", value: 500,
    minOrder: 8000, maxUses: 100, usedCount: 12,
    active: true, expiresAt: "2025-06-30",
    description: "Flat ₹500 off on orders above ₹8000",
    applicableTo: "all",
    createdAt: "2024-02-01",
  },
  {
    id: 3, code: "NEWUSER30", type: "percent", value: 30,
    minOrder: 0, maxUses: 50, usedCount: 50,
    active: false, expiresAt: "2024-12-31",
    description: "30% off for new users (expired)",
    applicableTo: "all",
    createdAt: "2024-01-15",
  },
];

export function getCoupons() {
  try {
    const raw = localStorage.getItem(KEYS.COUPONS);
    return raw ? JSON.parse(raw) : DEFAULT_COUPONS;
  } catch { return DEFAULT_COUPONS; }
}

export function saveCoupons(coupons) {
  localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
}

export function addCoupon(coupon) {
  const coupons = getCoupons();
  const newCoupon = {
    ...coupon,
    id: Date.now(),
    code: coupon.code.toUpperCase().trim(),
    usedCount: 0,
    createdAt: new Date().toISOString().split("T")[0],
  };
  saveCoupons([...coupons, newCoupon]);
  return newCoupon;
}

export function updateCoupon(id, updates) {
  const coupons = getCoupons().map((c) =>
    c.id === id ? { ...c, ...updates, code: (updates.code || c.code).toUpperCase().trim() } : c
  );
  saveCoupons(coupons);
}

export function deleteCoupon(id) {
  saveCoupons(getCoupons().filter((c) => c.id !== id));
}

// Validate a coupon code at checkout
export function validateCoupon(code, orderTotal) {
  const coupons = getCoupons();
  const coupon = coupons.find((c) => c.code === code.toUpperCase().trim());
  if (!coupon) return { valid: false, error: "Coupon not found" };
  if (!coupon.active) return { valid: false, error: "This coupon is no longer active" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, error: "This coupon has expired" };
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { valid: false, error: "This coupon has reached its usage limit" };
  if (coupon.minOrder > 0 && orderTotal < coupon.minOrder) return { valid: false, error: `Minimum order of ₹${coupon.minOrder.toLocaleString("en-IN")} required` };
  const discount = coupon.type === "percent"
    ? Math.round(orderTotal * coupon.value / 100)
    : Math.min(coupon.value, orderTotal);
  return { valid: true, coupon, discount };
}

// ─── Get all registered students (for coupon assignment) ─────────────────────
export function getAllStudents() {
  try {
    const DEMO = [
      { email: "rahul@example.com", name: "Rahul Sharma", college: "IIT Delhi" },
      { email: "priya@example.com", name: "Priya Patel",  college: "NIT Surat" },
      { email: "amit@example.com",  name: "Amit Kumar",   college: "VIT Vellore" },
    ];
    const raw = localStorage.getItem("wx_student_accounts");
    const stored = raw ? JSON.parse(raw) : [];
    const storedEmails = stored.map((a) => a.email.toLowerCase());
    const demosToAdd = DEMO.filter((d) => !storedEmails.includes(d.email.toLowerCase()));
    return [...stored.map((a) => ({ email: a.email, name: a.name, college: a.college || "" })), ...demosToAdd];
  } catch { return []; }
}

export function incrementCouponUsage(code) {
  const coupons = getCoupons().map((c) =>
    c.code === code.toUpperCase().trim() ? { ...c, usedCount: (c.usedCount || 0) + 1 } : c
  );
  saveCoupons(coupons);
}
export function getAnalytics() {
  const orders = getOrders();
  const projects = getProjects();

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const activeProjects = projects.filter((p) => p.active).length;

  // revenue by month (last 6 months)
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString("default", { month: "short" });
    const revenue = orders
      .filter((o) => {
        if (o.status !== "completed") return false;
        const od = new Date(o.date);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      })
      .reduce((s, o) => s + o.amount, 0);
    return { label, revenue };
  });

  // top projects by order count
  const projectOrderCount = {};
  orders.forEach((o) => {
    projectOrderCount[o.project] = (projectOrderCount[o.project] || 0) + 1;
  });
  const topProjects = Object.entries(projectOrderCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // payment method breakdown
  const payBreakdown = { upi: 0, whatsapp: 0, bank: 0 };
  orders.forEach((o) => { if (payBreakdown[o.payMethod] !== undefined) payBreakdown[o.payMethod]++; });

  return {
    totalRevenue, totalOrders, completedOrders, pendingOrders, cancelledOrders,
    activeProjects, monthlyRevenue, topProjects, payBreakdown,
    conversionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
  };
}
