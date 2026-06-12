"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
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
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-sm text-foreground-muted">Loading your cart…</p>
        </div>
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
        deliveryFee: 0,
        buyerId: user?.id || null,
        buyerName: user?.name || "",
        buyerEmail: user?.email || "",
        buyerPhone,
        paymentMode: "cod",
        paymentStatus: "unpaid",
        source: "web",
      };

      const res = await fetch("/api/v1/farmers/orders/voice/buyerOrders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to place order");
      }

      toast.success("Order placed successfully!");
      clearCart();
      router.push(`/orders/${user?.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to place order");
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface">
          <ShoppingBag className="h-10 w-10 text-brand" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-foreground-heading">
          Your cart is empty
        </h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
        >
          Browse products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-heading">
              Your Cart
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {cartCount} item{cartCount !== 1 ? "s" : ""} ready to order
            </p>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 rounded-full border border-status-danger/30 px-3 py-1.5 text-xs font-medium text-status-danger transition hover:bg-status-danger-surface"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── Items list ──────────────────────────────── */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-border bg-surface-card p-4 transition hover:shadow-sm"
              >
                {/* Thumbnail */}
                <div className="h-[4.5rem] w-[4.5rem] flex-shrink-0 overflow-hidden rounded-xl bg-surface">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={72}
                      height={72}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-tertiary-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <p className="font-semibold text-foreground-heading line-clamp-1">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground-muted">
                      ₹{item.price.toFixed(2)} per unit
                    </p>
                  </div>

                  {/* Quantity stepper */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
                      <button
                        onClick={() => removeOne(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface hover:text-foreground-heading"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-foreground-heading">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface hover:text-foreground-heading"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Line total */}
                <div className="flex flex-col items-end justify-center">
                  <p className="text-sm font-semibold text-foreground-heading">
                    ₹{(item.qty * item.price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order summary ───────────────────────────── */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground-heading">
                Order Summary
              </h2>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">
                    Subtotal ({cartCount} item{cartCount !== 1 ? "s" : ""})
                  </span>
                  <span className="font-medium text-foreground-body">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Delivery</span>
                  <span className="font-medium text-status-success">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Payment mode</span>
                  <span className="font-medium text-foreground-body">Cash on delivery</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-foreground-heading">Total</span>
                    <span className="text-2xl font-bold text-foreground-heading">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover active:scale-[0.98]"
              >
                Place Order
              </button>

              <Link
                href="/shop"
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-foreground-muted transition hover:text-foreground-body"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
