import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "webxter_cart";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // storage full or unavailable — fail silently
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

export function CartProvider({ children }) {
  // initialise from localStorage so cart survives refresh
  const [cart, setCart] = useState(() => loadCart());
  const [toast, setToast] = useState(null);

  // keep localStorage in sync whenever cart changes
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addToCart = useCallback((project) => {
    setCart((prev) => {
      if (prev.find((p) => p.id === project.id)) {
        // already in cart — just show toast, don't duplicate
        return prev;
      }
      return [...prev, project];
    });
    setToast(`"${project.title}" added to cart!`);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // clearCart is called after a successful order — wipes localStorage too
  const clearCart = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, toast }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
