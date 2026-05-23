/**
 * seed-projects.mjs
 * Run: node seed-projects.mjs <admin-email> <admin-password>
 * Example: node seed-projects.mjs admin@webxter.in mypassword
 *
 * Creates 4 sample projects via the Django backend API.
 */

const BASE = "http://127.0.0.1:8000";
const [, , EMAIL, PASSWORD] = process.argv;

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node seed-projects.mjs <admin-email> <admin-password>");
  process.exit(1);
}

// ─── 4 sample projects ────────────────────────────────────────────────────────
const PROJECTS = [
  {
    title:          "Library Management System",
    description:    "Complete library management with book tracking, member management, and automated fine calculation.",
    long_desc:      "Full lifecycle library system — cataloguing books, managing members, issuing/returning books, auto-calculating fines, admin dashboard, search & filter, and detailed reports.",
    category:       "Web Development",
    level:          "Intermediate",
    delivery:       "1 week",
    price:          9999,
    original_price: 15000,
    badge:          "Popular",
    active:         true,
    sold_out:       false,
    tags:           ["React", "Django", "PostgreSQL"],
    features:       ["Book Catalog", "Member Management", "Issue/Return System", "Fine Calculation"],
    includes:       ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    screenshots:    ["https://picsum.photos/seed/lib1/800/500"],
    media:          [{ type: "image", url: "https://picsum.photos/seed/lib1/800/500", caption: "Dashboard Overview", featured: true }],
  },
  {
    title:          "Hospital Management System",
    description:    "Comprehensive hospital management with patient records, appointments, and billing.",
    long_desc:      "Full-featured HMS covering patient registration, doctor scheduling, OPD/IPD management, pharmacy, and billing.",
    category:       "Web Development",
    level:          "Advanced",
    delivery:       "1 week",
    price:          14999,
    original_price: 19000,
    badge:          "Hot",
    active:         true,
    sold_out:       false,
    tags:           ["Django", "React", "PostgreSQL"],
    features:       ["Patient Records", "Appointment System", "Billing", "Doctor Management"],
    includes:       ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Deployment Guide"],
    screenshots:    ["https://picsum.photos/seed/hosp1/800/500"],
    media:          [{ type: "image", url: "https://picsum.photos/seed/hosp1/800/500", caption: "Patient Dashboard", featured: true }],
  },
  {
    title:          "AI ChatBot System",
    description:    "Intelligent chatbot with natural language processing and learning capabilities.",
    long_desc:      "NLP-powered chatbot that learns from conversations, supports multi-platform deployment, and provides analytics.",
    category:       "AI/ML",
    level:          "Expert",
    delivery:       "1 week",
    price:          14999,
    original_price: 20500,
    badge:          "New",
    active:         true,
    sold_out:       false,
    tags:           ["Python", "TensorFlow", "Flask"],
    features:       ["NLP Processing", "Learning Algorithm", "Multi-platform", "Analytics"],
    includes:       ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial", "Model Weights"],
    screenshots:    ["https://picsum.photos/seed/ai1/800/500"],
    media:          [{ type: "image", url: "https://picsum.photos/seed/ai1/800/500", caption: "Chat Interface", featured: true }],
  },
  {
    title:          "Expense Tracker App",
    description:    "Mobile-first expense tracking app with charts, budgets, and category management.",
    long_desc:      "Track daily expenses, set monthly budgets per category, visualise spending with charts, and export reports.",
    category:       "Mobile",
    level:          "Beginner",
    delivery:       "3-5 days",
    price:          7499,
    original_price: 10000,
    badge:          "",
    active:         true,
    sold_out:       false,
    tags:           ["React Native", "Firebase"],
    features:       ["Budget Tracking", "Charts", "Categories", "Export Reports"],
    includes:       ["Full Source Code", "Documentation (PDF)", "PPT Presentation", "Video Tutorial"],
    screenshots:    ["https://picsum.photos/seed/exp1/800/500"],
    media:          [{ type: "image", url: "https://picsum.photos/seed/exp1/800/500", caption: "Home Screen", featured: true }],
  },
];

async function main() {
  // ── Step 1: Login ──────────────────────────────────────────────────────────
  console.log(`\n🔐 Logging in as ${EMAIL}...`);
  const loginRes = await fetch(`${BASE}/api/v1/auth/login/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    console.error("❌ Login failed:", err);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  const token = loginData.access;
  const user  = loginData.user || {};

  if (!user.is_staff && !user.is_superuser) {
    console.error("❌ This account is not an admin (is_staff/is_superuser must be true).");
    process.exit(1);
  }

  console.log(`✅ Logged in as ${user.email || EMAIL} (staff=${user.is_staff}, superuser=${user.is_superuser})`);

  // ── Step 2: Create each project ────────────────────────────────────────────
  let created = 0;
  for (const project of PROJECTS) {
    process.stdout.write(`\n📦 Creating "${project.title}"... `);
    const res = await fetch(`${BASE}/api/v1/admin/projects/`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(project),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Created (id=${data.id || "?"})`);
      created++;
    } else {
      const err = await res.text();
      console.log(`❌ Failed (${res.status}): ${err.slice(0, 200)}`);
    }
  }

  console.log(`\n🎉 Done — ${created}/${PROJECTS.length} projects created.`);
  console.log("👉 Open http://localhost:5173 to see them on the project listing page.\n");
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err.message);
  process.exit(1);
});
