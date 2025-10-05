// app/cart/page.tsx


"use client";
import React from "react";
import Image from "next/image";
import { useCart } from "@/shared/context/CartContext";

export default function CartPage() {
  const { cart, removeOne, addToCart, subtotal, cartCount, clearCart } = useCart();
  const items = Object.values(cart);

  if (items.length === 0)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold mb-2">Your cart is empty 🛒</h1>
        <p className="text-stone-500">Browse products and add some items!</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b pb-4">
            <div className="w-20 h-20 relative rounded-md overflow-hidden bg-stone-100">
              <Image
                src={item.image || "/placeholder.png"}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-stone-500">${item.price.toFixed(2)}</div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => removeOne(item.id)}
                  className="px-2 py-1 border rounded"
                >
                  -
                </button>
                <span>{item.qty}</span>
                <button
                  onClick={() => addToCart(item)}
                  className="px-2 py-1 border rounded"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-right font-semibold">
              ${(item.price * item.qty).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t pt-6 flex justify-between items-center">
        <div>
          <div className="text-sm text-stone-500">Total ({cartCount} items)</div>
          <div className="text-2xl font-bold">${subtotal.toFixed(2)}</div>
        </div>
        <button className="bg-green-600 text-white px-5 py-3 rounded-full hover:bg-green-700">
          Checkout
        </button>
      </div>

      <button
        onClick={clearCart}
        className="mt-4 text-sm text-red-500 hover:underline"
      >
        Clear Cart
      </button>
    </div>
  );
}
