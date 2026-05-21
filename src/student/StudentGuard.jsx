import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "./StudentApi";

// Read the token synchronously on every render.
// localStorage.getItem is synchronous so this is always up-to-date —
// no stale state from a previous render cycle.
export default function StudentGuard({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }

  return children;
}
