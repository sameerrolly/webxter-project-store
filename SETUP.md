# Webxter Project Store — Setup Guide

Follow these steps on any machine after cloning the repo.
Run them ONCE — all data is stored in the Django backend database permanently.

---

## Step 1 — Install Node.js dependencies

```bash
npm install
```

---

## Step 2 — Configure environment

Copy the example env file and fill in your values:

```bash
# For local development:
copy .env.example .env.local

# For production deployment:
copy .env.example .env.production
```

Edit the file and set:
- `VITE_API_URL` — your Django backend URL
- `VITE_RAZORPAY_KEY_ID` — your Razorpay key (test or live)

The `.env` file already contains safe placeholder defaults for local dev.

---

## Step 3 — Start the Django backend

Make sure your Django backend is running before seeding data.

```bash
# In your Django backend directory:
python manage.py runserver
```

Backend should be accessible at `http://127.0.0.1:8000` (or your configured URL).

---

## Step 4 — Seed ALL data into the backend (run once per machine)

This seeds all projects, coupons, and settings into the Django database.
Safe to re-run — skips items that already exist.

```bash
node scripts/seed.mjs <admin-email> <admin-password>
```

**Example:**
```bash
node scripts/seed.mjs admin@webxter.in Admin@1234
```

**For a remote/production backend:**
```bash
node scripts/seed.mjs admin@webxter.in Admin@1234 https://api.webxter.in
```

The script will output:
```
✅ Logged in as admin@webxter.in
⚙️  Saving site settings...    ✅ Settings saved
🎟️  Seeding coupons...
   ✅ STUDENT20 (id=12)
   ✅ WELCOME20 (id=11)
   ...
📦  Seeding projects...
   ✅ Library Management System (id=1)
   ✅ Hospital Management System (id=2)
   ...
✅  Seed complete!
```

---

## Step 5 — Start the frontend

```bash
npm run dev
```

Open: http://localhost:5173

Admin panel: http://localhost:5173/admin/login

---

## Why data doesn't get lost

All data (projects, coupons, orders, settings) lives in the **Django backend database** (PostgreSQL).
The frontend only reads from and writes to the backend — nothing important is stored in the browser.

When you:
- **Push code** → data stays in the database, unaffected
- **Clone on a new machine** → run `node scripts/seed.mjs` once to populate the database
- **New student registers/orders** → saved permanently to the database
- **Admin creates a project/coupon** → saved permanently to the database

The `localStorage` in the browser is only used as a short-term cache (coupons for offline checkout validation, JWT tokens for auth). It is never the source of truth.

---

## Adding new data to the seed

If you add new projects or coupons in the admin panel and want them in the seed for future clones:

1. Open `scripts/seed.mjs`
2. Add your item to the `PROJECTS` or `COUPONS` array
3. Commit the file to git

Next time anyone clones, running `node scripts/seed.mjs` will create the new items.

---

## Troubleshooting

**"Login failed"**
→ Check the backend is running and the email/password is correct.
→ Make sure the account has `is_staff=True` or `is_superuser=True` in Django admin.

**"Settings endpoint not available"**
→ The settings PATCH endpoint may not be implemented yet. Settings will use defaults.
→ See `backend/ANALYTICS_SETUP.md` for backend implementation details.

**Projects or coupons show "already exists, skipped"**
→ That's correct — the seed is safe to re-run without duplicating data.

**Frontend shows no projects after seeding**
→ Make sure `VITE_API_URL` in `.env` matches where your backend is running.
