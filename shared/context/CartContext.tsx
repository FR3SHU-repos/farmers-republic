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
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  // ✅ Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fr_cart");
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  // ✅ Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("fr_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // 🛒 Add to cart
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
      const updatedQty = existing.qty - 1;
      const copy = { ...c };
      if (updatedQty <= 0) delete copy[id];
      else copy[id] = { ...existing, qty: updatedQty };
      return copy;
    });

  // 🧹 Clear all
  const clearCart = () => setCart({});

  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const subtotal = Object.values(cart).reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeOne, clearCart, cartCount, subtotal }}
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
