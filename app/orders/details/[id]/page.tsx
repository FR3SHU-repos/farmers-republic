// app/orders/details/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;

  status?: string;
  deliveryCharge?: number;
  extraCharge?: number;
  serviceCharge?: number;
  discountTotal?: number;

  // optional per-item payment info
  paymentStatus?: string;
  paymentMode?: string;
};

type BuyerOrder = {
  _id: string;
  buyerId?: string | null;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  source?: string;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const router = useRouter();

  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 👇 which item row is expanded
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load order");
        }

        setOrder(json.data as BuyerOrder);
      } catch (err: any) {
        console.error("order detail error:", err);
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortId = (id?: string) => (id ? id.slice(-6).toUpperCase() : "");

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-xs text-stone-500">Loading order…</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white border border-red-100 rounded-xl px-6 py-5 shadow-sm max-w-md w-full text-sm">
          <p className="text-red-600 font-semibold mb-1">
            {error || "Order not found"}
          </p>
          <p className="text-xs text-stone-500 mb-4">
            Please go back to your orders list.
          </p>
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="text-xs text-stone-700 hover:text-stone-900"
          >
            ← Back to My Orders
          </button>
        </div>
      </main>
    );
  }

  const deliveryCharges = order.items.reduce(
    (sum, it) => sum + (it.deliveryCharge ?? 0),
    0
  );
  const extraCharges = order.items.reduce(
    (sum, it) => sum + (it.extraCharge ?? 0),
    0
  );
  const serviceCharges = order.items.reduce(
    (sum, it) => sum + (it.serviceCharge ?? 0),
    0
  );
  const discounts = order.items.reduce(
    (sum, it) => sum + (it.discountTotal ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="text-xs text-stone-600 hover:text-stone-900"
        >
          ← Back to My Orders
        </button>

        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              Order #{shortId(order._id)}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Placed on {formatDate(order.createdAt)} •{" "}
              {order.source === "voice"
                ? "Voice"
                : order.source === "app"
                ? "App"
                : "Web"}
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right text-xs text-stone-500">
            <span>Buyer</span>
            <span className="font-semibold text-stone-800">
              {order.buyerName || order.buyerEmail}
            </span>
          </div>
        </header>

        {/* Status + payment summary */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-stone-100 p-4 text-sm">
            <p className="text-xs text-stone-500 mb-1">Order Status</p>
            <p className="font-semibold capitalize">
              {order.status.split("_").join(" ")}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-100 p-4 text-sm">
            <p className="text-xs text-stone-500 mb-1">Payment</p>
            <p className="font-semibold">
              {order.paymentStatus === "paid" ? "Paid" : "Unpaid"} •{" "}
              {order.paymentMode?.toUpperCase()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-100 p-4 text-sm">
            <p className="text-xs text-stone-500 mb-1">Order Total</p>
            <p className="font-semibold text-stone-900">
              ₹{order.total.toFixed(2)}
            </p>
          </div>
        </section>

        {/* Items */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-stone-900">
            Items in this order
          </h2>

          <div className="border border-stone-100 rounded-lg overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[minmax(0,2fr)_auto_auto_auto] bg-stone-50 text-xs text-stone-500 border-b border-stone-100 px-3 py-2">
              <div>Product</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Price (₹)</div>
              <div className="text-right">Total (₹)</div>
            </div>

            {order.items.map((it) => {
              const baseTotal = it.price * it.qty;
              const delivery = it.deliveryCharge ?? 0;
              const extra = it.extraCharge ?? 0;
              const service = it.serviceCharge ?? 0;
              const charges = delivery + extra + service;
              const discount = it.discountTotal ?? 0;
              const lineTotal = baseTotal + charges - discount;

              const isExpanded = expandedItemId === it.productId;

              const itemStatus =
                it.status || order.status || "pending";
              const itemPaymentStatus =
                it.paymentStatus || order.paymentStatus;
              const itemPaymentMode =
                it.paymentMode || order.paymentMode;

              return (
                <div
                  key={it.productId}
                  onClick={() =>
                    setExpandedItemId((prev) =>
                      prev === it.productId ? null : it.productId
                    )
                  }
                  className="flex flex-col sm:grid sm:grid-cols-[minmax(0,2fr)_auto_auto_auto] gap-3 px-3 py-3 sm:py-2.5 bg-white border-t border-stone-100 cursor-pointer"
                >
                  {/* Product info */}
                  <div className="flex items-start gap-3">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.image}
                        alt={it.name}
                        className="hidden sm:block w-12 h-12 rounded-xl object-cover bg-stone-100 border border-stone-100"
                      />
                    ) : (
                      <div className="hidden sm:flex w-12 h-12 rounded-xl items-center justify-center bg-stone-50 border border-stone-100 text-[10px] text-stone-500">
                        No image
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {it.name}
                      </p>
                      <p className="text-[11px] text-stone-400 font-mono">
                        #{it.productId.slice(-6).toUpperCase()}
                      </p>
                      <p className="sm:hidden text-[11px] text-stone-500 mt-1">
                        Qty: {it.qty} • Price: ₹{it.price.toFixed(2)}
                      </p>
                      <p className="sm:hidden text-[11px] text-stone-800">
                        Line total: ₹{lineTotal.toFixed(2)}
                      </p>
                      <p className="sm:hidden text-[10px] text-stone-400">
                        Tap to view item status & charges
                      </p>
                    </div>
                  </div>

                  {/* Desktop qty */}
                  <div className="hidden sm:flex items-center justify-end text-sm">
                    {it.qty}
                  </div>

                  {/* Desktop price */}
                  <div className="hidden sm:flex items-center justify-end text-sm">
                    ₹{it.price.toFixed(2)}
                  </div>

                  {/* Desktop total */}
                  <div className="hidden sm:flex flex-col items-end justify-center text-sm">
                    <span className="font-semibold text-stone-900">
                      ₹{lineTotal.toFixed(2)}
                    </span>
                    <span className="mt-1 text-[11px] text-stone-400">
                      Base: ₹{baseTotal.toFixed(2)} • Extra: ₹
                      {charges.toFixed(2)} • Discount: -₹
                      {discount.toFixed(2)}
                    </span>
                    <span className="mt-1 text-[10px] text-stone-400">
                      Click row to view item status & payment
                    </span>
                  </div>

                  {/* Expanded per-item details */}
                  {isExpanded && (
                    <div className="pt-2 mt-1 border-t border-stone-100 text-[11px] text-stone-600 sm:col-span-4 flex flex-wrap gap-x-6 gap-y-1">
                      <div>
                        <span className="font-semibold text-stone-800">
                          Item status:
                        </span>{" "}
                        {itemStatus
                          .split("_")
                          .map(
                            (p) => p.charAt(0).toUpperCase() + p.slice(1)
                          )
                          .join(" ")}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">
                          Payment:
                        </span>{" "}
                        {(itemPaymentStatus || "unpaid")
                          .charAt(0)
                          .toUpperCase() +
                          (itemPaymentStatus || "unpaid").slice(1)}{" "}
                        • {itemPaymentMode?.toUpperCase() || "COD"}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">
                          Delivery:
                        </span>{" "}
                        ₹{delivery.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">
                          Extra:
                        </span>{" "}
                        ₹{extra.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">
                          Service:
                        </span>{" "}
                        ₹{service.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">
                          Discount:
                        </span>{" "}
                        -₹{discount.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex justify-end pt-3">
            <div className="text-sm text-right space-y-1 w-full max-w-xs">
              <div className="flex justify-between gap-6">
                <span className="text-stone-500">Subtotal (items)</span>
                <span className="font-medium text-stone-900">
                  ₹{order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-stone-500">Delivery charges</span>
                <span className="font-medium text-stone-900">
                  ₹{deliveryCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-stone-500">Extra charges</span>
                <span className="font-medium text-stone-900">
                  ₹{extraCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-stone-500">Service charges</span>
                <span className="font-medium text-stone-900">
                  ₹{serviceCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-stone-500">Discounts</span>
                <span className="font-medium text-rose-600">
                  -₹{discounts.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-stone-100 pt-2 mt-2 flex justify-between gap-6 font-semibold">
                <span className="text-stone-700">Total</span>
                <span className="text-stone-900">
                  ₹{order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Continue shopping */}
        <div className="pt-2 text-xs text-stone-500">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-green-700 hover:underline"
          >
            ← Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
