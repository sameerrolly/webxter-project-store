import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isStudentLoggedIn } from "./studentStore";

export default function StudentGuard({ children }) {
  const location = useLocation();
  if (!isStudentLoggedIn()) {
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }
  return children;
}
