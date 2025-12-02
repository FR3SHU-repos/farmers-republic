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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortId = (id?: string) => (id ? id.slice(-6).toUpperCase() : "");

  // Color helpers for per-item status/payment pills only (no order-level usage)
  const getItemStatusClasses = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("shipped") || s.includes("transit")) {
      return "bg-sky-50 text-sky-700 border-sky-200";
    }
    if (s.includes("cancelled") || s.includes("failed")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (s.includes("processing") || s.includes("pending")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-stone-50 text-stone-700 border-stone-200";
  };

  const getItemPaymentClasses = (status: string) => {
    const s = status.toLowerCase();
    if (s === "paid" || s === "success") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s === "refunded") {
      return "bg-sky-50 text-sky-700 border-sky-200";
    }
    if (s === "failed") {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-stone-600 font-medium tracking-wide">
            Fetching your order details…
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 px-8 py-8 max-w-md w-full">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-stone-900 text-center mb-2">
            Order Not Found
          </h2>
          <p className="text-sm text-stone-600 text-center mb-6">
            {error || "The order you're looking for doesn't exist or has been removed."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Back to My Orders
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
    <main className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-50 to-stone-100 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 font-medium transition-colors group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* HEADER / HERO CARD */}
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-stone-200 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: order meta */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                  Order #{shortId(order._id)}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-xs font-semibold uppercase tracking-wide text-stone-600 border border-stone-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {order.source === "voice"
                    ? "Voice Order"
                    : order.source === "app"
                    ? "App Order"
                    : "Web Order"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-stone-600">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">Placed</span>
                  <span>• {formatDate(order.createdAt)}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 16h14M5 12h8"
                    />
                  </svg>
                  <span className="font-medium">Items</span>
                  <span>• {order.items.length}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8a9 9 0 100-18 9 9 0 000 18z"
                    />
                  </svg>
                  <span className="font-medium">Order ID</span>
                  <span>• {order._id}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-1">
                  Customer
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                  <span className="font-semibold text-stone-900">
                    {order.buyerName || order.buyerEmail}
                  </span>
                  {order.buyerEmail && (
                    <span className="text-stone-500 truncate">{order.buyerEmail}</span>
                  )}
                  {order.buyerPhone && (
                    <span className="inline-flex items-center gap-1 text-stone-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h2l2 5-2 2c1 3 3 5 6 6l2-2 5 2v2"
                        />
                      </svg>
                      {order.buyerPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: total summary only (no status/payment) */}
            <div className="w-full md:w-64">
              <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-emerald-50 via-emerald-50 to-green-100 px-4 py-4 sm:px-5 sm:py-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Order Total
                  </span>
                  <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
                  ₹{order.total.toFixed(2)}
                </p>
                <p className="text-xs text-emerald-800/80 mt-1">
                  Inclusive of all delivery, extra & service charges and discounts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ITEMS SECTION */}
        <section className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-stone-900">Items in this order</h2>
                <p className="text-xs text-stone-500">
                  {order.items.length} product{order.items.length !== 1 ? "s" : ""} · tap any row for a detailed breakdown
                </p>
              </div>
            </div>
          </div>

          <div className="border border-stone-200 rounded-xl overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden sm:grid sm:grid-cols-[minmax(0,2.3fr)_auto_auto_auto] bg-gradient-to-r from-stone-50 to-stone-100 text-xs font-semibold text-stone-600 uppercase tracking-wide border-b border-stone-200 px-4 py-3">
              <div>Product</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Unit Price</div>
              <div className="text-right">Line Total</div>
            </div>

            {/* Items */}
            {order.items.map((it, idx) => {
              const baseTotal = it.price * it.qty;
              const delivery = it.deliveryCharge ?? 0;
              const extra = it.extraCharge ?? 0;
              const service = it.serviceCharge ?? 0;
              const charges = delivery + extra + service;
              const discount = it.discountTotal ?? 0;
              const lineTotal = baseTotal + charges - discount;

              const isExpanded = expandedItemId === it.productId;

              const itemStatus = it.status || "pending";
              const itemPaymentStatus = it.paymentStatus || "unpaid";
              const itemPaymentMode = it.paymentMode || order.paymentMode || "COD";

              return (
                <div
                  key={it.productId}
                  className={`${idx !== 0 ? "border-t border-stone-200" : ""} transition-colors hover:bg-stone-50/80`}
                >
                  <div
                    onClick={() =>
                      setExpandedItemId((prev) =>
                        prev === it.productId ? null : it.productId
                      )
                    }
                    className="flex flex-col sm:grid sm:grid-cols-[minmax(0,2.3fr)_auto_auto_auto] gap-4 px-4 py-4 cursor-pointer"
                  >
                    {/* Product Info */}
                    <div className="flex items-start gap-4">
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl object-cover bg-stone-100 border border-stone-200 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-200 flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-stone-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-semibold text-stone-900 line-clamp-2">
                          {it.name}
                        </p>
                        <p className="text-xs text-stone-500 font-mono">
                          Product ID: {it.productId.slice(-6).toUpperCase()}
                        </p>

                        {/* Status + Payment pills (visible on both mobile & desktop) */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getItemStatusClasses(
                              itemStatus
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {itemStatus.split("_").join(" ")}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getItemPaymentClasses(
                              itemPaymentStatus
                            )}`}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            {itemPaymentStatus.charAt(0).toUpperCase() +
                              itemPaymentStatus.slice(1)}
                            <span className="text-[10px] uppercase opacity-80">
                              • {itemPaymentMode}
                            </span>
                          </span>
                        </div>

                        {/* Mobile-only quick totals */}
                        <div className="sm:hidden space-y-1.5 pt-3 border-t border-stone-200 mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-600">Quantity</span>
                            <span className="font-semibold text-stone-900">{it.qty}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-600">Unit Price</span>
                            <span className="font-semibold text-stone-900">
                              ₹{it.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-1">
                            <span className="font-medium text-stone-700">Line Total</span>
                            <span className="font-bold text-stone-900">
                              ₹{lineTotal.toFixed(2)}
                            </span>
                          </div>
                          <button className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 mt-2">
                            {isExpanded ? "Hide" : "View"} full breakdown
                            <svg
                              className={`w-3 h-3 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Columns */}
                    <div className="hidden sm:flex items-center justify-end text-base font-medium text-stone-900">
                      {it.qty}
                    </div>

                    <div className="hidden sm:flex items-center justify-end text-base font-medium text-stone-900">
                      ₹{it.price.toFixed(2)}
                    </div>

                    <div className="hidden sm:flex flex-col items-end justify-center">
                      <span className="text-base font-bold text-stone-900">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                      <button className="text-xs text-green-600 hover:text-green-700 font-medium mt-1 flex items-center gap-1">
                        {isExpanded ? "Hide" : "Show"} breakdown
                        <svg
                          className={`w-3 h-3 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-stone-50 border-t border-stone-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-stone-200">
                          <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">
                            Item Status
                          </p>
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getItemStatusClasses(
                              itemStatus
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {itemStatus.split("_").join(" ")}
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-stone-200">
                          <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">
                            Payment for this item
                          </p>
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getItemPaymentClasses(
                              itemPaymentStatus
                            )}`}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            {itemPaymentStatus.charAt(0).toUpperCase() +
                              itemPaymentStatus.slice(1)}
                            <span className="text-[10px] uppercase opacity-80">
                              • {itemPaymentMode}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-stone-200 sm:col-span-2 lg:col-span-1">
                          <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">
                            Price Breakdown
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-stone-600">
                                Base ({it.qty} × ₹{it.price.toFixed(2)})
                              </span>
                              <span className="font-medium text-stone-900">
                                ₹{baseTotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Delivery</span>
                              <span className="font-medium text-stone-900">
                                ₹{delivery.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Extra charges</span>
                              <span className="font-medium text-stone-900">
                                ₹{extra.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Service</span>
                              <span className="font-medium text-stone-900">
                                ₹{service.toFixed(2)}
                              </span>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-stone-600">Discount</span>
                                <span className="font-medium text-rose-600">
                                  -₹{discount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="pt-1 mt-1 border-t border-dashed border-stone-200 flex justify-between font-semibold">
                              <span className="text-stone-800">Line Total</span>
                              <span className="text-stone-900">₹{lineTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="flex justify-end">
              <div className="w-full max-w-md space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Subtotal (items)</span>
                  <span className="font-semibold text-stone-900">
                    ₹{order.subtotal.toFixed(2)}
                  </span>
                </div>

                {deliveryCharges > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">Delivery charges</span>
                    <span className="font-semibold text-stone-900">
                      ₹{deliveryCharges.toFixed(2)}
                    </span>
                  </div>
                )}

                {extraCharges > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">Extra charges</span>
                    <span className="font-semibold text-stone-900">
                      ₹{extraCharges.toFixed(2)}
                    </span>
                  </div>
                )}

                {serviceCharges > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">Service charges</span>
                    <span className="font-semibold text-stone-900">
                      ₹{serviceCharges.toFixed(2)}
                    </span>
                  </div>
                )}

                {discounts > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">Discounts</span>
                    <span className="font-semibold text-rose-600">
                      -₹{discounts.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-stone-300 pt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-stone-900">Grand Total</span>
                  <span className="text-2xl font-extrabold text-green-700">
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIONS */}
        <section className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 transition-colors group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Continue Shopping
          </Link>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4h10M7 8h10M7 12h4m-4 8h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Download Invoice
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 4l-4-4H8a4 4 0 01-4-4V7a4 4 0 014-4h8a4 4 0 014 4v5a4 4 0 01-4 4"
                />
              </svg>
              Contact Support
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
