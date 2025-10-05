"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
};

type CartContextType = {
  cart: Record<string, CartItem>;
  addToCart: (item: CartItem) => void;
  removeOne: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  ready: boolean; // 👈 new flag so UI knows when it's safe to read
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [ready, setReady] = useState(false);

  // ✅ Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fr_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCart(parsed);
      }
    } catch (e) {
      console.error("Cart load error:", e);
    } finally {
      setReady(true);
    }
  }, []);

  // ✅ Save to localStorage on change (after hydration)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("fr_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save error:", e);
    }
  }, [cart, ready]);

  // 🛒 Add item
  const addToCart = (item: CartItem) =>
    setCart((c) => {
      const existing = c[item.id];
      return {
        ...c,
        [item.id]: {
          ...item,
          qty: existing ? existing.qty + 1 : 1,
        },
      };
    });

  // ➖ Remove one
  const removeOne = (id: string) =>
    setCart((c) => {
      const existing = c[id];
      if (!existing) return c;
      const qty = existing.qty - 1;
      const updated = { ...c };
      if (qty <= 0) delete updated[id];
      else updated[id] = { ...existing, qty };
      return updated;
    });

  const clearCart = () => setCart({});

  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const subtotal = Object.values(cart).reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeOne, clearCart, cartCount, subtotal, ready }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
