// app/orders/[id]/page.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/shared/context/UserContext";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;
};

type BuyerOrder = {
  _id: string;
  buyerId?: string | null;
  buyerName?: string;
  buyerEmail?: string;
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

type OrdersResponse = {
  orders: BuyerOrder[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_FILTERS = ["all", "pending", "confirmed", "out_for_delivery", "delivered", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function BuyerOrdersPage() {
  const { user, loading: userLoading } = useUser();

  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/v1/farmers/orders/voice/buyerOrders?buyerId=${encodeURIComponent(
            user.id
          )}`,
          { cache: "no-store" }
        );

        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load orders");
        }

        const data: OrdersResponse = json.data;
        setOrders(data.orders || []);
      } catch (err: any) {
        console.error("buyer orders error:", err);
        setError(err?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading && user?.id) {
      load();
    }
  }, [user?.id, userLoading]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const spent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    return { totalOrders, pending, delivered, spent };
  }, [orders]);

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

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "confirmed":
      case "out_for_delivery":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200";
    }
  };

  const paymentBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "unpaid":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200";
    }
  };

  if (!user && !userLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center text-sm text-stone-600">
          <p>You need to log in to see your orders.</p>
          <Link
            href="/login"
            className="mt-3 inline-block px-4 py-2 rounded-full bg-green-600 text-white text-xs font-semibold"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                My Orders
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Track all orders you have placed on FR3SH.
              </p>
            </div>
            {user && (
              <div className="hidden sm:flex flex-col items-end text-right text-xs text-stone-500">
                <span>Buyer</span>
                <span className="font-semibold text-stone-800">
                  {user.name || user.email}
                </span>
              </div>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-stone-100 p-3 sm:p-4">
              <p className="text-xs text-stone-500">Total Orders</p>
              <p className="text-xl font-bold mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl border border-yellow-100 p-3 sm:p-4">
              <p className="text-xs text-yellow-700">Pending</p>
              <p className="text-xl font-bold mt-1 text-yellow-800">
                {stats.pending}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-green-100 p-3 sm:p-4">
              <p className="text-xs text-green-700">Delivered</p>
              <p className="text-xl font-bold mt-1 text-green-800">
                {stats.delivered}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-blue-100 p-3 sm:p-4">
              <p className="text-xs text-blue-700">Total Spent (₹)</p>
              <p className="text-xl font-bold mt-1 text-blue-800">
                {stats.spent.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    statusFilter === s
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {s === "all"
                    ? "All"
                    : s
                        .split("_")
                        .map((p) => p[0].toUpperCase() + p.slice(1))
                        .join(" ")}
                </button>
              ))}
            </div>

            <div className="text-xs text-stone-500">
              Showing{" "}
              <span className="font-semibold">{filteredOrders.length}</span> of{" "}
              <span className="font-semibold">{orders.length}</span> orders
            </div>
          </div>

          {/* Orders list */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">
                      Items
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500">
                      Total (₹)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">
                      Placed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-xs text-stone-400"
                      >
                        Loading your orders…
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-xs text-red-500"
                      >
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-xs text-stone-400"
                      >
                        You haven&apos;t placed any orders yet.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    filteredOrders.map((o) => {
                      const itemsSummary = o.items
                        .map((it) => `${it.name} ×${it.qty}`)
                        .join(", ");

                      return (
                        <tr
                          key={o._id}
                          className="border-t border-stone-100 hover:bg-stone-50/60 transition"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-mono text-xs text-stone-600">
                              #{shortId(o._id)}
                            </div>
                            <div className="text-[11px] text-stone-400">
                              {o.source === "voice"
                                ? "Voice"
                                : o.source === "app"
                                ? "App"
                                : "Web"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-stone-700 max-w-xs">
                            {itemsSummary}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">
                            ₹{(o.total ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${statusBadgeClass(
                                o.status
                              )}`}
                            >
                              {o.status
                                ? o.status
                                    .split("_")
                                    .map(
                                      (p) => p[0].toUpperCase() + p.slice(1)
                                    )
                                    .join(" ")
                                : "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${paymentBadgeClass(
                                o.paymentStatus
                              )}`}
                            >
                              {o.paymentStatus
                                ? o.paymentStatus[0].toUpperCase() +
                                  o.paymentStatus.slice(1)
                                : "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                            {formatDate(o.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back to shopping */}
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
    </div>
  );
}
