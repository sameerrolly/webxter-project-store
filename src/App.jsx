import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./CartContext";
import Layout from "./Layout";

// Store pages
import StudentProjects from "./StudentProjects";
import ProjectDetailPage from "./ProjectDetailPage";
import CartPage from "./CartPage";
import CheckoutPage from "./CheckoutPage";

// Admin pages
import AdminGuard from "./admin/AdminGuard";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import { AdminProjectsList, AdminAddProject, AdminEditProject } from "./admin/AdminProjects";
import AdminOrders from "./admin/AdminOrders";
import AdminSettings from "./admin/AdminSettings";
import AdminCoupons from "./admin/AdminCoupons";

// Student dashboard pages
import StudentGuard from "./student/StudentGuard";
import StudentAuth from "./student/StudentAuth";
import StudentDashboard from "./student/StudentDashboard";
import StudentOrders from "./student/StudentOrders";
import StudentDownloads from "./student/StudentDownloads";
import StudentProfile from "./student/StudentProfile";
import StudentSupport from "./student/StudentSupport";

function AdminRoute({ children }) {
  return <AdminGuard>{children}</AdminGuard>;
}

function StudentRoute({ children }) {
  return <StudentGuard>{children}</StudentGuard>;
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        {/* ── Store ── */}
        <Route path="/"               element={<Layout><StudentProjects /></Layout>} />
        <Route path="/projects/:slug" element={<Layout><ProjectDetailPage /></Layout>} />
        <Route path="/cart"           element={<Layout><CartPage /></Layout>} />
        <Route path="/checkout"       element={<Layout><CheckoutPage /></Layout>} />

        {/* ── Student Dashboard ── */}
        <Route path="/student/login"     element={<StudentAuth />} />
        <Route path="/student/register"  element={<StudentAuth />} />
        <Route path="/student"           element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="/student/orders"    element={<StudentRoute><StudentOrders /></StudentRoute>} />
        <Route path="/student/downloads" element={<Navigate to="/student/orders" replace />} />
        <Route path="/student/profile"   element={<StudentRoute><StudentProfile /></StudentRoute>} />
        <Route path="/student/support"   element={<StudentRoute><StudentSupport /></StudentRoute>} />

        {/* ── Admin ── */}
        <Route path="/admin/login"           element={<AdminLogin />} />
        <Route path="/admin"                 element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"       element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/projects"        element={<AdminRoute><AdminProjectsList /></AdminRoute>} />
        <Route path="/admin/projects/new"    element={<AdminRoute><AdminAddProject /></AdminRoute>} />
        <Route path="/admin/projects/edit/:id" element={<AdminRoute><AdminEditProject /></AdminRoute>} />
        <Route path="/admin/orders"          element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/coupons"         element={<AdminRoute><AdminCoupons /></AdminRoute>} />
        <Route path="/admin/settings"        element={<AdminRoute><AdminSettings /></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  );
}
