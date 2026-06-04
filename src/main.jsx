import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// ─── Coupon cache bootstrap ───────────────────────────────────────────────────
// Seed the coupon list into localStorage on every page load so students can
// validate coupons at checkout even without an admin token.
// This list is refreshed in the background from the backend when possible.

const SEED_COUPONS = [{"id":12,"code":"STUDENT20","description":"20% student","discount_type":"percentage","discount_value":"20.00","min_order_amount":"0.00","max_uses":null,"used_count":0,"is_active":true,"is_exhausted":false,"valid_from":"2026-06-01T13:11:46.735079+05:30","valid_until":"2028-12-31T13:11:46.735079+05:30"},{"id":11,"code":"WELCOME20","description":"20% welcome","discount_type":"percentage","discount_value":"20.00","min_order_amount":"0.00","max_uses":null,"used_count":0,"is_active":true,"is_exhausted":false,"valid_from":"2026-06-01T13:11:46.735079+05:30","valid_until":"2028-12-31T13:11:46.735079+05:30"},{"id":10,"code":"LAUNCH10","description":"10% launch","discount_type":"percentage","discount_value":"10.00","min_order_amount":"0.00","max_uses":null,"used_count":0,"is_active":true,"is_exhausted":false,"valid_from":"2026-06-01T13:11:46.735079+05:30","valid_until":"2028-12-31T13:11:46.735079+05:30"},{"id":9,"code":"FLAT500","description":"Flat 500 off","discount_type":"fixed","discount_value":"500.00","min_order_amount":"0.00","max_uses":null,"used_count":0,"is_active":true,"is_exhausted":false,"valid_from":"2026-06-01T13:11:46.735079+05:30","valid_until":"2028-12-31T13:11:46.735079+05:30"},{"id":8,"code":"WEBXTERS","description":"summer campaign sale","discount_type":"percentage","discount_value":"50.00","min_order_amount":"0.00","max_uses":null,"used_count":0,"is_active":true,"is_exhausted":false,"valid_from":"2026-06-01T13:11:46.735079+05:30","valid_until":"2028-12-31T13:11:46.735079+05:30"},{"id":7,"code":"SAVE20","description":"20 percent off","discount_type":"percentage","discount_value":"20.00","min_order_amount":"0.00","max_uses":null,"used_count":0,"is_active":true,"is_exhausted":false,"valid_from":"2026-06-01T13:11:46.735079+05:30","valid_until":"2028-12-31T13:11:46.735079+05:30"},{"id":6,"code":"SAMMY","description":"SUMMER SALE","discount_type":"percentage","discount_value":"10.00","min_order_amount":"0.00","max_uses":null,"used_count":0,"is_active":true,"is_exhausted":false,"valid_from":"2026-06-01T13:11:46.735079+05:30","valid_until":"2028-06-01T13:11:46.735079+05:30"}];

// Only seed if cache is empty or stale (older than 1 hour)
(function seedCouponCache() {
  try {
    const existing = localStorage.getItem("wx_cached_coupons");
    const ts       = localStorage.getItem("wx_cached_coupons_ts");
    const stale    = !ts || Date.now() - Number(ts) > 60 * 60 * 1000;
    if (!existing || stale) {
      localStorage.setItem("wx_cached_coupons", JSON.stringify(SEED_COUPONS));
      localStorage.setItem("wx_cached_coupons_ts", String(Date.now()));
    }
  } catch {}
})();

// Refresh coupon cache from backend in the background
// Works for both logged-in admins (full list) and guests (public endpoint fallback)
(function refreshCouponCache() {
  const BASE  = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const token = localStorage.getItem("wx_admin_access");

  // Try admin endpoint first (full list), fall back to public endpoint
  const url     = token
    ? `${BASE}/api/v1/admin/coupons/`
    : `${BASE}/api/v1/coupons/`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  fetch(url, { headers })
    .then((r) => r.ok ? r.json() : null)
    .then((data) => {
      if (!data) return;
      const list = Array.isArray(data) ? data : (data.results || []);
      if (list.length > 0) {
        localStorage.setItem("wx_cached_coupons", JSON.stringify(list));
        localStorage.setItem("wx_cached_coupons_ts", String(Date.now()));
      }
    })
    .catch(() => {});
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
