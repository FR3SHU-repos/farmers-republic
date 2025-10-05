// app/cart/page.tsx

"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";

export default function CartPage() {
  const { cart, addToCart, removeOne, clearCart, cartCount, subtotal, ready } = useCart();

  // 🕐 Show loader until cart is ready (to avoid blank / hydration mismatch)
  if (!ready) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-stone-500">
        Loading your cart...
      </div>
    );
  }

  const items = Object.values(cart);

  if (items.length === 0) {
    return (
      <div className="text-center text-stone-500 py-20">
        <p className="mb-4">Your cart is empty.</p>
        <Link href="/products" className="inline-block px-4 py-2 bg-green-600 text-white rounded">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 border-b pb-4 mb-4">
          <div className="w-20 h-20 relative rounded-md overflow-hidden bg-stone-100">
            {item.image ? (
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-stone-500">
                No image
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-stone-500">₹{item.price.toFixed(2)}</div>

            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => removeOne(item.id)} className="px-2 py-1 border rounded">-</button>
              <div className="px-3 py-1 border rounded">{item.qty}</div>
              <button onClick={() => addToCart(item)} className="px-2 py-1 border rounded">+</button>
            </div>
          </div>

          <div className="text-right font-semibold">₹{(item.qty * item.price).toFixed(2)}</div>
        </div>
      ))}

      <div className="mt-6 border-t pt-6 flex justify-between items-center">
        <div>
          <div className="text-sm text-stone-500">Subtotal</div>
          <div className="text-2xl font-bold">₹{subtotal.toFixed(2)}</div>
        </div>

        <div className="flex gap-3 items-center">
          <button onClick={clearCart} className="px-3 py-2 border rounded text-red-600">
            Clear
          </button>
          <button className="px-5 py-3 bg-green-600 text-white rounded-full">Checkout</button>
        </div>
      </div>
    </div>
  );
}
