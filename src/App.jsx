import React from "react";
import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./CartContext";
import Layout from "./Layout";
import StudentProjects from "./StudentProjects";
import ProjectDetailPage from "./ProjectDetailPage";
import CartPage from "./CartPage";
import CheckoutPage from "./CheckoutPage";

export default function App() {
  return (
    <CartProvider>
      <Layout>
        <Routes>
          <Route path="/"               element={<StudentProjects />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/cart"           element={<CartPage />} />
          <Route path="/checkout"       element={<CheckoutPage />} />
        </Routes>
      </Layout>
    </CartProvider>
  );
}
