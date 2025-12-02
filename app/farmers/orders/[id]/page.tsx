// app/farmers/orders/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Package, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;

  // per-item fields
  status?: string;
  deliveryCharge?: number;
  extraCharge?: number;
  serviceCharge?: number;
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
  items: OrderItem[];
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const PAYMENT_STATUS_OPTIONS = ["unpaid", "paid"] as const;

export default function FarmerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId") || "";
  const router = useRouter();

  const [data, setData] = useState<FarmerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcTotalsForItems = (items: OrderItem[]) => {
    const subtotal = items.reduce(
      (sum, it) => sum + it.price * it.qty,
      0,
    );

    const charges = items.reduce(
      (sum, it) =>
        sum +
        (it.deliveryCharge ?? 0) +
        (it.extraCharge ?? 0) +
        (it.serviceCharge ?? 0),
      0,
    );

    return {
      subtotal,
      total: subtotal + charges,
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
          throw new Error(`Unexpected response from server (status ${res.status})`);
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

        // Ensure numeric fields
        const safeItems: OrderItem[] = (d.items || []).map((it) => ({
          ...it,
          price: Number(it.price ?? 0),
          qty: Number(it.qty ?? 0),
          deliveryCharge: Number(it.deliveryCharge ?? 0),
          extraCharge: Number(it.extraCharge ?? 0),
          serviceCharge: Number(it.serviceCharge ?? 0),
        }));

        const totals = calcTotalsForItems(safeItems);

        setData({
          ...d,
          items: safeItems,
          subtotal: totals.subtotal,
          total: totals.total,
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

  const handleUpdate = async (patch: { status?: string; paymentStatus?: string }) => {
    if (!data || !orderId) return;
    try {
      setSaving(true);

      const res = await fetch(
        `/api/v1/orders/${encodeURIComponent(orderId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update order");
      }

      toast.success("Order updated");
      setData({ ...data, ...patch });
    } catch (err: any) {
      console.error("update error:", err);
      toast.error(err?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleItemUpdate = async (
    productId: string,
    patch: {
      status?: string;
      deliveryCharge?: number;
      extraCharge?: number;
      serviceCharge?: number;
    },
  ) => {
    if (!data || !orderId || !farmerId) return;

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

      // update local state
      setData((prev) => {
        if (!prev) return prev;

        const newItems = prev.items.map((it) =>
          it.productId === productId ? { ...it, ...patch } : it,
        );
        const totals = calcTotalsForItems(newItems);

        return {
          ...prev,
          items: newItems,
          subtotal: totals.subtotal,
          total: totals.total,
        };
      });

      toast.success("Item updated");
    } catch (err: any) {
      console.error("item update error:", err);
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

          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">
              Order
            </p>
            <p className="font-mono text-xs bg-stone-100 px-2 py-1 rounded">
              #{data.orderId.slice(-6).toUpperCase()}
            </p>
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
              <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-700" />
                Items in this order (for you)
              </h2>

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
                  const lineTotal = baseTotal + charges;

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
                                disabled={saving}
                                onChange={(e) =>
                                  handleItemUpdate(it.productId, {
                                    status: e.target.value,
                                  })
                                }
                                className="text-[11px] border border-stone-200 rounded-full px-2 py-1 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-400"
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

                            <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                              <span>Extra fees</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={it.deliveryCharge ?? 0}
                                  disabled={saving}
                                  onBlur={(e) =>
                                    handleItemUpdate(it.productId, {
                                      deliveryCharge: Number(
                                        e.target.value || 0,
                                      ),
                                    })
                                  }
                                  className="w-14 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50"
                                  placeholder="Del"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={it.extraCharge ?? 0}
                                  disabled={saving}
                                  onBlur={(e) =>
                                    handleItemUpdate(it.productId, {
                                      extraCharge: Number(
                                        e.target.value || 0,
                                      ),
                                    })
                                  }
                                  className="w-14 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50"
                                  placeholder="Extra"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={it.serviceCharge ?? 0}
                                  disabled={saving}
                                  onBlur={(e) =>
                                    handleItemUpdate(it.productId, {
                                      serviceCharge: Number(
                                        e.target.value || 0,
                                      ),
                                    })
                                  }
                                  className="w-14 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50"
                                  placeholder="Serv"
                                />
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
                      <div className="hidden sm:flex flex-col items-end justify-center gap-1 text-right text-sm">
                        <span className="font-semibold text-stone-900">
                          ₹{lineTotal.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={it.status || data.status}
                            disabled={saving}
                            onChange={(e) =>
                              handleItemUpdate(it.productId, {
                                status: e.target.value,
                              })
                            }
                            className="text-[11px] border border-stone-200 rounded-full px-2 py-0.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-400"
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

                          <input
                            type="number"
                            min={0}
                            defaultValue={it.deliveryCharge ?? 0}
                            disabled={saving}
                            onBlur={(e) =>
                              handleItemUpdate(it.productId, {
                                deliveryCharge: Number(
                                  e.target.value || 0,
                                ),
                              })
                            }
                            className="w-14 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50"
                            placeholder="Del"
                            title="Delivery charge"
                          />
                          <input
                            type="number"
                            min={0}
                            defaultValue={it.extraCharge ?? 0}
                            disabled={saving}
                            onBlur={(e) =>
                              handleItemUpdate(it.productId, {
                                extraCharge: Number(e.target.value || 0),
                              })
                            }
                            className="w-14 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50"
                            placeholder="Extra"
                            title="Extra charge"
                          />
                          <input
                            type="number"
                            min={0}
                            defaultValue={it.serviceCharge ?? 0}
                            disabled={saving}
                            onBlur={(e) =>
                              handleItemUpdate(it.productId, {
                                serviceCharge: Number(
                                  e.target.value || 0,
                                ),
                              })
                            }
                            className="w-14 border border-stone-200 rounded-full px-2 py-0.5 text-[11px] text-right bg-stone-50"
                            placeholder="Serv"
                            title="Service charge"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3">
                <div className="text-sm text-right space-y-1">
                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">Subtotal (items)</span>
                    <span className="font-medium text-stone-900">
                      ₹{data.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">
                      Extra fees (delivery + others)
                    </span>
                    <span className="font-medium text-stone-900">
                      ₹{(data.total - data.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6 font-semibold">
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
              <h3 className="text-sm font-semibold text-stone-800">
                Order Status
              </h3>

              <select
                value={data.status}
                onChange={(e) => handleUpdate({ status: e.target.value })}
                disabled={saving}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                Payment
              </h3>

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
                    disabled={saving}
                    onClick={() => handleUpdate({ paymentStatus: pStatus })}
                    className={`flex-1 px-3 py-1.5 rounded-full text-xs border transition ${
                      data.paymentStatus === pStatus
                        ? pStatus === "paid"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
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
