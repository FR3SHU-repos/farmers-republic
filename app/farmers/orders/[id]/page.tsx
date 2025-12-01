// app/farmers/orders/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Package, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
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

export default function FarmerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orderId = params.id;
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId");
  const router = useRouter();

  const [data, setData] = useState<FarmerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!farmerId) {
        setError("Missing farmerId");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/v1/farmers/orders/${encodeURIComponent(
            orderId,
          )}?farmerId=${encodeURIComponent(farmerId)}`,
          { cache: "no-store" },
        );

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load order");
        }

        setData(json.data as FarmerOrderDetail);
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
    if (!data) return;
    try {
      setSaving(true);

      const res = await fetch(`/api/v1/farmers/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

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
        {/* primary info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* left: buyer + status */}
          <div className="md:col-span-2 space-y-4">
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

            {/* items */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-700" />
                Items in this order (for you)
              </h2>

              <div className="border border-stone-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-xs text-stone-500 border-b border-stone-100">
                    <tr>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Price (₹)</th>
                      <th className="text-right px-3 py-2">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it) => (
                      <tr
                        key={it.productId}
                        className="border-t border-stone-100 last:border-b-0"
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium text-stone-800">
                            {it.name}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            #{it.productId.slice(-6).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-stone-800">
                          {it.qty}
                        </td>
                        <td className="px-3 py-2 text-right text-stone-800">
                          ₹{it.price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-stone-900">
                          ₹{(it.price * it.qty).toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {data.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-xs text-stone-400"
                        >
                          No items for you in this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <div className="text-sm text-right space-y-1">
                  <div className="flex justify-between gap-6">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="font-medium text-stone-900">
                      ₹{data.subtotal.toFixed(2)}
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
            {/* status */}
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

            {/* payment */}
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
