#!/usr/bin/env node
/**
 * ============================================================
 *  WEBXTER — Demo Data Seed Script
 * ============================================================
 *  Seeds demo users with orders (delivered, cancelled, pending),
 *  coupons, and revenue data for UI/functionality testing.
 *
 *  Usage:
 *    node scripts/seed-demo.mjs <admin-email> <admin-password> [base-url]
 *
 *  Examples:
 *    node scripts/seed-demo.mjs admin@webxter.in Admin@1234
 *    node scripts/seed-demo.mjs admin@webxter.in Admin@1234 http://127.0.0.1:8000
 *
 *  What it seeds:
 *    ✅ 3 Demo student users (with known credentials)
 *    ✅ Orders with statuses: pending, confirmed, in_progress, delivered, cancelled
 *    ✅ Orders with coupons applied (discount amounts)
 *    ✅ Revenue data (delivered orders)
 *    ✅ Coupons (if not already present)
 *
 *  Demo login credentials after seeding:
 *    student1@demo.com  / Demo@1234
 *    student2@demo.com  / Demo@1234
 *    student3@demo.com  / Demo@1234
 * ============================================================
 */

const [, , EMAIL, PASSWORD, BASE_ARG] = process.argv;
const BASE = (BASE_ARG || "http://127.0.0.1:8000").replace(/\/$/, "");

if (!EMAIL || !PASSWORD) {
  console.error("\n❌  Usage: node scripts/seed-demo.mjs <admin-email> <admin-password> [base-url]");
  console.error("    Example: node scripts/seed-demo.mjs admin@webxter.in Admin@1234\n");
  process.exit(1);
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`;
const R = (s) => `\x1b[31m${s}\x1b[0m`;
const Y = (s) => `\x1b[33m${s}\x1b[0m`;
const B = (s) => `\x1b[36m${s}\x1b[0m`;
const W = (s) => `\x1b[1m${s}\x1b[0m`;

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
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

async function patch(url, body, token) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

async function get(url, token) {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Demo Users ───────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    email:      "student1@demo.com",
    password:   "Demo@1234",
    first_name: "Rahul",
    last_name:  "Sharma",
    phone:      "9876543210",
    college:    "IIT Delhi",
    year:       "4th Year",
    bio:        "Final year B.Tech CSE student",
  },
  {
    email:      "student2@demo.com",
    password:   "Demo@1234",
    first_name: "Priya",
    last_name:  "Patel",
    phone:      "9123456789",
    college:    "NIT Surat",
    year:       "3rd Year",
    bio:        "MCA student passionate about web dev",
  },
  {
    email:      "student3@demo.com",
    password:   "Demo@1234",
    first_name: "Arjun",
    last_name:  "Singh",
    phone:      "9988776655",
    college:    "VIT Vellore",
    year:       "Final Year",
    bio:        "BCA student exploring AI projects",
  },
];

// ─── Coupons ──────────────────────────────────────────────────────────────────
const COUPONS = [
  {
    code:             "STUDENT20",
    description:      "20% off for all students",
    discount_type:    "percentage",
    discount_value:   "20.00",
    min_order_amount: "0.00",
    max_uses:         null,
    is_active:        true,
    valid_from:       new Date().toISOString(),
    valid_until:      "2028-12-31T23:59:59.000Z",
  },
  {
    code:             "WELCOME20",
    description:      "20% off welcome discount",
    discount_type:    "percentage",
    discount_value:   "20.00",
    min_order_amount: "0.00",
    max_uses:         null,
    is_active:        true,
    valid_from:       new Date().toISOString(),
    valid_until:      "2028-12-31T23:59:59.000Z",
  },
  {
    code:             "FLAT500",
    description:      "Flat ₹500 off on any order",
    discount_type:    "fixed",
    discount_value:   "500.00",
    min_order_amount: "5000.00",
    max_uses:         null,
    is_active:        true,
    valid_from:       new Date().toISOString(),
    valid_until:      "2028-12-31T23:59:59.000Z",
  },
  {
    code:             "LAUNCH10",
    description:      "10% launch discount",
    discount_type:    "percentage",
    discount_value:   "10.00",
    min_order_amount: "0.00",
    max_uses:         null,
    is_active:        true,
    valid_from:       new Date().toISOString(),
    valid_until:      "2028-12-31T23:59:59.000Z",
  },
  {
    code:             "SAVE20",
    description:      "Save 20% on your order",
    discount_type:    "percentage",
    discount_value:   "20.00",
    min_order_amount: "0.00",
    max_uses:         200,
    is_active:        true,
    valid_from:       new Date().toISOString(),
    valid_until:      "2028-12-31T23:59:59.000Z",
  },
  {
    code:             "WEBXTERS",
    description:      "Summer campaign — 50% off",
    discount_type:    "percentage",
    discount_value:   "50.00",
    min_order_amount: "0.00",
    max_uses:         100,
    is_active:        true,
    valid_from:       new Date().toISOString(),
    valid_until:      "2028-12-31T23:59:59.000Z",
  },
  {
    code:             "SAMMY",
    description:      "Summer sale — 10% off",
    discount_type:    "percentage",
    discount_value:   "10.00",
    min_order_amount: "0.00",
    max_uses:         null,
    is_active:        true,
    valid_from:       new Date().toISOString(),
    valid_until:      "2028-12-31T23:59:59.000Z",
  },
  {
    code:             "EXPIRED10",
    description:      "Expired test coupon",
    discount_type:    "percentage",
    discount_value:   "10.00",
    min_order_amount: "0.00",
    max_uses:         null,
    is_active:        false,
    valid_from:       "2024-01-01T00:00:00Z",
    valid_until:      "2024-12-31T23:59:59.000Z",
  },
];

// ─── Order Templates ──────────────────────────────────────────────────────────
// These will be created for each demo user using real project IDs fetched from backend.
// projectIndex = index into the projects list fetched from backend (0-based)
const ORDER_TEMPLATES = [
  // Student 1 — Rahul: 2 delivered (revenue), 1 cancelled, 1 pending
  {
    userIndex:       0,
    projectIndex:    0,   // Library Management System
    total_amount:    9999,
    discount_amount: 1999, // ~20% STUDENT20
    final_amount:    7999,
    coupon_code:     "STUDENT20",
    pay_method:      "razorpay",
    targetStatus:    "delivered",
    notes:           "Razorpay Payment ID: pay_demo001 | Phone: 9876543210 | College: IIT Delhi",
  },
  {
    userIndex:       0,
    projectIndex:    2,   // AI ChatBot
    total_amount:    14999,
    discount_amount: 2999,
    final_amount:    11999,
    coupon_code:     "WELCOME20",
    pay_method:      "upi",
    targetStatus:    "delivered",
    notes:           "UPI TxnID: UPI0012345 | Phone: 9876543210 | College: IIT Delhi",
  },
  {
    userIndex:       0,
    projectIndex:    4,   // Stock Prediction
    total_amount:    16999,
    discount_amount: 0,
    final_amount:    16999,
    coupon_code:     "",
    pay_method:      "whatsapp",
    targetStatus:    "cancelled",
    notes:           "WhatsApp order | Phone: 9876543210 | College: IIT Delhi | Reason: Changed requirements",
  },
  {
    userIndex:       0,
    projectIndex:    3,   // Inventory
    total_amount:    12999,
    discount_amount: 500,
    final_amount:    12499,
    coupon_code:     "FLAT500",
    pay_method:      "bank",
    targetStatus:    "pending",
    notes:           "Bank Transfer | Phone: 9876543210 | College: IIT Delhi | UTR: UTR00456789",
  },

  // Student 2 — Priya: 1 delivered, 1 in_progress, 1 confirmed, 1 cancelled
  {
    userIndex:       1,
    projectIndex:    1,   // Hospital Management
    total_amount:    14999,
    discount_amount: 1499,
    final_amount:    13499,
    coupon_code:     "LAUNCH10",
    pay_method:      "razorpay",
    targetStatus:    "delivered",
    notes:           "Razorpay Payment ID: pay_demo002 | Phone: 9123456789 | College: NIT Surat",
  },
  {
    userIndex:       1,
    projectIndex:    5,   // Expense Tracker
    total_amount:    7499,
    discount_amount: 0,
    final_amount:    7499,
    coupon_code:     "",
    pay_method:      "upi",
    targetStatus:    "in_progress",
    notes:           "UPI TxnID: UPI0067890 | Phone: 9123456789 | College: NIT Surat",
  },
  {
    userIndex:       1,
    projectIndex:    7,   // Code Collaboration
    total_amount:    14999,
    discount_amount: 2999,
    final_amount:    11999,
    coupon_code:     "SAVE20",
    pay_method:      "razorpay",
    targetStatus:    "confirmed",
    notes:           "Razorpay Payment ID: pay_demo003 | Phone: 9123456789 | College: NIT Surat",
  },
  {
    userIndex:       1,
    projectIndex:    6,   // Hardware Store
    total_amount:    14999,
    discount_amount: 0,
    final_amount:    14999,
    coupon_code:     "",
    pay_method:      "whatsapp",
    targetStatus:    "cancelled",
    notes:           "WhatsApp order | Phone: 9123456789 | Reason: Duplicate order",
  },

  // Student 3 — Arjun: 1 delivered, 1 pending
  {
    userIndex:       2,
    projectIndex:    2,   // AI ChatBot
    total_amount:    14999,
    discount_amount: 7499,
    final_amount:    7499,
    coupon_code:     "WEBXTERS",  // 50% off
    pay_method:      "razorpay",
    targetStatus:    "delivered",
    notes:           "Razorpay Payment ID: pay_demo004 | Phone: 9988776655 | College: VIT Vellore",
  },
  {
    userIndex:       2,
    projectIndex:    0,   // Library Management
    total_amount:    9999,
    discount_amount: 999,
    final_amount:    8999,
    coupon_code:     "SAMMY",  // 10% off
    pay_method:      "upi",
    targetStatus:    "pending",
    notes:           "UPI TxnID: UPI0099001 | Phone: 9988776655 | College: VIT Vellore",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(W(`\n${"═".repeat(60)}`));
  console.log(W("  WEBXTER — Demo Data Seed"));
  console.log(W(`  Backend: ${BASE}`));
  console.log(W(`${"═".repeat(60)}\n`));

  // ── Step 1: Admin Login ──────────────────────────────────────────────────
  process.stdout.write(B("🔐 Admin login...  "));
  const { ok: loginOk, data: loginData } = await post(
    `${BASE}/api/v1/auth/login/`,
    { email: EMAIL, password: PASSWORD }
  );

  if (!loginOk || !loginData.access) {
    console.log(R("❌ Login failed. Check email/password and that the backend is running."));
    if (loginData) console.log("   Response:", JSON.stringify(loginData).slice(0, 200));
    process.exit(1);
  }

  const adminToken = loginData.access;
  const adminUser  = loginData.user || {};
  if (!adminUser.is_staff && !adminUser.is_superuser) {
    console.log(R("❌ This account is not an admin."));
    process.exit(1);
  }
  console.log(G(`✅ Logged in as ${adminUser.email || EMAIL}\n`));

  // ── Step 2: Fetch projects ───────────────────────────────────────────────
  process.stdout.write(B("📦 Fetching projects from backend...  "));
  const { data: projectsData } = await get(`${BASE}/api/v1/admin/projects/`, adminToken);
  const projects = Array.isArray(projectsData)
    ? projectsData
    : (projectsData.results || []);

  if (projects.length === 0) {
    console.log(R("\n❌ No projects found. Run 'node scripts/seed.mjs' first to seed projects."));
    process.exit(1);
  }
  console.log(G(`✅ Found ${projects.length} projects\n`));

  // ── Step 3: Seed Coupons ─────────────────────────────────────────────────
  console.log(B("🎟️  Seeding coupons..."));
  const { data: existingCouponsData } = await get(`${BASE}/api/v1/admin/coupons/`, adminToken);
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
    const { ok, data } = await post(`${BASE}/api/v1/admin/coupons/`, coupon, adminToken);
    if (ok) {
      console.log(G(`✅  (id=${data.id})`));
      couponCreated++;
    } else {
      console.log(R(`❌  (${JSON.stringify(data).slice(0, 100)})`));
    }
  }
  console.log(`   → ${G(couponCreated + " created")}, ${Y(couponSkipped + " skipped")}\n`);

  // ── Step 4: Register demo students ──────────────────────────────────────
  console.log(B("👤  Registering demo student accounts..."));
  const userTokens = [];

  for (const u of DEMO_USERS) {
    process.stdout.write(`   👤 ${u.first_name} ${u.last_name} (${u.email})...  `);

    // Try register first
    const { ok: regOk, data: regData } = await post(
      `${BASE}/api/v1/auth/register/`,
      {
        email:      u.email,
        first_name: u.first_name,
        last_name:  u.last_name,
        password:   u.password,
        password2:  u.password,
        phone:      u.phone,
        college:    u.college,
        year:       u.year,
      }
    );

    if (regOk && regData.tokens?.access) {
      console.log(G(`✅ Registered (id=${regData.user?.id})`));
      userTokens.push(regData.tokens.access);

      // Update profile with bio if register endpoint supports it
      if (u.bio) {
        await patch(
          `${BASE}/api/v1/auth/profile/`,
          { bio: u.bio },
          regData.tokens.access
        );
      }
      continue;
    }

    // Already exists — try login
    const alreadyExists =
      JSON.stringify(regData).toLowerCase().includes("already") ||
      JSON.stringify(regData).toLowerCase().includes("exists") ||
      JSON.stringify(regData).toLowerCase().includes("unique");

    if (alreadyExists || !regOk) {
      const { ok: loginOk2, data: loginData2 } = await post(
        `${BASE}/api/v1/auth/login/`,
        { email: u.email, password: u.password }
      );
      if (loginOk2 && loginData2.access) {
        console.log(Y(`⏭  Already exists, logged in`));
        userTokens.push(loginData2.access);
        continue;
      }
    }

    console.log(R(`❌ Failed: ${JSON.stringify(regData).slice(0, 100)}`));
    userTokens.push(null);
  }

  // ── Step 5: Create orders for each demo user ─────────────────────────────
  console.log(B("\n🛒  Creating demo orders..."));
  let ordersCreated = 0;

  for (const tmpl of ORDER_TEMPLATES) {
    const user       = DEMO_USERS[tmpl.userIndex];
    const userToken  = userTokens[tmpl.userIndex];
    const project    = projects[Math.min(tmpl.projectIndex, projects.length - 1)];

    if (!userToken) {
      console.log(Y(`   ⚠️  Skipping order for ${user.email} — no token`));
      continue;
    }
    if (!project) {
      console.log(Y(`   ⚠️  Skipping order — project index ${tmpl.projectIndex} not found`));
      continue;
    }

    const label = `${user.first_name} → "${project.title}" [${tmpl.targetStatus}]`;
    process.stdout.write(`   🛒 ${label}...  `);

    // Create order as the student
    const orderPayload = {
      project:         project.id,
      total_amount:    tmpl.total_amount,
      final_amount:    tmpl.final_amount,
      discount_amount: tmpl.discount_amount,
      notes:           tmpl.notes,
    };
    if (tmpl.coupon_code) orderPayload.coupon_code = tmpl.coupon_code;

    const { ok: orderOk, data: orderData } = await post(
      `${BASE}/api/v1/orders/`,
      orderPayload,
      userToken
    );

    if (!orderOk) {
      console.log(R(`❌ Failed: ${JSON.stringify(orderData).slice(0, 120)}`));
      continue;
    }

    const orderId = orderData.id;
    console.log(G(`✅ Created (id=${orderId})`));
    ordersCreated++;
    await sleep(100); // small delay to avoid hammering the server

    // Update status via admin endpoint if not "pending"
    if (tmpl.targetStatus !== "pending") {
      process.stdout.write(`      ↳ Setting status → ${tmpl.targetStatus}...  `);

      // Try PATCH /admin/orders/:id/status/
      const { ok: statusOk, data: statusData } = await patch(
        `${BASE}/api/v1/admin/orders/${orderId}/status/`,
        { status: tmpl.targetStatus },
        adminToken
      );

      if (statusOk) {
        console.log(G(`✅ ${tmpl.targetStatus}`));
      } else {
        // Fallback: try plain PATCH on the order detail
        const { ok: patchOk } = await patch(
          `${BASE}/api/v1/admin/orders/${orderId}/`,
          { status: tmpl.targetStatus },
          adminToken
        );
        if (patchOk) {
          console.log(G(`✅ ${tmpl.targetStatus} (via PATCH)`));
        } else {
          console.log(Y(`⚠️  Could not set status (${JSON.stringify(statusData).slice(0, 80)}). Update manually in admin.`));
        }
      }
      await sleep(100);
    }
  }

  // ── Step 6: Summary ─────────────────────────────────────────────────────
  // Calculate expected revenue from delivered orders
  const deliveredOrders = ORDER_TEMPLATES.filter((o) => o.targetStatus === "delivered");
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.final_amount, 0);

  console.log(W(`\n${"═".repeat(60)}`));
  console.log(G("  ✅  Demo seed complete!"));
  console.log(W(`${"═".repeat(60)}\n`));

  console.log(W("  📊 Summary:"));
  console.log(`     Users created/found : ${G(DEMO_USERS.length)}`);
  console.log(`     Orders created      : ${G(ordersCreated)}`);
  console.log(`     Expected revenue    : ${G("₹" + totalRevenue.toLocaleString("en-IN"))} (from delivered orders)\n`);

  console.log(W("  🔑 Demo Login Credentials:"));
  for (const u of DEMO_USERS) {
    console.log(`     ${B(u.email.padEnd(28))} password: ${Y(u.password)}`);
  }

  const pending   = ORDER_TEMPLATES.filter((o) => o.targetStatus === "pending").length;
  const confirmed = ORDER_TEMPLATES.filter((o) => o.targetStatus === "confirmed").length;
  const inProg    = ORDER_TEMPLATES.filter((o) => o.targetStatus === "in_progress").length;
  const delivered = ORDER_TEMPLATES.filter((o) => o.targetStatus === "delivered").length;
  const cancelled = ORDER_TEMPLATES.filter((o) => o.targetStatus === "cancelled").length;

  console.log(W("\n  📦 Order Breakdown:"));
  console.log(`     Pending     : ${Y(pending)}`);
  console.log(`     Confirmed   : ${B(confirmed)}`);
  console.log(`     In Progress : ${B(inProg)}`);
  console.log(`     Delivered   : ${G(delivered)}`);
  console.log(`     Cancelled   : ${R(cancelled)}`);

  console.log(W("\n  🎟️  Coupons to test at checkout:"));
  console.log(`     ${G("STUDENT20")}   → 20% off  (unlimited, active)`);
  console.log(`     ${G("WELCOME20")}   → 20% off  (unlimited, active)`);
  console.log(`     ${G("FLAT500")}     → ₹500 off (min order ₹5000)`);
  console.log(`     ${G("LAUNCH10")}    → 10% off  (unlimited, active)`);
  console.log(`     ${G("WEBXTERS")}    → 50% off  (max 100 uses)`);
  console.log(`     ${Y("EXPIRED10")}   → inactive (should show error)`);

  console.log(W("\n  🚀 Next steps:"));
  console.log("     1. Open admin:   http://localhost:5173/admin/login");
  console.log("     2. Login as any demo student to see their orders");
  console.log("     3. Dashboard should show revenue from delivered orders\n");
}

main().catch((err) => {
  console.error(R(`\n❌  Unexpected error: ${err.message}`));
  console.error(err.stack);
  process.exit(1);
});
