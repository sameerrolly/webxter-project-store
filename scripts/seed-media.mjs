#!/usr/bin/env node
/**
 * ============================================================
 *  WEBXTER — Project Media Seed Script
 * ============================================================
 *  Downloads images from picsum.photos (fully public),
 *  uploads them to Supabase Storage (Project-files bucket),
 *  then saves the public URLs to Django via admin API.
 *
 *  Each project gets:
 *    ★  1 Featured hero image (thumbnail)
 *    🖼  4 Screenshot images  (dashboard, features, UI views)
 *
 *  Usage:
 *    node scripts/seed-media.mjs <admin-email> <admin-password>
 *
 *  Example:
 *    node scripts/seed-media.mjs admin@webxter.com Admin@1234
 * ============================================================
 */

import { createClient }                   from "@supabase/supabase-js";
import { createWriteStream }              from "fs";
import { unlink, mkdir, readFile, rm }    from "fs/promises";
import { join, dirname }                  from "path";
import { fileURLToPath }                  from "url";
import { pipeline }                       from "stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────────
const [, , EMAIL, PASSWORD, BASE_ARG] = process.argv;
const BASE         = (BASE_ARG || "http://127.0.0.1:8000").replace(/\/$/, "");
const SUPABASE_URL = process.env.SUPABASE_URL       || "REPLACE_WITH_YOUR_SUPABASE_URL";
// Use service role key (bypasses RLS). Set via env: SUPABASE_SERVICE_KEY=sb_secret_...
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "REPLACE_WITH_YOUR_SUPABASE_SERVICE_KEY";
const BUCKET       = process.env.SUPABASE_BUCKET    || "Project-files";

if (!EMAIL || !PASSWORD) {
  console.error("\n❌  Usage: node scripts/seed-media.mjs <admin-email> <admin-password>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Colours ────────────────────────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;
const B = s => `\x1b[36m${s}\x1b[0m`;
const W = s => `\x1b[1m${s}\x1b[0m`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Django API ─────────────────────────────────────────────────────────────────
async function api(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
const GET    = (p, t)    => api("GET",   p, null, t);
const POST   = (p, b, t) => api("POST",  p, b,    t);
const PATCH  = (p, b, t) => api("PATCH", p, b,    t);
const DELETE_ = async (path, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return { ok: res.ok || res.status === 204 };
};

// ─── Download image ──────────────────────────────────────────────────────────────
async function downloadImg(url, dest) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "webxter-seed/1.0" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    await pipeline(res.body, createWriteStream(dest));
  } finally {
    clearTimeout(tid);
  }
}

// ─── Upload file to Supabase ──────────────────────────────────────────────────────
async function uploadFile(localPath, storagePath) {
  const bytes = await readFile(localPath);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType:  "image/jpeg",
      upsert:       true,
      cacheControl: "31536000",   // 1 year cache
    });
  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ─── Picsum image URLs ────────────────────────────────────────────────────────────
// picsum.photos/seed/<seed>/W/H  →  deterministic image, always same for same seed
// Seeds chosen to look like professional software screenshots
const IMG = (seed, w = 1280, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// ─── Media map — 1 thumbnail + 4 screenshots per project ─────────────────────────
const MEDIA = {
  "Library Management System": {
    thumbnail: IMG("lib-hero",  800, 500),
    images: [
      { caption: "Book Catalog Dashboard",   seed: "lib-1",  featured: true  },
      { caption: "Member Management",        seed: "lib-2",  featured: false },
      { caption: "Issue & Return System",    seed: "lib-3",  featured: false },
      { caption: "Fine Calculation Report",  seed: "lib-4",  featured: false },
    ],
  },
  "Hospital Management System": {
    thumbnail: IMG("hosp-hero", 800, 500),
    images: [
      { caption: "Patient Records Dashboard", seed: "hosp-1", featured: true  },
      { caption: "Doctor Appointment System", seed: "hosp-2", featured: false },
      { caption: "OPD / IPD Management",      seed: "hosp-3", featured: false },
      { caption: "Pharmacy & Billing",        seed: "hosp-4", featured: false },
    ],
  },
  "AI ChatBot System": {
    thumbnail: IMG("bot-hero",  800, 500),
    images: [
      { caption: "AI Chat Interface",           seed: "bot-1", featured: true  },
      { caption: "NLP Training Dashboard",      seed: "bot-2", featured: false },
      { caption: "Multi-platform Integration",  seed: "bot-3", featured: false },
      { caption: "Analytics & Insights",        seed: "bot-4", featured: false },
    ],
  },
  "Inventory Management System": {
    thumbnail: IMG("inv-hero",  800, 500),
    images: [
      { caption: "Stock Overview Dashboard",   seed: "inv-1", featured: true  },
      { caption: "Multi-location Warehouses",  seed: "inv-2", featured: false },
      { caption: "Low Stock Alerts",           seed: "inv-3", featured: false },
      { caption: "Sales Analytics Charts",     seed: "inv-4", featured: false },
    ],
  },
  "Stock Price Prediction": {
    thumbnail: IMG("stock-hero", 800, 500),
    images: [
      { caption: "LSTM Prediction Dashboard",  seed: "stock-1", featured: true  },
      { caption: "Price Chart & Forecast",     seed: "stock-2", featured: false },
      { caption: "Model Training Metrics",     seed: "stock-3", featured: false },
      { caption: "Backtesting Results",        seed: "stock-4", featured: false },
    ],
  },
  "Stock Price Prediction System": {
    thumbnail: IMG("stock-hero", 800, 500),
    images: [
      { caption: "LSTM Prediction Dashboard",  seed: "stock-1", featured: true  },
      { caption: "Price Chart & Forecast",     seed: "stock-2", featured: false },
      { caption: "Model Training Metrics",     seed: "stock-3", featured: false },
      { caption: "Backtesting Results",        seed: "stock-4", featured: false },
    ],
  },
  "Expense Tracker App": {
    thumbnail: IMG("exp-hero",  800, 500),
    images: [
      { caption: "Expense Dashboard",         seed: "exp-1", featured: true  },
      { caption: "Budget Tracking Screen",    seed: "exp-2", featured: false },
      { caption: "Category Charts",           seed: "exp-3", featured: false },
      { caption: "Monthly Report View",       seed: "exp-4", featured: false },
    ],
  },
  "Hardware Store Management": {
    thumbnail: IMG("hw-hero",   800, 500),
    images: [
      { caption: "Store Inventory Dashboard", seed: "hw-1", featured: true  },
      { caption: "Billing & Invoice System",  seed: "hw-2", featured: false },
      { caption: "Supplier Management",       seed: "hw-3", featured: false },
      { caption: "Sales Reports",             seed: "hw-4", featured: false },
    ],
  },
  "Hardware Store Management System": {
    thumbnail: IMG("hw-hero",   800, 500),
    images: [
      { caption: "Store Inventory Dashboard", seed: "hw-1", featured: true  },
      { caption: "Billing & Invoice System",  seed: "hw-2", featured: false },
      { caption: "Supplier Management",       seed: "hw-3", featured: false },
      { caption: "Sales Reports",             seed: "hw-4", featured: false },
    ],
  },
  "Code Collaboration Platform": {
    thumbnail: IMG("code-hero", 800, 500),
    images: [
      { caption: "Real-time Code Editor",     seed: "code-1", featured: true  },
      { caption: "Version Control History",   seed: "code-2", featured: false },
      { caption: "Team Chat & Comments",      seed: "code-3", featured: false },
      { caption: "Project Management Board",  seed: "code-4", featured: false },
    ],
  },
  "Student Management System": {
    thumbnail: IMG("stu-hero",  800, 500),
    images: [
      { caption: "Student Records Dashboard", seed: "stu-1", featured: true  },
      { caption: "Grade & Marks Module",      seed: "stu-2", featured: false },
      { caption: "Attendance Tracker",        seed: "stu-3", featured: false },
      { caption: "Fee Management",            seed: "stu-4", featured: false },
    ],
  },
};

// Generic fallback for any project not in the map
function getMediaDef(title) {
  if (MEDIA[title]) return MEDIA[title];
  const s = title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);
  return {
    thumbnail: IMG(`${s}-h`, 800, 500),
    images: [
      { caption: `${title} — Overview`,    seed: `${s}-1`, featured: true  },
      { caption: "Dashboard View",          seed: `${s}-2`, featured: false },
      { caption: "Feature Showcase",        seed: `${s}-3`, featured: false },
      { caption: "Admin Control Panel",     seed: `${s}-4`, featured: false },
    ],
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(W(`\n${"═".repeat(60)}`));
  console.log(W("  WEBXTER — Project Media Seed (Images Only)"));
  console.log(W(`  Backend  : ${BASE}`));
  console.log(W(`  Supabase : ${SUPABASE_URL}`));
  console.log(W(`  Bucket   : ${BUCKET}`));
  console.log(W(`${"═".repeat(60)}\n`));

  // ── 1. Admin login ───────────────────────────────────────────────────────
  process.stdout.write(B("🔐 Admin login...  "));
  const { ok: lOk, data: lData } = await POST("/api/v1/auth/login/", { email: EMAIL, password: PASSWORD }, null);
  if (!lOk || !lData.access) {
    console.log(R("❌ " + JSON.stringify(lData).slice(0, 100)));
    process.exit(1);
  }
  const token = lData.access;
  console.log(G(`✅ ${lData.user?.email || EMAIL}\n`));

  // ── 2. Test Supabase ─────────────────────────────────────────────────────
  process.stdout.write(B("🔌 Supabase connection...  "));
  const { error: testErr } = await supabase.storage
    .from(BUCKET)
    .upload("test/ping.txt", Buffer.from("ok"), { upsert: true, contentType: "text/plain" });
  if (testErr) {
    console.log(R(`❌ ${testErr.message}`));
    process.exit(1);
  }
  await supabase.storage.from(BUCKET).remove(["test/ping.txt"]);
  console.log(G("✅\n"));

  // ── 3. Fetch projects ────────────────────────────────────────────────────
  process.stdout.write(B("📦 Fetching projects...  "));
  const { ok: pOk, data: pData } = await GET("/api/v1/admin/projects/", token);
  const projects = Array.isArray(pData) ? pData : (pData.results || []);
  if (!pOk || projects.length === 0) {
    console.log(R("❌ No projects. Run: node scripts/seed.mjs first."));
    process.exit(1);
  }
  console.log(G(`✅ ${projects.length} projects\n`));

  // ── 4. Temp dir ──────────────────────────────────────────────────────────
  const tmpDir = join(__dirname, ".tmp-media");
  await mkdir(tmpDir, { recursive: true });

  let uploaded = 0, failed = 0;

  // ── 5. Process each project ──────────────────────────────────────────────
  for (const project of projects) {
    const pid   = project.id;
    const title = (project.title || `Project-${pid}`).trim();
    const def   = getMediaDef(title);

    console.log(W(`\n📁  ${title}  (id=${pid})`));

    // 5a. Upload thumbnail → Supabase → PATCH Django
    process.stdout.write(`   ★  Thumbnail...  `);
    try {
      const local = join(tmpDir, `thumb-${pid}.jpg`);
      await downloadImg(def.thumbnail, local);
      const url = await uploadFile(local, `projects/${pid}/thumbnail.jpg`);
      await unlink(local).catch(() => {});
      await PATCH(`/api/v1/admin/projects/${pid}/`, { thumbnail: url }, token);
      console.log(G(`✅  …${url.slice(-45)}`));
      uploaded++;
    } catch (e) {
      console.log(Y(`⚠️  ${e.message.slice(0, 70)}`));
      failed++;
    }
    await sleep(200);

    // 5b. Clear existing media items on this project (avoid duplicates)
    const { data: detail } = await GET(`/api/v1/admin/projects/${pid}/`, token);
    const existing = Array.isArray(detail?.media) ? detail.media : [];
    if (existing.length > 0) {
      process.stdout.write(`   🗑  Clearing ${existing.length} old media...  `);
      let cleared = 0;
      for (const m of existing) {
        const { ok } = await DELETE_(`/api/v1/admin/projects/${pid}/media/${m.id}/`, token);
        if (ok) cleared++;
        await sleep(80);
      }
      console.log(G(`✅ ${cleared} cleared`));
    }

    // 5c. Upload each screenshot → Supabase → POST to Django media endpoint
    for (let i = 0; i < def.images.length; i++) {
      const item = def.images[i];
      process.stdout.write(`   🖼  [${i + 1}/${def.images.length}] "${item.caption}"...  `);
      try {
        const local = join(tmpDir, `media-${pid}-${i}.jpg`);
        await downloadImg(IMG(item.seed), local);
        const url = await uploadFile(local, `projects/${pid}/media/${i}.jpg`);
        await unlink(local).catch(() => {});

        const { ok, data: mData } = await POST(
          `/api/v1/admin/projects/${pid}/media/`,
          {
            url,
            media_type:  "image",
            is_featured: item.featured,
            order:       i,
            caption:     item.caption,
          },
          token
        );

        if (ok) {
          console.log(G(`✅${item.featured ? " ★featured" : ""}  id=${mData.id}`));
          uploaded++;
        } else {
          console.log(Y(`⚠️  Django: ${JSON.stringify(mData).slice(0, 60)}`));
          failed++;
        }
        await sleep(300);
      } catch (e) {
        console.log(R(`❌ ${e.message.slice(0, 80)}`));
        failed++;
      }
    }
  }

  // ── 6. Clean up tmp dir ──────────────────────────────────────────────────
  await rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  // ── 7. Summary ───────────────────────────────────────────────────────────
  console.log(W(`\n${"═".repeat(60)}`));
  console.log(G("  ✅  Media seed complete!"));
  console.log(W(`${"═".repeat(60)}`));
  console.log(`\n  Uploaded to Supabase : ${G(uploaded)}`);
  console.log(`  Failed               : ${failed > 0 ? R(failed) : G(0)}`);
  console.log(`  Bucket               : ${B(BUCKET)}`);
  console.log(`\n  Each project now has:`);
  console.log(`     ★  1 featured thumbnail`);
  console.log(`     🖼  4 screenshot images\n`);
  console.log(`  Open ${B("http://localhost:5173")} to see results.\n`);
}

main().catch(err => {
  console.error(R(`\n❌  ${err.message}`));
  process.exit(1);
});
