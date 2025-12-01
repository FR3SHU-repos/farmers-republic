// app/cart/page.tsx
"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CartPage() {
  const { cart, addToCart, removeOne, clearCart, cartCount, subtotal, ready } =
    useCart();
  const { user } = useUser();
  const router = useRouter();

  if (!ready) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-stone-500">
        Loading your cart...
      </div>
    );
  }

  const items = Object.values(cart);

const handleCheckout = async () => {
  if (!items.length) return;

  try {
    const buyerPhone =
      (user as any)?.phone ||
      (user as any)?.phoneNumber ||
      (user as any)?.whatsappNumber ||
      "";

    const payload = {
      items: items.map((it) => ({
        productId: it.id,
        name: it.name,
        price: it.price,
        image: it.image,
        qty: it.qty,
        farmerId: it.farmerId,
      })),
      subtotal,
      deliveryFee: 0, // later you can calculate this
      buyerId: user?.id || null,
      buyerName: user?.name || "",
      buyerEmail: user?.email || "",
      buyerPhone,               // 👈👈 send phone!
      paymentMode: "cod",
      paymentStatus: "unpaid",
      source: "web",
    };

    const res = await fetch("/api/v1/orders/voice/buyerOrders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch (e) {
      console.error("Order API non-JSON response:", await res.text());
      throw e;
    }

    if (!res.ok || !json?.success) {
      console.error("Order API error:", res.status, json);
      throw new Error(json?.message || "Failed to place order");
    }

    toast.success("Order placed successfully ✅");
    clearCart();

    // redirect AFTER success
    router.push(`/orders/${user?.id}`);
  } catch (err: any) {
    console.error("Checkout error:", err);
    toast.error(err?.message || "Failed to place order");
  }
};


  if (items.length === 0) {
    return (
      <div className="text-center text-stone-500 py-20">
        <p className="mb-4">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 border-b pb-4 mb-4"
        >
          <div className="w-20 h-20 relative rounded-md overflow-hidden bg-stone-100">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-stone-500">
                No image
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-stone-500">
              ₹{item.price.toFixed(2)}
            </div>
            {item.farmerId && (
              <div className="text-xs text-stone-400 mt-1">
                Farmer ID: {item.farmerId}
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => removeOne(item.id)}
                className="px-2 py-1 border rounded"
              >
                -
              </button>
              <div className="px-3 py-1 border rounded">{item.qty}</div>
              <button
                onClick={() => addToCart(item)}
                className="px-2 py-1 border rounded"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-right font-semibold">
            ₹{(item.qty * item.price).toFixed(2)}
          </div>
        </div>
      ))}

      <div className="mt-6 border-t pt-6 flex justify-between items-center">
        <div>
          <div className="text-sm text-stone-500">Subtotal</div>
          <div className="text-2xl font-bold">₹{subtotal.toFixed(2)}</div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={clearCart}
            className="px-3 py-2 border rounded text-red-600"
          >
            Clear
          </button>
          <button
            onClick={handleCheckout}
            className="px-5 py-3 bg-green-600 text-white rounded-full"
          >
            Place order ({cartCount} items)
          </button>
        </div>
      </div>
    </div>
  );
}
