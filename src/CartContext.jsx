import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Per-user storage key ─────────────────────────────────────────────────────
function getCartKey() {
  try {
    const raw = localStorage.getItem("wx_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.email) return `webxter_cart_${user.email.toLowerCase()}`;
    }
  } catch {}
  return "webxter_cart_guest";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadCart(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(key, cart) {
  try {
    localStorage.setItem(key, JSON.stringify(cart));
  } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartKey, setCartKey] = useState(() => getCartKey());
  const [cart, setCart]       = useState(() => loadCart(getCartKey()));
  const [toast, setToast]     = useState(null);

  // Persist cart whenever it changes
  useEffect(() => {
    saveCart(cartKey, cart);
  }, [cart, cartKey]);

  // When wx_user changes (login / logout / register) — switch to the new
  // user-scoped cart WITHOUT reloading the page.
  // This fires for both same-tab (StorageEvent dispatched manually in StudentApi)
  // and cross-tab (native storage event).
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== "wx_user") return;

      const newKey = getCartKey();
      if (newKey === cartKey) return; // same user, nothing to do

      // Switch cart to the new user's key — no reload needed
      setCartKey(newKey);
      setCart(loadCart(newKey));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [cartKey]);

  const addToCart = useCallback((project) => {
    // Guard: only logged-in users can add to cart
    if (!getCartKey().includes("@")) {
      window.dispatchEvent(new CustomEvent("wx-login-required"));
      return;
    }
    setCart((prev) => {
      if (prev.find((p) => p.id === project.id)) return prev;
      return [...prev, project];
    });
    setToast(`"${project.title}" added to cart!`);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem(cartKey); } catch {}
  }, [cartKey]);

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
