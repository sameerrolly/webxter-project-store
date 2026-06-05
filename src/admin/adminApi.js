// ─── Admin API layer (Axios + JWT) ────────────────────────────────────────────
// All admin API calls go through this file.
// Base URL: VITE_API_URL (e.g. http://127.0.0.1:8000)
// Endpoints: /api/v1/admin/...

import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ─── Token storage ────────────────────────────────────────────────────────────
const KEYS = {
  ACCESS:  "wx_admin_access",
  REFRESH: "wx_admin_refresh",
  USER:    "wx_admin_user",
};

export function getAdminToken()   { return localStorage.getItem(KEYS.ACCESS);  }
export function getAdminRefresh() { return localStorage.getItem(KEYS.REFRESH); }
export function getAdminUser()    {
  try { return JSON.parse(localStorage.getItem(KEYS.USER) || "null"); }
  catch { return null; }
}

function storeAdminTokens({ access, refresh, user }) {
  if (access)  localStorage.setItem(KEYS.ACCESS,  access);
  if (refresh) localStorage.setItem(KEYS.REFRESH, refresh);
  if (user)    localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function clearAdminTokens() {
  localStorage.removeItem(KEYS.ACCESS);
  localStorage.removeItem(KEYS.REFRESH);
  localStorage.removeItem(KEYS.USER);
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios
          .post(`${BASE}/api/v1/auth/token/refresh/`, { refresh: getAdminRefresh() })
          .then((r) => {
            localStorage.setItem(KEYS.ACCESS, r.data.access);
            return r.data.access;
          })
          .catch(() => {
            clearAdminTokens();
            window.location.href = "/admin/login";
            return Promise.reject(new Error("Session expired"));
          })
          .finally(() => { refreshing = null; });
      }
      try {
        const newToken = await refreshing;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

// ─── Error extractor ─────────────────────────────────────────────────────────
export function extractApiError(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Something went wrong.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  if (data.non_field_errors) return String(data.non_field_errors[0] ?? "");
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return String(first[0]);
  return String(first ?? "Something went wrong.");
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/login/   ← same endpoint used by students
 * Body: { email, password }
 * Returns: { access, refresh, user: { id, email, is_staff, is_superuser, ... } }
 *
 * After login we check is_staff || is_superuser.
 * If neither is true we reject with a clear error — no token is stored.
 */
export async function adminApiLogin(username, password) {
  // Django's login endpoint accepts email; username IS the email for superusers
  const res = await axios.post(`${BASE}/api/v1/auth/login/`, {
    email:    username.trim().toLowerCase(),
    password,
  });

  const data = res.data;
  const user = data.user || {};

  // Block non-staff / non-superuser accounts
  if (!user.is_staff && !user.is_superuser) {
    throw new Error("You are not authorized to access admin dashboard");
  }

  storeAdminTokens({
    access:  data.access,
    refresh: data.refresh,
    user,
  });

  return data;
}

/**
 * GET /api/v1/auth/me/
 * Verifies the stored token is still valid and refreshes the cached user object.
 * Called on page load to restore admin session after refresh.
 */
export async function fetchAdminMe() {
  const res = await api.get("/auth/me/");
  const user = res.data;
  if (!user.is_staff && !user.is_superuser) {
    clearAdminTokens();
    throw new Error("Not an admin account");
  }
  // Keep stored user in sync
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  return user;
}

/**
 * POST /api/v1/auth/logout/
 */
export async function adminApiLogout() {
  const refresh = getAdminRefresh();
  if (refresh) {
    try { await api.post("/auth/logout/", { refresh }); } catch { /* ignore */ }
  }
  clearAdminTokens();
}

/**
 * True only when a token exists AND the stored user is staff/superuser.
 */
export function isAdminApiLoggedIn() {
  if (!getAdminToken()) return false;
  const user = getAdminUser();
  return !!(user?.is_staff || user?.is_superuser);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard/?range=1W|1M|3M|6M|1Y
 * Returns: { total_revenue, total_orders, completed_orders, pending_orders,
 *            cancelled_orders, active_projects, conversion_rate,
 *            revenue_series: [{label, revenue, orders}],
 *            top_projects: [{name, count, revenue}],
 *            pay_breakdown: {razorpay, upi, whatsapp, bank, other} }
 */
export async function fetchAdminDashboard(range = "1M") {
  const res = await api.get("/admin/dashboard/", { params: { range } });
  return res.data;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/orders/
 * Returns: array or { results: [] }
 */
export async function fetchAdminOrders(params = {}) {
  const res = await api.get("/admin/orders/", { params });
  return Array.isArray(res.data) ? res.data : (res.data.results || []);
}

/**
 * Update order status.
 * PATCH /api/v1/admin/orders/:id/status/   ← dedicated status endpoint
 * Body: { status }
 */
export async function updateAdminOrderStatus(id, status) {
  const res = await api.patch(`/admin/orders/${id}/status/`, { status });
  return res.data;
}

/**
 * DELETE /api/v1/admin/orders/:id/
 */
export async function deleteAdminOrder(id) {
  await api.delete(`/admin/orders/${id}/`);
}

// ─── Backend choice maps ──────────────────────────────────────────────────────
// Maps display names (used in the form) → backend codes
const CATEGORY_MAP = {
  "Web Development": "web",
  "Mobile":          "mobile",
  "Data Science":    "data_science",
  "AI/ML":           "ai_ml",
  "Desktop":         "desktop",
  "IoT":             "iot",
  "Other":           "other",
  // pass-through if already a code
  "web": "web", "mobile": "mobile", "data_science": "data_science",
  "ai_ml": "ai_ml", "desktop": "desktop", "iot": "iot", "other": "other",
};

const LEVEL_MAP = {
  "Beginner":     "beginner",
  "Intermediate": "intermediate",
  "Advanced":     "advanced",
  "Expert":       "expert",
  "beginner": "beginner", "intermediate": "intermediate",
  "advanced": "advanced", "expert": "expert",
};

const BADGE_MAP = {
  "":        "",
  "None":    "",
  "Popular": "popular",
  "Hot":     "hot",
  "New":     "new",
  "popular": "popular", "hot": "hot", "new": "new",
};

// ─── Projects ─────────────────────────────────────────────────────────────────

/**
 * Maps the camelCase form object to the exact snake_case field names
 * the Django backend serializer expects, including choice code mapping.
 */
function toSnakeCase(p) {
  const payload = {};

  if (p.title         != null) payload.title             = p.title;
  if (p.description   != null) payload.short_description = p.description;
  if (p.longDesc      != null) payload.description       = p.longDesc;
  if (p.long_desc     != null) payload.description       = p.long_desc;

  // Map display names → backend codes
  if (p.category      != null) payload.category          = CATEGORY_MAP[p.category]      ?? p.category;
  if (p.level         != null) payload.level             = LEVEL_MAP[p.level]            ?? p.level;
  if (p.badge         != null) payload.badge             = BADGE_MAP[p.badge]            ?? p.badge ?? "";

  if (p.delivery      != null) payload.delivery_time     = p.delivery;
  if (p.delivery_time != null) payload.delivery_time     = p.delivery_time;

  // Price fields
  if (p.price         != null) payload.sale_price        = Number(p.price)         || null;
  if (p.sale_price    != null) payload.sale_price        = Number(p.sale_price)    || null;
  if (p.originalPrice != null) payload.original_price    = Number(p.originalPrice) || null;
  if (p.original_price!= null) payload.original_price    = Number(p.original_price)|| null;

  // Active → status
  if (p.active != null) payload.status = p.active ? "active" : "draft";
  if (p.status != null) payload.status = p.status;

  if (p.soldOut       != null) payload.is_sold_out       = p.soldOut;
  if (p.sold_out      != null) payload.is_sold_out       = p.sold_out;

  // Array fields
  if (p.tags          != null) payload.technologies      = p.tags;
  if (p.technologies  != null) payload.technologies      = p.technologies;
  if (p.features      != null) payload.key_features      = p.features;
  if (p.key_features  != null) payload.key_features      = p.key_features;
  if (p.includes      != null) payload.whats_included    = p.includes;
  if (p.whats_included!= null) payload.whats_included    = p.whats_included;
  if (p.screenshots   != null) payload.screenshots       = p.screenshots;
  if (p.media         != null) payload.media             = p.media;
  if (p.projectFiles  != null) payload.project_links     = p.projectFiles;
  if (p.project_files != null) payload.project_links     = p.project_files;
  if (p.project_links != null) payload.project_links     = p.project_links;
  if (p.demoVideo     != null) payload.demo_video_url    = p.demoVideo;
  if (p.demo_video    != null) payload.demo_video_url    = p.demo_video;

  return payload;
}

/**
 * GET /api/v1/admin/projects/
 */
export async function fetchAdminProjects(params = {}) {
  const res = await api.get("/admin/projects/", { params });
  return Array.isArray(res.data) ? res.data : (res.data.results || []);
}

/**
 * POST /api/v1/admin/projects/
 * Maps camelCase form fields → snake_case for Django
 */
export async function createAdminProject(data) {
  const payload = toSnakeCase(data);
  const res = await api.post("/admin/projects/", payload);
  return res.data;
}

/**
 * PATCH /api/v1/admin/projects/:id/
 * Maps camelCase form fields → snake_case for Django
 */
export async function updateAdminProject(id, data) {
  const payload = toSnakeCase(data);
  const res = await api.patch(`/admin/projects/${id}/`, payload);
  return res.data;
}

/**
 * Upload a thumbnail image for a project.
 * PATCH /api/v1/admin/projects/:id/  with multipart/form-data
 * field name: "thumbnail"
 */
export async function uploadProjectThumbnail(id, file) {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("thumbnail", file);

  let res = await fetch(`${BASE}/api/v1/admin/projects/${id}/`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    const newToken = await (async () => {
      const r = await axios.post(`${BASE}/api/v1/auth/token/refresh/`, { refresh: getAdminRefresh() });
      localStorage.setItem(KEYS.ACCESS, r.data.access);
      return r.data.access;
    })();
    res = await fetch(`${BASE}/api/v1/admin/projects/${id}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${newToken}` },
      body: formData,
    });
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Server error (${res.status}) uploading image.`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(extractApiError({ response: { data } }));
  return data;
}

/**
 * Upload a media item (image/video file) to a project's media gallery.
 * POST /api/v1/admin/projects/:id/media/  (multipart/form-data)
 * Fields: file, media_type, is_featured, order
 */
export async function uploadProjectMedia(projectId, file, { isFeatured = false, order = 0 } = {}) {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("media_type", file.type.startsWith("video/") ? "video" : "image");
  formData.append("is_featured", isFeatured ? "true" : "false");
  formData.append("order", String(order));

  let res = await fetch(`${BASE}/api/v1/admin/projects/${projectId}/media/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    const newToken = await (async () => {
      const r = await axios.post(`${BASE}/api/v1/auth/token/refresh/`, { refresh: getAdminRefresh() });
      localStorage.setItem(KEYS.ACCESS, r.data.access);
      return r.data.access;
    })();
    res = await fetch(`${BASE}/api/v1/admin/projects/${projectId}/media/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${newToken}` },
      body: formData,
    });
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Server error (${res.status}) uploading media.`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(extractApiError({ response: { data } }));
  return data;
}

/**
 * Add a URL-based media item to a project's media gallery.
 * POST /api/v1/admin/projects/:id/media/  (JSON)
 * Fields: url, media_type, is_featured, order
 */
export async function addProjectMediaUrl(projectId, { url, mediaType = "url", isFeatured = false, order = 0 }) {
  const res = await api.post(`/admin/projects/${projectId}/media/`, {
    url,
    media_type: mediaType,
    is_featured: isFeatured,
    order,
  });
  return res.data;
}

/**
 * Update an existing media item's order and featured status.
 * PATCH /api/v1/admin/projects/:projectId/media/:mediaId/
 */
export async function updateProjectMedia(projectId, mediaId, { isFeatured = false, order = 0, caption = "" }) {
  const res = await api.patch(`/admin/projects/${projectId}/media/${mediaId}/`, {
    is_featured: isFeatured,
    order,
    ...(caption ? { caption } : {}),
  });
  return res.data;
}

/**
 * Delete a media item from a project's gallery.
 * DELETE /api/v1/admin/projects/:projectId/media/:mediaId/
 */
export async function deleteProjectMedia(projectId, mediaId) {
  await api.delete(`/admin/projects/${projectId}/media/${mediaId}/`);
}

/**
 * DELETE /api/v1/admin/projects/:id/
 */
export async function deleteAdminProject(id) {
  await api.delete(`/admin/projects/${id}/`);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/settings/
 */
export async function fetchAdminSettings() {
  const res = await api.get("/admin/settings/");
  return res.data;
}

/**
 * PATCH /api/v1/admin/settings/
 */
export async function saveAdminSettings(data) {
  const res = await api.patch("/admin/settings/", data);
  return res.data;
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/coupons/
 * Also caches the list in localStorage so students can validate coupons at checkout.
 */
export async function fetchAdminCoupons() {
  const res = await api.get("/admin/coupons/");
  const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
  // Cache for student checkout coupon validation
  try { localStorage.setItem("wx_cached_coupons", JSON.stringify(list)); } catch {}
  return list;
}

/**
 * POST /api/v1/admin/coupons/
 */
export async function createAdminCoupon(data) {
  const res = await api.post("/admin/coupons/", data);
  return res.data;
}

/**
 * PATCH /api/v1/admin/coupons/:id/
 */
export async function updateAdminCoupon(id, data) {
  const res = await api.patch(`/admin/coupons/${id}/`, data);
  return res.data;
}

/**
 * DELETE /api/v1/admin/coupons/:id/
 */
export async function deleteAdminCoupon(id) {
  await api.delete(`/admin/coupons/${id}/`);
}

export default api;
