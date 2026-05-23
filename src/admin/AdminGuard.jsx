import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminApiLoggedIn, fetchAdminMe, clearAdminTokens, getAdminToken } from "./adminApi";

export default function AdminGuard({ children }) {
  const location = useLocation();
  const hasToken = !!getAdminToken();

  // "checking" — verifying token with backend (only when token exists)
  // "ok"       — verified admin, render children
  // "denied"   — no token or backend rejected it
  const [status, setStatus] = useState(() => (hasToken ? "checking" : "denied"));

  useEffect(() => {
    // No token — nothing to verify
    if (!hasToken) return;

    let cancelled = false;

    fetchAdminMe()
      .then(() => {
        if (!cancelled) setStatus("ok");
      })
      .catch((err) => {
        if (cancelled) return;
        // Network error (backend offline) — trust stored token + user flags
        const isNetworkError = !err?.response;
        if (isNetworkError && isAdminApiLoggedIn()) {
          setStatus("ok");
        } else {
          // 401 / 403 — token invalid or user is no longer staff
          clearAdminTokens();
          setStatus("denied");
        }
      });

    return () => { cancelled = true; };
  }, []); // run once on mount

  if (status === "denied") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (status === "checking") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f8f9fb",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #e2e8f0", borderTopColor: "#009fd4",
          animation: "adm-guard-spin .7s linear infinite",
        }} />
        <style>{`@keyframes adm-guard-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}
