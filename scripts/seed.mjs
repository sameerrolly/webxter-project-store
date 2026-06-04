#!/usr/bin/env node
/**
 * ============================================================
 *  WEBXTER — Full Data Seed Script
 * ============================================================
 *  Seeds ALL app data into the Django backend database.
 *  Run this ONCE after cloning on any new machine.
 *
 *  Usage:
 *    node scripts/seed.mjs <admin-email> <admin-password> [base-url]
 *
 *  Examples:
 *    node scripts/seed.mjs admin@webxter.in Admin@1234
 *    node scripts/seed.mjs admin@webxter.in Admin@1234 https://api.webxter.in
 *
 *  What it seeds:
 *    ✅ Projects  (all active projects with details)
 *    ✅ Coupons   (all discount codes)
 *    ✅ Settings  (site name, contact info, marquee, etc.)
 *
 *  Safe to re-run — skips items that already exist (by title/code).
 * ============================================================
 */

const [, , EMAIL, PASSWORD, BASE_ARG] = process.argv;
const BASE = (BASE_ARG || "http://127.0.0.1:8000").replace(/\/$/, "");

if (!EMAIL || !PASSWORD) {
  console.error("\n❌  Usage: node scripts/seed.mjs <admin-email> <admin-password> [base-url]");
  console.error("    Example: node scripts/seed.mjs admin@webxter.in Admin@1234\n");
  process.exit(1);
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`;  // green
const R = (s) => `\x1b[31m${s}\x1b[0m`;  // red
const Y = (s) => `\x1b[33m${s}\x1b[0m`;  // yellow
const B = (s) => `\x1b[36m${s}\x1b[0m`;  // cyan
const W = (s) => `\x1b[1m${s}\x1b[0m`;   // bold

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function post(url, body, token) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

async function patch(url, body, token) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

async function get(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

// ─── ──────────────────────────────────────────────────────────────────────────
//  SEED DATA — Edit this section to match your real data
// ─── ──────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    title:             "Library Management System",
    short_description: "Complete library management with book tracking, member management, and automated fine calculation.",
    description:       "Full lifecycle library system covering book cataloguing, member management, book issue/return, automatic fine calculation, admin dashboard, search & filter, and detailed reports.",
    category:          "web",
    level:             "intermediate",
    delivery_time:     "1 week",
    sale_price:        9999,
    original_price:    15000,
    badge:             "popular",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["React", "Django", "PostgreSQL"],
    key_features:      ["Book Catalog", "Member Management", "Issue/Return System", "Fine Calculation", "Admin Dashboard"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    demo_video_url:    "",
  },
  {
    title:             "Hospital Management System",
    short_description: "Comprehensive hospital management with patient records, appointments, and billing.",
    description:       "Full-featured HMS covering patient registration, doctor scheduling, OPD/IPD management, pharmacy inventory, billing, and reporting.",
    category:          "web",
    level:             "advanced",
    delivery_time:     "1 week",
    sale_price:        14999,
    original_price:    19000,
    badge:             "hot",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["Django", "React", "PostgreSQL"],
    key_features:      ["Patient Records", "Appointment System", "Billing", "Doctor Management", "Pharmacy"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    demo_video_url:    "",
  },
  {
    title:             "AI ChatBot System",
    short_description: "Intelligent chatbot with natural language processing and learning capabilities.",
    description:       "NLP-powered chatbot that learns from conversations, integrates with websites and WhatsApp, tracks analytics, and supports multi-platform deployment.",
    category:          "ai_ml",
    level:             "expert",
    delivery_time:     "1 week",
    sale_price:        14999,
    original_price:    20500,
    badge:             "new",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["Python", "TensorFlow", "Flask"],
    key_features:      ["NLP Processing", "Learning Algorithm", "Multi-platform Deploy", "Analytics Dashboard"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Model Weights"],
    demo_video_url:    "",
  },
  {
    title:             "Inventory Management System",
    short_description: "Advanced inventory tracking with analytics, alerts, and multi-location support.",
    description:       "Track stock across multiple warehouses, set reorder level alerts, scan barcodes, generate purchase orders, and view analytics dashboards.",
    category:          "web",
    level:             "intermediate",
    delivery_time:     "1-2 weeks",
    sale_price:        12999,
    original_price:    15500,
    badge:             "",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["React", "Django", "Redis"],
    key_features:      ["Multi-location Stock", "Analytics", "Low-stock Alerts", "Barcode Support"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    demo_video_url:    "",
  },
  {
    title:             "Stock Price Prediction",
    short_description: "ML-powered stock price prediction using LSTM neural networks and historical data.",
    description:       "Uses LSTM deep learning to predict stock prices from historical OHLCV data. Includes live data fetching, prediction charts, backtesting, and model evaluation.",
    category:          "data_science",
    level:             "expert",
    delivery_time:     "1-2 weeks",
    sale_price:        16999,
    original_price:    22000,
    badge:             "popular",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["Python", "Keras", "Pandas"],
    key_features:      ["LSTM Model", "Live Data Fetch", "Prediction Charts", "Backtesting"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Trained Model"],
    demo_video_url:    "",
  },
  {
    title:             "Expense Tracker App",
    short_description: "Mobile-first expense tracking app with charts, budgets, and category management.",
    description:       "Track daily expenses, set monthly budgets per category, visualise spending patterns with charts, export reports as PDF/CSV.",
    category:          "mobile",
    level:             "beginner",
    delivery_time:     "3-5 days",
    sale_price:        7499,
    original_price:    10000,
    badge:             "",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["React Native", "Firebase"],
    key_features:      ["Budget Tracking", "Spending Charts", "Categories", "PDF/CSV Export"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial"],
    demo_video_url:    "",
  },
  {
    title:             "Hardware Store Management",
    short_description: "Inventory management system for hardware stores with billing and stock tracking.",
    description:       "Manage hardware store inventory end-to-end. Track stock levels, generate bills, manage suppliers, send low-stock alerts, and view sales reports.",
    category:          "web",
    level:             "advanced",
    delivery_time:     "1 week",
    sale_price:        14999,
    original_price:    19000,
    badge:             "",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["Next.js", "Django", "MySQL"],
    key_features:      ["Inventory Tracking", "Billing System", "Supplier Management", "Sales Reports"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    demo_video_url:    "",
  },
  {
    title:             "Code Collaboration Platform",
    short_description: "Real-time code sharing and collaboration platform with version control.",
    description:       "A GitHub-meets-CodePen platform for teams to write, share, and review code in real time. Includes version history, team chat, and project management.",
    category:          "web",
    level:             "advanced",
    delivery_time:     "2-3 weeks",
    sale_price:        14999,
    original_price:    25000,
    badge:             "hot",
    status:            "active",
    is_sold_out:       false,
    technologies:      ["React", "Node.js", "Socket.io"],
    key_features:      ["Real-time Editing", "Version Control", "Team Chat", "Project Management"],
    whats_included:    ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    demo_video_url:    "",
  },
];

const COUPONS = [
  {
    code:              "STUDENT20",
    description:       "20% off for all students",
    discount_type:     "percentage",
    discount_value:    "20.00",
    min_order_amount:  "0.00",
    max_uses:          null,
    is_active:         true,
    valid_from:        new Date().toISOString(),
    valid_until:       "2028-12-31T23:59:59.000Z",
  },
  {
    code:              "WELCOME20",
    description:       "20% off welcome discount",
    discount_type:     "percentage",
    discount_value:    "20.00",
    min_order_amount:  "0.00",
    max_uses:          null,
    is_active:         true,
    valid_from:        new Date().toISOString(),
    valid_until:       "2028-12-31T23:59:59.000Z",
  },
  {
    code:              "FLAT500",
    description:       "Flat ₹500 off on any order",
    discount_type:     "fixed",
    discount_value:    "500.00",
    min_order_amount:  "5000.00",
    max_uses:          null,
    is_active:         true,
    valid_from:        new Date().toISOString(),
    valid_until:       "2028-12-31T23:59:59.000Z",
  },
  {
    code:              "LAUNCH10",
    description:       "10% launch discount",
    discount_type:     "percentage",
    discount_value:    "10.00",
    min_order_amount:  "0.00",
    max_uses:          null,
    is_active:         true,
    valid_from:        new Date().toISOString(),
    valid_until:       "2028-12-31T23:59:59.000Z",
  },
  {
    code:              "SAVE20",
    description:       "Save 20% on your order",
    discount_type:     "percentage",
    discount_value:    "20.00",
    min_order_amount:  "0.00",
    max_uses:          200,
    is_active:         true,
    valid_from:        new Date().toISOString(),
    valid_until:       "2028-12-31T23:59:59.000Z",
  },
  {
    code:              "WEBXTERS",
    description:       "Summer campaign — 50% off",
    discount_type:     "percentage",
    discount_value:    "50.00",
    min_order_amount:  "0.00",
    max_uses:          100,
    is_active:         true,
    valid_from:        new Date().toISOString(),
    valid_until:       "2028-12-31T23:59:59.000Z",
  },
  {
    code:              "SAMMY",
    description:       "Summer sale — 10% off",
    discount_type:     "percentage",
    discount_value:    "10.00",
    min_order_amount:  "0.00",
    max_uses:          null,
    is_active:         true,
    valid_from:        new Date().toISOString(),
    valid_until:       "2028-12-31T23:59:59.000Z",
  },
];

const SETTINGS = {
  site_name:           "Webxter Student Projects",
  tagline:             "Professional projects for final year students",
  email:               "projects@webxter.in",
  phone:               "+91-8264796534",
  whatsapp:            "+91-8264796534",
  coupon_code:         "STUDENT20",
  coupon_discount:     20,
  maintenance_mode:    false,
  maintenance_message: "We're currently under maintenance. We'll be back shortly.",
  show_marquee:        true,
  marquee_text:        "20% OFF for Final Year Students — Use code STUDENT20",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(W(`\n${"═".repeat(60)}`));
  console.log(W("  WEBXTER — Full Data Seed"));
  console.log(W(`  Backend: ${BASE}`));
  console.log(W(`${"═".repeat(60)}\n`));

  // ── Step 1: Login ────────────────────────────────────────────────────────
  process.stdout.write(B("🔐 Logging in...  "));
  const { ok: loginOk, data: loginData } = await post(
    `${BASE}/api/v1/auth/login/`,
    { email: EMAIL, password: PASSWORD }
  );

  if (!loginOk || !loginData.access) {
    console.log(R("❌ Login failed. Check email/password and that the backend is running."));
    if (loginData) console.log("   Response:", JSON.stringify(loginData).slice(0, 200));
    process.exit(1);
  }

  const token = loginData.access;
  const user  = loginData.user || {};
  if (!user.is_staff && !user.is_superuser) {
    console.log(R("❌ This account is not an admin (is_staff or is_superuser must be true)."));
    process.exit(1);
  }
  console.log(G(`✅ Logged in as ${user.email || EMAIL}\n`));

  // ── Step 2: Seed Settings ────────────────────────────────────────────────
  console.log(B("⚙️  Saving site settings..."));
  const { ok: setOk } = await patch(`${BASE}/api/v1/admin/settings/`, SETTINGS, token);
  console.log(setOk ? G("   ✅ Settings saved") : Y("   ⚠️  Settings endpoint not available (skip)"));

  // ── Step 3: Seed Coupons ─────────────────────────────────────────────────
  console.log(B("\n🎟️  Seeding coupons..."));

  // Fetch existing coupons to avoid duplicates
  const { data: existingCouponsData } = await get(`${BASE}/api/v1/admin/coupons/`, token);
  const existingCoupons = Array.isArray(existingCouponsData)
    ? existingCouponsData
    : (existingCouponsData.results || []);
  const existingCodes = new Set(existingCoupons.map((c) => (c.code || "").toUpperCase()));

  let couponCreated = 0, couponSkipped = 0;
  for (const coupon of COUPONS) {
    const code = coupon.code.toUpperCase();
    if (existingCodes.has(code)) {
      console.log(Y(`   ⏭  ${code} — already exists, skipped`));
      couponSkipped++;
      continue;
    }
    process.stdout.write(`   📄 Creating ${code}...  `);
    const { ok, data } = await post(`${BASE}/api/v1/admin/coupons/`, coupon, token);
    if (ok) {
      console.log(G(`✅  (id=${data.id})`));
      couponCreated++;
    } else {
      console.log(R(`❌  (${JSON.stringify(data).slice(0, 100)})`));
    }
  }
  console.log(`   → ${G(couponCreated + " created")}, ${Y(couponSkipped + " skipped")}`);

  // ── Step 4: Seed Projects ────────────────────────────────────────────────
  console.log(B("\n📦  Seeding projects..."));

  const { data: existingProjectsData } = await get(`${BASE}/api/v1/admin/projects/`, token);
  const existingProjects = Array.isArray(existingProjectsData)
    ? existingProjectsData
    : (existingProjectsData.results || []);
  const existingTitles = new Set(existingProjects.map((p) => (p.title || "").toLowerCase().trim()));

  let projCreated = 0, projSkipped = 0;
  for (const project of PROJECTS) {
    const titleKey = project.title.toLowerCase().trim();
    if (existingTitles.has(titleKey)) {
      console.log(Y(`   ⏭  "${project.title}" — already exists, skipped`));
      projSkipped++;
      continue;
    }
    process.stdout.write(`   📦 Creating "${project.title}"...  `);
    const { ok, data } = await post(`${BASE}/api/v1/admin/projects/`, project, token);
    if (ok) {
      console.log(G(`✅  (id=${data.id})`));
      projCreated++;
    } else {
      console.log(R(`❌  (${JSON.stringify(data).slice(0, 150)})`));
    }
  }
  console.log(`   → ${G(projCreated + " created")}, ${Y(projSkipped + " skipped")}`);

  // ── Done ────────────────────────────────────────────────────────────────
  console.log(W(`\n${"═".repeat(60)}`));
  console.log(G("  ✅  Seed complete! Your backend now has all data."));
  console.log(W(`${"═".repeat(60)}\n`));
  console.log("  Next steps:");
  console.log("  1. Start frontend:  npm run dev");
  console.log("  2. Open:            http://localhost:5173");
  console.log("  3. Admin panel:     http://localhost:5173/admin/login\n");
}

main().catch((err) => {
  console.error(R(`\n❌  Unexpected error: ${err.message}`));
  process.exit(1);
});
