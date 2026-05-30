// ─── JWT API layer ────────────────────────────────────────────────────────────
// Talks to the Django REST Framework backend at VITE_API_URL.
// Endpoints follow the README: /api/v1/auth/...

const BASE = import.meta.env.VITE_API_URL;

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getAccessToken()  { return localStorage.getItem("wx_access");  }
export function getRefreshToken() { return localStorage.getItem("wx_refresh"); }
export function getStoredUser()   {
  try { return JSON.parse(localStorage.getItem("wx_user") || "null"); }
  catch { return null; }
}

/**
 * Persist user object to wx_user and fire a storage event so all listeners
 * (CartProvider, StudentLayout avatar) update immediately in the same tab.
 */
export function updateStoredUser(patch) {
  const current = getStoredUser() || {};
  const updated = { ...current, ...patch };
  const prev = localStorage.getItem("wx_user");
  localStorage.setItem("wx_user", JSON.stringify(updated));
  // Same-tab listeners (StorageEvent only fires for OTHER tabs normally)
  try {
    window.dispatchEvent(new StorageEvent("storage", {
      key: "wx_user",
      oldValue: prev,
      newValue: JSON.stringify(updated),
    }));
  } catch {}
  // Also fire a dedicated avatar event so StudentLayout can react
  window.dispatchEvent(new CustomEvent("wx-avatar-updated"));
  return updated;
}

function storeTokens({ access, refresh, user }) {
  localStorage.setItem("wx_access", access);
  if (refresh) localStorage.setItem("wx_refresh", refresh);
  if (user) {
    const prev = localStorage.getItem("wx_user");
    localStorage.setItem("wx_user", JSON.stringify(user));
    // Notify CartProvider (same tab) that user identity changed
    try {
      window.dispatchEvent(new StorageEvent("storage", {
        key: "wx_user",
        oldValue: prev,
        newValue: JSON.stringify(user),
      }));
    } catch {}
  }
}

export function clearTokens() {
  localStorage.removeItem("wx_access");
  localStorage.removeItem("wx_refresh");
  // Dispatch a storage event so CartProvider in the same tab reloads the cart
  // for the new user identity (or guest) immediately.
  try {
    const prev = localStorage.getItem("wx_user");
    localStorage.removeItem("wx_user");
    // Manually fire the event for same-tab listeners
    window.dispatchEvent(new StorageEvent("storage", { key: "wx_user", oldValue: prev, newValue: null }));
  } catch {
    localStorage.removeItem("wx_user");
  }
}

export function isLoggedIn() {
  return !!getAccessToken();
}

// ─── Token refresh ────────────────────────────────────────────────────────────
let refreshPromise = null; // deduplicate concurrent refresh calls

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error("No refresh token");

    const res = await fetch(`${BASE}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearTokens();
      throw new Error("Session expired. Please log in again.");
    }

    const data = await res.json();
    localStorage.setItem("wx_access", data.access);
    return data.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// ─── Authenticated fetch (auto-refreshes on 401) ──────────────────────────────
export async function authFetch(url, options = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(url, { ...options, headers });

  // Try to refresh once on 401
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      res = await fetch(url, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    } catch {
      clearTokens();
      window.location.href = "/student/login";
      throw new Error("Session expired");
    }
  }

  return res;
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

/**
 * Register a new student account.
 * POST /api/v1/auth/register/
 */
export async function studentRegisterApi({ name, email, password, phone, college, year }) {
  // Split name into first/last for the backend
  const parts = name.trim().split(" ");
  const first_name = parts[0] || "";
  const last_name  = parts.slice(1).join(" ") || "";

  const res = await fetch(`${BASE}/api/v1/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email:      email.trim().toLowerCase(),
      first_name,
      last_name,
      password,
      password2:  password,
      // Extra profile fields — backend ignores them if not in serializer
      phone:   phone   || "",
      college: college || "",
      year:    year    || "",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    // DRF returns field-level errors as objects
    const msg = extractError(data);
    throw new Error(msg);
  }

  // Backend returns access + refresh + user on register
  storeTokens({
     access:  data.tokens.access,
  refresh: data.tokens.refresh,
    user:    data.user,
  });

  return data;
}

/**
 * Log in with email + password.
 * POST /api/v1/auth/login/
 */
export async function studentLoginApi(email, password) {
  const res = await fetch(`${BASE}/api/v1/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Server error. Please try again later.");
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractError(data));
  }

  storeTokens({
    access:  data.access,
    refresh: data.refresh,
    user:    data.user,
  });

  return data;
}

/**
 * Log out — blacklists the refresh token on the server.
 * POST /api/v1/auth/logout/
 */
export async function studentLogoutApi() {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await authFetch(`${BASE}/api/v1/auth/logout/`, {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Ignore network errors on logout — clear locally regardless
    }
  }
  clearTokens();
}

/**
 * Get the current user's profile.
 * GET /api/v1/auth/profile/
 * Also syncs the returned data (including avatar URL) into wx_user cache.
 */
export async function getProfileApi() {
  const res = await authFetch(`${BASE}/api/v1/auth/profile/`);
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new Error("Failed to load profile");
  }
  const data = await res.json();
  // Keep wx_user in sync so avatar persists after page refresh
  updateStoredUser(data);
  return data;
}

/**
 * Update the current user's profile.
 * PATCH /api/v1/auth/profile/
 */
export async function updateProfileApi(fields) {
  const res = await authFetch(`${BASE}/api/v1/auth/profile/`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Server error (${res.status}) while saving profile.`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(extractError(data));

  // Keep cached user in sync (preserve existing avatar)
  updateStoredUser(data);

  return data;
}

/**
 * Upload a profile avatar image.
 * PATCH /api/v1/auth/avatar/   (multipart/form-data, field name: "avatar")
 *
 * The backend should return the updated user object (or at minimum { avatar: "<url>" }).
 * The avatar URL is saved into wx_user so it persists across logins.
 */
export async function uploadAvatarApi(file) {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("avatar", file);

  // Do NOT set Content-Type — browser sets it automatically with the correct boundary
  let res = await fetch(`${BASE}/api/v1/auth/avatar/`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  // Retry once after token refresh on 401
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      res = await fetch(`${BASE}/api/v1/auth/avatar/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${newToken}` },
        body: formData,
      });
    } catch {
      clearTokens();
      window.location.href = "/student/login";
      throw new Error("Session expired");
    }
  }

  // Guard: if the response is HTML (endpoint missing / server error), give a clear message
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (res.status === 404) throw new Error("Avatar endpoint not found on server (404). Ask your backend team to add PATCH /api/v1/auth/avatar/");
    if (res.status === 405) throw new Error("Avatar endpoint exists but doesn't allow PATCH. Check backend URL config.");
    if (res.status >= 500) throw new Error("Server error while uploading avatar. Please try again later.");
    throw new Error(`Unexpected server response (${res.status}). Avatar upload failed.`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(extractError(data));

  // Persist the returned avatar URL (and any other updated fields) into wx_user
  updateStoredUser(data);

  return data;
}

/**
 * Remove the profile avatar.
 * Sends PATCH /api/v1/auth/avatar/ with avatar=null
 * (uses the same endpoint as upload — no separate DELETE needed)
 */
export async function removeAvatarApi() {
  const token = getAccessToken();

  // Send a multipart form with an empty avatar field to clear it
  const formData = new FormData();
  formData.append("avatar", "");          // empty string signals "remove"

  let res = await fetch(`${BASE}/api/v1/auth/avatar/`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  // Retry once on 401
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      res = await fetch(`${BASE}/api/v1/auth/avatar/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${newToken}` },
        body: formData,
      });
    } catch {
      clearTokens();
      window.location.href = "/student/login";
      throw new Error("Session expired");
    }
  }

  // 204 No Content or 200 — both are success
  if (res.status === 204 || res.status === 200) {
    updateStoredUser({ avatar: null });
    return;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Server error (${res.status}) while removing avatar.`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(extractError(data));
  updateStoredUser({ avatar: null });
}

/**
 * Change password.
 * POST /api/v1/auth/change-password/
 */
export async function changePasswordApi(oldPassword, newPassword) {
  const res = await authFetch(`${BASE}/api/v1/auth/change-password/`, {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractError(data));
  return data;
}

// ─── Orders endpoints ─────────────────────────────────────────────────────────

/**
 * List the current student's orders.
 * GET /api/v1/orders/
 * Handles both plain array and DRF paginated { count, results: [] } responses.
 */
export async function getOrdersApi() {
  const res = await authFetch(`${BASE}/api/v1/orders/`);
  if (!res.ok) throw new Error("Failed to load orders");
  const data = await res.json();
  // DRF pagination returns { count, next, previous, results: [] }
  return Array.isArray(data) ? data : (data.results || []);
}

// ─── Projects endpoints ───────────────────────────────────────────────────────

/**
 * List all available projects — public endpoint, no auth required.
 * GET /api/v1/projects/
 * Normalises snake_case → camelCase so the card components work correctly.
 */
export async function getProjectsApi() {
  try {
    const res = await fetch(`${BASE}/api/v1/projects/`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results || []);
    return list.map(normaliseProject);
  } catch (err) {
    throw new Error("Failed to load projects: " + (err.message || "Network error"));
  }
}

/** Resolve a relative backend URL to absolute */
function resolveMediaUrl(url) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Normalise a project object from the backend (snake_case) to camelCase */
function normaliseProject(p) {
  const price         = parseFloat(p.sale_price      ?? p.price         ?? 0) || 0;
  const originalPrice = parseFloat(p.original_price  ?? p.originalPrice ?? 0) || 0;

  // Normalise media items — backend returns { id, file_url, url, is_featured, order, media_type }
  const rawMedia = Array.isArray(p.media) ? p.media : [];
  const normMedia = rawMedia
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((m) => ({
      ...m,
      type:     m.media_type === "video" ? "video" : "image",
      url:      resolveMediaUrl(m.file_url || m.url || ""),
      caption:  m.caption || "",
      featured: m.is_featured ?? false,
    }));

  // Use featured image as thumbnail fallback
  const featuredMedia = normMedia.find((m) => m.featured) || normMedia[0];
  const thumbnail = resolveMediaUrl(p.thumbnail || p.thumbnail_url || featuredMedia?.url || "");

  return {
    ...p,
    id:            p.id,
    slug:          p.slug || String(p.id),
    title:         p.title         || "",
    description:   p.short_description || p.description || "",
    longDesc:      p.description   || p.long_desc      || "",
    category:      p.category_display || p.category    || "",
    level:         p.level_display    || p.level        || "",
    delivery:      p.delivery_time    || p.delivery     || "",
    badge:         p.badge_display !== "None" ? (p.badge_display || p.badge || "") : "",
    price,
    originalPrice,
    sale_price:     price,
    original_price: originalPrice,
    active:         p.status === "active" || p.active === true,
    soldOut:        p.is_sold_out ?? p.soldOut ?? false,
    tags:           Array.isArray(p.technologies)   ? p.technologies   : (Array.isArray(p.tags)     ? p.tags     : []),
    features:       Array.isArray(p.key_features)   ? p.key_features   : (Array.isArray(p.features) ? p.features : []),
    includes:       Array.isArray(p.whats_included) ? p.whats_included : (Array.isArray(p.includes) ? p.includes : []),
    screenshots:    normMedia.filter((m) => m.type === "image").map((m) => m.url),
    media:          normMedia,
    projectFiles:   Array.isArray(p.project_links)  ? p.project_links  : (Array.isArray(p.projectFiles) ? p.projectFiles : []),
    demoVideo:      p.demo_video_url || p.demoVideo || "",
    thumbnail,
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Extract a human-readable error message from a DRF error response.
 * Strips raw field names and returns clean, user-facing messages.
 */
function extractError(data) {
  if (!data || typeof data !== "object") return "Something went wrong. Please try again.";

  // Unwrap and stringify whatever DRF sends
  const unwrap = (raw) => {
    if (Array.isArray(raw)) return String(raw[0] ?? "");
    if (raw && typeof raw === "object") return String(Object.values(raw)[0] ?? "");
    return String(raw ?? "");
  };

  // Pick the raw message from the response
  // let raw = "";
  // if (data.detail)                    raw = unwrap(data.detail);
  // else if (data.non_field_errors)     raw = unwrap(data.non_field_errors);
  // else if (data.email)                raw = unwrap(data.email);
  // else if (data.password)             raw = unwrap(data.password);
  // else if (data.password2)            raw = unwrap(data.password2);
  // else {
  //   const first = Object.keys(data)[0];
  //   if (first) raw = unwrap(data[first]);
  // }
let raw = "";

if (data.message)                   raw = unwrap(data.message);
else if (data.detail)               raw = unwrap(data.detail);
else if (data.non_field_errors)     raw = unwrap(data.non_field_errors);
else if (data.email)                raw = unwrap(data.email);
else if (data.password)             raw = unwrap(data.password);
else if (data.password2)            raw = unwrap(data.password2);
else {
  const first = Object.keys(data)[0];
  if (first) raw = unwrap(data[first]);
}
  const s = raw.toLowerCase();

  // ── Login errors ──────────────────────────────────────────────────────────
  if (s.includes("no active account") || s.includes("unable to log in") || s.includes("invalid credentials"))
    return "Invalid Email or Password";

  // ── Registration errors ───────────────────────────────────────────────────
  if (s.includes("already exists") || s.includes("unique"))
    return "This email is already registered. Please sign in instead.";

  if (s.includes("too short") || s.includes("at least 8"))
    return "Password is too short. Use at least 8 characters.";

  if (s.includes("too common"))
    return "This password is too common. Please choose a stronger one.";

  if (s.includes("entirely numeric"))
    return "Password can't be all numbers. Add letters or symbols.";

  if (s.includes("too similar"))
    return "Password is too similar to your email. Please choose a different one.";

  if (s.includes("enter a valid email") || s.includes("valid email address"))
    return "Please enter a valid email address.";

  if (s.includes("may not be blank") || s.includes("this field is required") || s.includes("required field"))
    return "Please fill in all required fields.";

  if (s.includes("passwords") && s.includes("match"))
    return "Passwords do not match. Please try again.";

  // ── Network / server errors ───────────────────────────────────────────────
  if (s.includes("network") || s.includes("failed to fetch") || s.includes("connection"))
    return "Unable to connect. Please check your internet and try again.";

  if (s.includes("token") && (s.includes("invalid") || s.includes("expired")))
    return "Your session has expired. Please sign in again.";

  // ── Fallback — strip DRF "fieldname: " prefix and return as-is ───────────
  const cleaned = raw.replace(/^[\w\s]+:\s*/i, "").trim();
  return cleaned || "Something went wrong. Please try again.";
}
