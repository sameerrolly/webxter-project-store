# Backend Changes Required — Webxter Project Store
# Paste this entire file as a prompt to your backend AI / developer.
# ============================================================

I have a React + Django REST Framework project called Webxter Project Store.
The frontend is complete. I need you to verify and implement the following
endpoints and model changes in the Django backend so everything works end-to-end.

Below is the COMPLETE list of every API endpoint the frontend calls,
exactly what request/response shape is expected, and what needs to be added or fixed.

---

## TECH STACK
- Django 5.0.6
- djangorestframework 3.15.2
- djangorestframework-simplejwt 5.3.1
- django-cors-headers 4.4.0
- psycopg2-binary (PostgreSQL)
- Pillow 10.4.0
- Base API prefix: /api/v1/

---

## 1. AUTH ENDPOINTS (likely already exist — verify these work correctly)

### POST /api/v1/auth/login/
Request:  { "email": "user@example.com", "password": "..." }
Response: {
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Rahul",
    "last_name": "Sharma",
    "is_staff": false,
    "is_superuser": false,
    "phone": "",
    "college": "",
    "year": "",
    "bio": "",
    "avatar": null   ← full absolute URL or null
  }
}
NOTE: The user object MUST include is_staff and is_superuser.
Admin login checks these — if both are false, admin access is blocked.

### POST /api/v1/auth/register/
Request:  {
  "email": "...", "first_name": "...", "last_name": "...",
  "password": "...", "password2": "...",
  "phone": "", "college": "", "year": ""
}
Response: {
  "tokens": { "access": "...", "refresh": "..." },
  "user": { ... same shape as login user object ... }
}

### POST /api/v1/auth/token/refresh/
Request:  { "refresh": "<token>" }
Response: { "access": "<new_token>" }

### POST /api/v1/auth/logout/
Request:  { "refresh": "<token>" }   (blacklists the token)
Response: 200/204

### GET /api/v1/auth/me/
Headers:  Authorization: Bearer <token>
Response: same user object as login — used by admin guard on page load

### GET /api/v1/auth/profile/
Headers:  Authorization: Bearer <token>
Response: full user object (same shape as login user object)

### PATCH /api/v1/auth/profile/
Headers:  Authorization: Bearer <token>
Request:  { "first_name": "...", "last_name": "...", "phone": "...", "college": "...", "year": "...", "bio": "..." }
Response: updated user object

### PATCH /api/v1/auth/avatar/
Headers:  Authorization: Bearer <token>
Request:  multipart/form-data, field name: "avatar" (image file)
Response: { "avatar": "https://domain.com/media/avatars/1/photo.jpg" }

### DELETE /api/v1/auth/avatar/
Headers:  Authorization: Bearer <token>
Response: 204 No Content

### POST /api/v1/auth/change-password/
Headers:  Authorization: Bearer <token>
Request:  { "old_password": "...", "new_password": "..." }
Response: { "message": "Password changed successfully." }

---

## 2. PROJECTS ENDPOINTS

### GET /api/v1/projects/
Public — no auth required.
Response: array or { "results": [...], "count": N }
Each project object must include:
{
  "id": 1,
  "slug": "library-management-system",
  "title": "Library Management System",
  "short_description": "...",
  "description": "...",          ← long description
  "category": "web",
  "category_display": "Web Development",
  "level": "intermediate",
  "level_display": "Intermediate",
  "delivery_time": "1 week",
  "sale_price": "9999.00",
  "original_price": "15000.00",
  "badge": "popular",
  "badge_display": "Popular",
  "status": "active",
  "is_sold_out": false,
  "technologies": ["React", "Django", "PostgreSQL"],
  "key_features": ["Book Catalog", "Member Management"],
  "whats_included": ["Full Source Code", "Documentation (PDF)"],
  "demo_video_url": "",
  "thumbnail": null or "https://...",
  "media": [
    {
      "id": 1,
      "file_url": "https://...",   ← absolute URL
      "media_type": "image",
      "is_featured": true,
      "order": 0,
      "caption": "Dashboard Overview"
    }
  ],
  "project_links": [
    { "label": "Source Code", "url": "https://github.com/...", "type": "github" }
  ]
}

### GET /api/v1/projects/?slug=library-management-system
Filter by slug — returns array (may be empty if not found)

### GET /api/v1/projects/:id/
Returns single project by id.

---

## 3. ADMIN — PROJECTS

All admin endpoints require:  Authorization: Bearer <admin_token>
Admin = is_staff=True or is_superuser=True

### GET /api/v1/admin/projects/
Returns all projects (including drafts) as array or paginated response.

### POST /api/v1/admin/projects/
Creates a new project.
Request body fields (all snake_case):
{
  "title": "...",
  "short_description": "...",
  "description": "...",
  "category": "web",           ← choices: web, mobile, data_science, ai_ml, desktop, iot, other
  "level": "intermediate",     ← choices: beginner, intermediate, advanced, expert
  "delivery_time": "1 week",
  "sale_price": 9999,
  "original_price": 15000,
  "badge": "popular",          ← choices: popular, hot, new, trending, sale, featured, limited, "" (empty)
  "status": "active",          ← choices: active, draft
  "is_sold_out": false,
  "technologies": ["React", "Django"],
  "key_features": ["Feature 1"],
  "whats_included": ["Full Source Code"],
  "demo_video_url": ""
}
Response: created project object (same shape as GET /api/v1/projects/:id/)

### PATCH /api/v1/admin/projects/:id/
Updates a project — same fields as POST (partial update).

### DELETE /api/v1/admin/projects/:id/
Deletes a project. Response: 204

### POST /api/v1/admin/projects/:id/media/
Adds a media item to a project.
Accepts BOTH multipart (file upload) and JSON (URL-based):

  Multipart: fields = file (image/video), media_type ("image"/"video"), is_featured ("true"/"false"), order ("0")
  JSON:      { "url": "https://...", "media_type": "image", "is_featured": false, "order": 0 }

Response: { "id": 1, "file_url": "https://...", "media_type": "image", "is_featured": true, "order": 0, "caption": "" }

### DELETE /api/v1/admin/projects/:projectId/media/:mediaId/
Removes a media item. Response: 204

### PATCH /api/v1/admin/projects/:id/   (thumbnail upload)
Accepts multipart/form-data with field "thumbnail" (image file).
Saves as project thumbnail.
Response: updated project object with thumbnail URL.

---

## 4. ADMIN — ORDERS

### GET /api/v1/admin/orders/
Returns all orders. Response: array or { "results": [...] }
Each order object:
{
  "id": 1,
  "student": {                    ← nested user object
    "id": 5,
    "first_name": "Rahul",
    "last_name": "Sharma",
    "email": "rahul@example.com"
  },
  "customer_name": "Rahul Sharma",  ← denormalized flat field (makes frontend easier)
  "client_email": "rahul@example.com",  ← same
  "project": { "id": 1, "title": "Library Management System" },
  "project_title": "Library Management System",   ← denormalized
  "total_amount": "12499.00",
  "discount_amount": "2500.00",
  "final_amount": "9999.00",
  "coupon_code": "STUDENT20",
  "pay_method": "razorpay",   ← choices: razorpay, upi, whatsapp, bank, other
  "status": "pending",         ← choices: pending, confirmed, in_progress, delivered, completed, cancelled
  "notes": "Razorpay Payment ID: pay_xxx | Phone: 9876543210 | College: IIT Delhi",
  "created_at": "2026-06-04T10:30:00Z",
  "date": "2026-06-04"         ← shorthand date field (optional but helpful)
}

### PATCH /api/v1/admin/orders/:id/status/
Updates ONLY the status field.
Request:  { "status": "confirmed" }
Response: updated full order object (same shape as above)

### DELETE /api/v1/admin/orders/:id/
Deletes an order. Response: 204

---

## 5. ORDERS (STUDENT)

### POST /api/v1/orders/
Requires: Authorization: Bearer <student_token>
Creates an order for the logged-in student.
Request:
{
  "project": 1,                  ← project id (optional if not found)
  "total_amount": 12499,
  "final_amount": 9999,
  "discount_amount": 2500,
  "coupon_code": "STUDENT20",    ← omit if no coupon
  "notes": "Razorpay Payment ID: pay_xxx | Phone: 9876543210 | College: IIT Delhi"
}
Response: created order object

### GET /api/v1/orders/
Requires: Authorization: Bearer <student_token>
Returns orders for the CURRENT logged-in student only (not all orders).
Response: array or { "results": [...] }
Each order must include:
{
  "id": 1,
  "project_title": "Library Management System",
  "project_slug": "library-management-system",   ← for deep-linking
  "final_amount": "9999.00",
  "total_amount": "12499.00",
  "status": "pending",
  "pay_method": "razorpay",
  "created_at": "2026-06-04T10:30:00Z",
  "project_links": [...]          ← for download page (same as project.project_links)
}

---

## 6. ADMIN — COUPONS

### GET /api/v1/admin/coupons/
Requires admin token.
Response: array or { "results": [...] }
Each coupon:
{
  "id": 1,
  "code": "STUDENT20",
  "description": "20% off for all students",
  "discount_type": "percentage",    ← choices: percentage, fixed
  "discount_value": "20.00",
  "min_order_amount": "0.00",
  "max_uses": null,                 ← null = unlimited
  "used_count": 47,
  "is_active": true,
  "is_exhausted": false,
  "valid_from": "2026-01-01T00:00:00Z",
  "valid_until": "2028-12-31T23:59:59Z",
  "created_at": "2026-01-01T00:00:00Z"
}

### POST /api/v1/admin/coupons/
Creates a coupon. Same fields as above (minus id, used_count, is_exhausted, created_at).

### PATCH /api/v1/admin/coupons/:id/
Updates a coupon.

### DELETE /api/v1/admin/coupons/:id/
Deletes a coupon.

---

## 7. ADMIN — SETTINGS

### GET /api/v1/admin/settings/
Returns site settings as a flat JSON object.
Response:
{
  "site_name": "Webxter Student Projects",
  "tagline": "Professional projects for final year students",
  "email": "projects@webxter.in",
  "phone": "+91-8264796534",
  "whatsapp": "+91-8264796534",
  "coupon_code": "STUDENT20",
  "coupon_discount": 20,
  "maintenance_mode": false,
  "maintenance_message": "We'll be back shortly.",
  "show_marquee": true,
  "marquee_text": "20% OFF for Final Year Students!"
}

### PATCH /api/v1/admin/settings/
Updates settings. Partial update (PATCH).
Request: any subset of the settings fields above.
Response: updated full settings object.

IMPLEMENTATION NOTE: Settings can be stored as a single row in a Settings model
(singleton pattern) or as key-value pairs. Singleton is simpler:

  class SiteSettings(models.Model):
      site_name = models.CharField(max_length=200, default="Webxter")
      tagline = models.CharField(max_length=200, blank=True)
      email = models.EmailField(blank=True)
      phone = models.CharField(max_length=20, blank=True)
      whatsapp = models.CharField(max_length=20, blank=True)
      maintenance_mode = models.BooleanField(default=False)
      maintenance_message = models.TextField(blank=True)
      show_marquee = models.BooleanField(default=True)
      marquee_text = models.CharField(max_length=500, blank=True)

  Only ever one row — use get_or_create(pk=1).

---

## 8. ADMIN — DASHBOARD

### GET /api/v1/admin/dashboard/?range=1M
Query param range: 1W | 1M | 3M | 6M | 1Y
Response:
{
  "total_revenue": 36997.00,         ← SUM of final_amount WHERE status IN (delivered, completed)
  "total_orders": 5,                 ← all orders in range
  "completed_orders": 3,             ← paid orders in range
  "pending_orders": 1,
  "cancelled_orders": 0,
  "active_projects": 8,
  "revenue_series": [                ← time buckets for the bar chart
    { "label": "W1", "revenue": 9999.0 },
    { "label": "W2", "revenue": 0.0 },
    { "label": "W3", "revenue": 14999.0 },
    { "label": "W4", "revenue": 11999.0 }
  ],
  "top_projects": [
    { "name": "Hospital Management System", "count": 1, "revenue": 14999.0 }
  ],
  "pay_breakdown": {
    "razorpay": 3, "upi": 0, "whatsapp": 0, "bank": 0, "other": 0
  }
}

Full implementation code is in: backend/ANALYTICS_SETUP.md

---

## 9. IMPORTANT MODEL REQUIREMENTS

### Order model MUST have these fields:
- student (FK to User, nullable)
- project (FK to Project, nullable)
- total_amount (DecimalField)
- final_amount (DecimalField)   ← post-coupon price — this is used for revenue
- discount_amount (DecimalField)
- coupon_code (CharField, blank=True)
- pay_method (CharField, choices: razorpay/upi/whatsapp/bank/other)
- status (CharField, choices: pending/confirmed/in_progress/delivered/completed/cancelled)
- notes (TextField, blank=True)
- created_at (auto)
- updated_at (auto)

### Order serializer MUST include these denormalized fields:
- customer_name  (= student.get_full_name() or first_name + last_name)
- client_email   (= student.email)
- project_title  (= project.title)
- project_slug   (= project.slug)

### User model MUST have:
- phone, college, year, bio  (CharField/TextField, blank=True)
- avatar (ImageField, null=True, blank=True)
- is_staff and is_superuser (already on AbstractUser)

---

## 10. CORS SETTINGS

Allow the React dev server (localhost:5173) in development:

  CORS_ALLOWED_ORIGINS = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://your-production-domain.com",   # add when deploying
  ]

Do NOT use CORS_ALLOW_ALL_ORIGINS = True in production.

---

## 11. REQUIRED URL PATTERNS

All under /api/v1/:

  auth/login/                          POST
  auth/register/                       POST
  auth/logout/                         POST
  auth/token/refresh/                  POST
  auth/me/                             GET
  auth/profile/                        GET, PATCH
  auth/avatar/                         PATCH, DELETE
  auth/change-password/                POST

  projects/                            GET (public)
  projects/<id>/                       GET (public)

  orders/                              GET, POST (student auth)

  admin/projects/                      GET, POST
  admin/projects/<id>/                 PATCH, DELETE
  admin/projects/<id>/media/           POST
  admin/projects/<id>/media/<mid>/     DELETE
  admin/orders/                        GET
  admin/orders/<id>/status/            PATCH
  admin/orders/<id>/                   DELETE
  admin/coupons/                       GET, POST
  admin/coupons/<id>/                  PATCH, DELETE
  admin/settings/                      GET, PATCH
  admin/dashboard/                     GET

---

## 12. THINGS TO DOUBLE-CHECK

1. The /api/v1/orders/ GET endpoint returns ONLY the current student's orders,
   not all orders. Filter by: Order.objects.filter(student=request.user)

2. The /api/v1/admin/orders/ GET returns ALL orders (admin only).

3. Revenue is calculated from final_amount only (NOT total_amount).
   final_amount = price after coupon discount.
   Revenue counts only status IN ('delivered', 'completed') — NOT pending.

4. When an order is created via POST /api/v1/orders/, the backend should
   auto-set final_amount = total_amount - discount_amount if not provided.

5. The login endpoint is shared between students and admins (same endpoint).
   The frontend checks the user.is_staff / user.is_superuser flag to decide
   whether to allow admin panel access.

6. JWT token expiry: set ACCESS_TOKEN_LIFETIME to at least 1 day for good UX.
   REFRESH_TOKEN_LIFETIME: 30 days recommended.

   SIMPLE_JWT = {
       "ACCESS_TOKEN_LIFETIME":  timedelta(days=1),
       "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
       "ROTATE_REFRESH_TOKENS":  True,
       "BLACKLIST_AFTER_ROTATION": True,
   }

7. For the seed script (scripts/seed.mjs) to work, the admin user needs
   is_staff=True or is_superuser=True. Create one with:
   python manage.py createsuperuser

8. Add 'rest_framework_simplejwt.token_blacklist' to INSTALLED_APPS for
   token blacklisting on logout to work.

---

That's everything the frontend needs from the backend.
Start by verifying existing endpoints match the shapes above,
then implement any that are missing.
