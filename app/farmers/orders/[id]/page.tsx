// app/farmers/orders/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Package, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/shared/context/UserContext";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;

  // per-item fields from API
  status?: string;
  deliveryCharge?: number;
  extraCharge?: number;
  serviceCharge?: number;

  // optional platform / discount fields
  platformFeeTotal?: number;
  discountTotal?: number;
};

type FarmerOrderDetail = {
  orderId: string;
  farmerId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  source: string;
  createdAt: string;

  subtotal: number;
  total: number;
  itemsCount: number;

  deliveryTotal?: number;
  extraTotal?: number;
  serviceTotal?: number;
  platformFeeTotal?: number;
  discountTotal?: number;

  items: OrderItem[];
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

// ✅ NEW: helper to compute overall order status from items
const STATUS_ORDER = ["pending", "confirmed", "out_for_delivery", "delivered"] as const;

function deriveStatusFromItems(items: OrderItem[], prevStatus: string): string {
  if (!items.length) return prevStatus;

  // if all items are cancelled → cancelled
  if (items.every((it) => it.status === "cancelled")) {
    return "cancelled";
  }

  let maxIndex = -1;
  for (const it of items) {
    const s = (it.status || "") as (typeof STATUS_ORDER)[number];
    const idx = STATUS_ORDER.indexOf(s);
    if (idx > maxIndex) maxIndex = idx;
  }

  if (maxIndex >= 0) return STATUS_ORDER[maxIndex];
  return prevStatus;
}

const PAYMENT_STATUS_OPTIONS = ["unpaid", "paid"] as const;

export default function FarmerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId") || "";
  const router = useRouter();

  const { user } = useUser();
  const isFarmer = user?.type === "Farmer"; // 🔒 only farmers can edit

  const [data, setData] = useState<FarmerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcTotalsForItems = (items: OrderItem[]) => {
    let subtotal = 0;
    let deliveryTotal = 0;
    let extraTotal = 0;
    let serviceTotal = 0;
    let platformFeeTotal = 0;
    let discountTotal = 0;

    for (const it of items) {
      subtotal += it.price * it.qty;
      deliveryTotal += it.deliveryCharge ?? 0;
      extraTotal += it.extraCharge ?? 0;
      serviceTotal += it.serviceCharge ?? 0;
      platformFeeTotal += it.platformFeeTotal ?? 0;
      discountTotal += it.discountTotal ?? 0;
    }

    // what farmer receives: base + charges - platform fee - discounts
    const total =
      subtotal +
      deliveryTotal +
      extraTotal +
      serviceTotal -
      platformFeeTotal -
      discountTotal;

    return {
      subtotal,
      deliveryTotal,
      extraTotal,
      serviceTotal,
      platformFeeTotal,
      discountTotal,
      total,
    };
  };

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        setError("Missing orderId");
        setLoading(false);
        return;
      }
      if (!farmerId) {
        setError("Missing farmerId");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `/api/v1/farmers/orders/${encodeURIComponent(
          orderId,
        )}?farmerId=${encodeURIComponent(farmerId)}`;

        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();
        const contentType = res.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          console.error("Non-JSON response from", url, res.status, text);
          throw new Error(
            `Unexpected response from server (status ${res.status})`,
          );
        }

        let json: any;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error("JSON parse error:", e, text);
          throw new Error("Server returned invalid JSON");
        }

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load order");
        }

        const d = json.data as FarmerOrderDetail;

        const safeItems: OrderItem[] = (d.items || []).map((it) => ({
          ...it,
          price: Number(it.price ?? 0),
          qty: Number(it.qty ?? 0),
          deliveryCharge: Number(it.deliveryCharge ?? 0),
          extraCharge: Number(it.extraCharge ?? 0),
          serviceCharge: Number(it.serviceCharge ?? 0),
          platformFeeTotal: Number(it.platformFeeTotal ?? 0),
          discountTotal: Number(it.discountTotal ?? 0),
        }));

        const totals = calcTotalsForItems(safeItems);

        setData({
          ...d,
          items: safeItems,
          subtotal: totals.subtotal,
          total: totals.total,
          deliveryTotal: totals.deliveryTotal,
          extraTotal: totals.extraTotal,
          serviceTotal: totals.serviceTotal,
          platformFeeTotal: totals.platformFeeTotal,
          discountTotal: totals.discountTotal,
        });
      } catch (err: any) {
        console.error("order detail error:", err);
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId, farmerId]);

  /**
   * 🔄 Optimistic order-level update
   * Fixes:
   *  - "Pending" not changing
   *  - Mark as Paid / Unpaid not reflecting immediately
   */
  const handleUpdate = async (patch: {
    status?: string;
    paymentStatus?: string;
  }) => {
    if (!data || !orderId) return;
    if (!isFarmer) {
      toast.error("Only farmers can update order status.");
      return;
    }

    const prev = data; // keep copy for rollback

    // optimistic update
    setData((curr) => (curr ? { ...curr, ...patch } : curr));

    try {
      setSaving(true);

      const res = await fetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update order");
      }

      toast.success("Order updated");
    } catch (err: any) {
      console.error("update error:", err);
      // rollback
      setData(prev);
      toast.error(err?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  /**
   * 🔄 Optimistic item-level update
   * Fixes:
   *  - discount line not changing
   *  - totals & "You receive" not refreshing
   *  - per-item status not updating visually
   */
// keep function signature the same
const handleItemUpdate = async (
  productId: string,
  patch: {
    status?: string;
    deliveryCharge?: number;
    extraCharge?: number;
    serviceCharge?: number;
    discountTotal?: number;
  },
) => {
  if (!data || !orderId || !farmerId) return;
  if (!isFarmer) {
    toast.error("Only farmers can update item details.");
    return;
  }

  // keep previous snapshot for rollback
  const prev = data;

  // 🔄 optimistic local update
  setData((curr) => {
    if (!curr) return curr;
    const newItems = curr.items.map((it) =>
      it.productId === productId ? { ...it, ...patch } : it,
    );

    const totals = calcTotalsForItems(newItems);
    const newStatus = deriveStatusFromItems(newItems, curr.status);

    return {
      ...curr,
      status: newStatus, // ✅ order card uses this
      items: newItems,
      subtotal: totals.subtotal,
      total: totals.total,
      deliveryTotal: totals.deliveryTotal,
      extraTotal: totals.extraTotal,
      serviceTotal: totals.serviceTotal,
      platformFeeTotal: totals.platformFeeTotal,
      discountTotal: totals.discountTotal,
    };
  });

  try {
    setSaving(true);

    const res = await fetch(
      `/api/v1/farmers/orders/${encodeURIComponent(
        orderId,
      )}?farmerId=${encodeURIComponent(farmerId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ...patch,
        }),
      },
    );

    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || "Failed to update item");
    }

    toast.success("Item updated");
  } catch (err: any) {
    console.error("item update error:", err);
    // rollback to previous state if API fails
    setData(prev);
    toast.error(err?.message || "Failed to update item");
  } finally {
    setSaving(false);
  }
};


  const formatDate = (str: string) => {
    const d = new Date(str);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-500 text-sm">
          Loading order…
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="bg-white border border-red-100 rounded-xl px-6 py-5 shadow-sm max-w-md w-full">
          <p className="text-red-600 font-medium text-sm mb-1">
            {error || "Order not found"}
          </p>
          <p className="text-xs text-stone-500 mb-4">
            Please check the link or return to your dashboard.
          </p>

          <button
            type="button"
            onClick={() => router.push("/farmers/dashboard")}
            className="inline-flex items-center gap-2 text-xs text-stone-700 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
        </div>
      </main>
    );
  }

  const canEdit = isFarmer;

  return (
    <main className="min-h-screen bg-stone-50 pb-10">
      {/* Top bar */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/farmers/dashboard")}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>

          <div className="flex items-center gap-3">
            {!canEdit && (
              <span className="hidden sm:inline-block text-[11px] text-stone-400">
                Read only – only farmers can update this order
              </span>
            )}
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-stone-400">
                Order
              </p>
              <p className="font-mono text-xs bg-stone-100 px-2 py-1 rounded">
                #{data.orderId.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* left: buyer + items */}
          <div className="md:col-span-2 space-y-4">
            {/* Buyer & meta */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-stone-500">Buyer</p>
                  <Link
                    href={`/buyers/profile/${data.buyerId}`}
                    className="text-sm font-semibold text-stone-900 hover:underline"
                  >
                    {data.buyerName || "Unknown"}
                  </Link>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Order created • {formatDate(data.createdAt)}
                  </p>
                </div>

                <div className="hidden sm:block text-right text-xs text-stone-500">
                  <p>Source</p>
                  <p className="font-medium text-stone-800">
                    {data.source === "voice"
                      ? "Voice"
                      : data.source === "app"
                      ? "App"
                      : "Web"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    Phone
                  </p>
                  <p className="font-medium text-stone-800">
                    {data.buyerPhone || "Not provided"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    Email
                  </p>
                  <p className="font-medium text-stone-800">
                    {data.buyerEmail || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-700" />
                  Items in this order (for you)
                </h2>
                {!canEdit && (
                  <span className="text-[10px] text-stone-400">
                    Viewing only. Login as farmer to edit statuses & fees.
                  </span>
                )}
              </div>

              <div className="border border-stone-100 rounded-xl overflow-hidden">
                {/* header row for desktop */}
                <div className="hidden sm:grid sm:grid-cols-[minmax(0,2fr)_auto_auto_auto] bg-stone-50 text-xs text-stone-500 border-b border-stone-100 px-3 py-2">
                  <div>Product</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Price (₹)</div>
                  <div className="text-right">Total (₹)</div>
                </div>

                {data.items.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-stone-400">
                    No items for you in this order.
                  </div>
                )}

                {data.items.map((it) => {
                  const baseTotal = it.price * it.qty;
                  const charges =
                    (it.deliveryCharge ?? 0) +
                    (it.extraCharge ?? 0) +
                    (it.serviceCharge ?? 0);
                  const discount = it.discountTotal ?? 0;
                  const lineTotal = baseTotal + charges - discount;

                  return (
                    <div
                      key={it.productId}
                      className="flex flex-col sm:grid sm:grid-cols-[minmax(0,2fr)_auto_auto_auto] gap-3 px-3 py-3 sm:py-2.5 bg-white border-t border-stone-100 last:border-b-0"
                    >
                      {/* Left: product info */}
                      <div className="flex items-start gap-3">
                        {it.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.image}
                            alt={it.name}
                            className="hidden sm:block w-12 h-12 rounded-xl object-cover bg-stone-100 border border-stone-100"
                          />
                        ) : (
                          <div className="hidden sm:flex w-12 h-12 rounded-xl items-center justify-center bg-stone-50 border border-stone-100 text-xs text-stone-500">
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

                          {/* Mobile quick info */}
                          <div className="mt-1 flex sm:hidden items-center justify-between text-[11px] text-stone-500">
                            <span>Qty: {it.qty}</span>
                            <span>₹{it.price.toFixed(2)}</span>
                            <span className="font-semibold text-stone-900">
                              ₹{baseTotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Mobile status + charges */}
                          <div className="mt-2 space-y-1 sm:hidden">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-stone-500">
                                Item status
                              </span>
                              <select
                                value={it.status || data.status}
                                disabled={saving || !canEdit}
                                onChange={(e) =>
                                  handleItemUpdate(it.productId, {
                                    status: e.target.value,
                                  })
                                }
                                className="text-[11px] border border-stone-200 rounded-full px-2 py-1 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-stone-100 disabled:text-stone-400"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s
                                      .split("_")
                                      .map(
                                        (p) =>
                                          p[0].toUpperCase() + p.slice(1),
                                      )
                                      .join(" ")}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Mobile: extra fees */}
                            <div className="flex flex-col gap-1 text-[11px] text-stone-500">
                              <div className="flex items-center justify-between">
                                <span>Extra fees</span>
                                <span className="text-[10px] text-stone-400">
                                  Delivery / Packing / Service
                                </span>
                              </div>

                              <div className="flex items-center justify-end gap-1.5">
                                {/* Delivery */}
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-[10px] text-stone-400">
                                    Delivery
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    defaultValue={it.deliveryCharge ?? 0}
                                    disabled={saving || !canEdit}
                                    onBlur={(e) =>
                                      handleItemUpdate(it.productId, {
                                        deliveryCharge: Number(
                                          e.target.value || 0,
                                        ),
                                      })
                                    }
                                    className="w-16 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                                    placeholder="0"
                                  />
                                </div>

                                {/* Extra */}
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-[10px] text-stone-400">
                                    Extra
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    defaultValue={it.extraCharge ?? 0}
                                    disabled={saving || !canEdit}
                                    onBlur={(e) =>
                                      handleItemUpdate(it.productId, {
                                        extraCharge: Number(
                                          e.target.value || 0,
                                        ),
                                      })
                                    }
                                    className="w-16 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                                    placeholder="0"
                                  />
                                </div>

                                {/* Service */}
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-[10px] text-stone-400">
                                    Service
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    defaultValue={it.serviceCharge ?? 0}
                                    disabled={saving || !canEdit}
                                    onBlur={(e) =>
                                      handleItemUpdate(it.productId, {
                                        serviceCharge: Number(
                                          e.target.value || 0,
                                        ),
                                      })
                                    }
                                    className="w-16 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Mobile: discount */}
                            <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                              <span>Discount</span>
                              <div className="flex items-center gap-1.5">
                                <div className="relative w-20">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    defaultValue={it.discountTotal ?? 0}
                                    disabled={saving || !canEdit}
                                    onBlur={(e) =>
                                      handleItemUpdate(it.productId, {
                                        discountTotal: Number(
                                          e.target.value || 0,
                                        ),
                                      })
                                    }
                                    className="w-full border border-stone-200 rounded-full pl-4 pr-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between text-[11px] text-stone-500 mt-1">
                              <span>Line total</span>
                              <span className="font-semibold text-stone-900">
                                ₹{lineTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop qty */}
                      <div className="hidden sm:flex flex-col justify-center text-right text-sm text-stone-800">
                        {it.qty}
                      </div>

                      {/* Desktop price */}
                      <div className="hidden sm:flex flex-col justify-center text-right text-sm text-stone-800">
                        ₹{it.price.toFixed(2)}
                      </div>

                      {/* Desktop totals + controls */}
                      <div className="hidden sm:flex flex-col items-end justify-center gap-2 text-right text-sm">
                        <span className="font-semibold text-stone-900">
                          ₹{lineTotal.toFixed(2)}
                        </span>

                        {/* Status dropdown */}
                        <select
                          value={it.status || data.status}
                          disabled={saving || !canEdit}
                          onChange={(e) =>
                            handleItemUpdate(it.productId, {
                              status: e.target.value,
                            })
                          }
                          className="text-[11px] border border-stone-200 rounded-full px-3 py-1 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-stone-100 disabled:text-stone-400"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s
                                .split("_")
                                .map((p) => p[0].toUpperCase() + p.slice(1))
                                .join(" ")}
                            </option>
                          ))}
                        </select>

                        {/* Fees row with labels + discount */}
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex justify-end gap-4 text-[10px] text-stone-400">
                            <span className="w-16 text-right">Delivery</span>
                            <span className="w-16 text-right">Extra</span>
                            <span className="w-16 text-right">Service</span>
                            <span className="w-16 text-right">Discount</span>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Delivery */}
                            <div className="relative w-16">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">
                                ₹
                              </span>
                              <input
                                type="number"
                                min={0}
                                defaultValue={it.deliveryCharge ?? 0}
                                disabled={saving || !canEdit}
                                onBlur={(e) =>
                                  handleItemUpdate(it.productId, {
                                    deliveryCharge: Number(
                                      e.target.value || 0,
                                    ),
                                  })
                                }
                                className="w-full border border-stone-200 rounded-full pl-4 pr-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                              />
                            </div>

                            {/* Extra */}
                            <div className="relative w-16">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">
                                ₹
                              </span>
                              <input
                                type="number"
                                min={0}
                                defaultValue={it.extraCharge ?? 0}
                                disabled={saving || !canEdit}
                                onBlur={(e) =>
                                  handleItemUpdate(it.productId, {
                                    extraCharge: Number(
                                      e.target.value || 0,
                                    ),
                                  })
                                }
                                className="w-full border border-stone-200 rounded-full pl-4 pr-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                              />
                            </div>

                            {/* Service */}
                            <div className="relative w-16">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">
                                ₹
                              </span>
                              <input
                                type="number"
                                min={0}
                                defaultValue={it.serviceCharge ?? 0}
                                disabled={saving || !canEdit}
                                onBlur={(e) =>
                                  handleItemUpdate(it.productId, {
                                    serviceCharge: Number(
                                      e.target.value || 0,
                                    ),
                                  })
                                }
                                className="w-full border border-stone-200 rounded-full pl-4 pr-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                              />
                            </div>

                            {/* Discount */}
                            <div className="relative w-16">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">
                                ₹
                              </span>
                              <input
                                type="number"
                                min={0}
                                defaultValue={it.discountTotal ?? 0}
                                disabled={saving || !canEdit}
                                onBlur={(e) =>
                                  handleItemUpdate(it.productId, {
                                    discountTotal: Number(
                                      e.target.value || 0,
                                    ),
                                  })
                                }
                                className="w-full border border-stone-200 rounded-full pl-4 pr-2 py-0.5 text-[11px] text-right bg-stone-50 disabled:bg-stone-100"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary – clear breakdown */}
              <div className="flex justify-end pt-3">
                <div className="text-sm text-right space-y-1 w-full max-w-xs">
                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">Subtotal (items)</span>
                    <span className="font-medium text-stone-900">
                      ₹{data.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">Delivery charges</span>
                    <span className="font-medium text-stone-900">
                      ₹{(data.deliveryTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">Extra charges</span>
                    <span className="font-medium text-stone-900">
                      ₹{(data.extraTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">Service charges</span>
                    <span className="font-medium text-stone-900">
                      ₹{(data.serviceTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">
                      Platform fees (FR3SH)
                    </span>
                    <span className="font-medium text-rose-600">
                      -₹{(data.platformFeeTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">Discounts</span>
                    <span className="font-medium text-rose-600">
                      -₹{(data.discountTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-stone-100 pt-2 mt-2 flex justify-between gap-6 font-semibold">
                    <span className="text-stone-700">You receive</span>
                    <span className="text-stone-900">
                      ₹{data.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* right: status & payment */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-stone-800">
                  Order Status
                </h3>
                {!canEdit && (
                  <span className="text-[10px] text-stone-400">Read only</span>
                )}
              </div>

              <select
                value={data.status}
                onChange={(e) => handleUpdate({ status: e.target.value })}
                disabled={saving || !canEdit}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-stone-100 disabled:text-stone-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s
                      .split("_")
                      .map((p) => p[0].toUpperCase() + p.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-stone-400">
                This updates the overall order status (shared with other
                farmers in this order).
              </p>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  Payment
                </h3>
                {!canEdit && (
                  <span className="text-[10px] text-stone-400">Read only</span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500 text-xs">Mode</span>
                  <span className="font-medium text-stone-800">
                    {data.paymentMode.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 text-xs">Status</span>
                  <span className="font-medium text-stone-800">
                    {data.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                {PAYMENT_STATUS_OPTIONS.map((pStatus) => (
                  <button
                    key={pStatus}
                    type="button"
                    disabled={saving || !canEdit}
                    onClick={() => handleUpdate({ paymentStatus: pStatus })}
                    className={`flex-1 px-3 py-1.5 rounded-full text-xs border transition ${
                      data.paymentStatus === pStatus
                        ? pStatus === "paid"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 disabled:bg-stone-100 disabled:text-stone-400"
                    }`}
                  >
                    {pStatus === "paid" ? "Mark as Paid" : "Mark as Unpaid"}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-stone-400">
                Payment status applies to the whole order, not just your items.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
