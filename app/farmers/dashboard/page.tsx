// app/farmers/dashboard/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/shared/context/UserContext";

type FarmerOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  source: string;
  createdAt: string;
  itemsCount: number;
};

const STATUS_FILTERS = ["all", "pending", "confirmed", "out_for_delivery", "delivered", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function FarmerOrdersDashboardPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

useEffect(() => {
  const load = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Get REAL farmerId (profile -> farmer)
      const fRes = await fetch(`/api/v1/helper/by-profile/${user.id}`);
      //const fRes = await fetch(`/api/v1/helper/by-profile/692c565e16ca8fb8b2db16e1`);
      if (fRes.status === 404) {
        // ❗ No farmer profile for this user — just show empty state
        console.warn("No farmer profile for user", user.id);
        setOrders([]);
        return;
      }

      if (!fRes.ok) {
        const txt = await fRes.text();
        console.error("by-profile error response:", fRes.status, txt);
        throw new Error("Failed to load farmer profile");
      }

      const fJson = await fRes.json();
      if (!fJson.success || !fJson.data?.farmerId) {
        throw new Error(fJson.message || "Farmer profile not found");
      }

      console.log("Farmer profile fetched:", fJson.data.farmerId);

      const farmerId = fJson.data.farmerId as string;

      // 2️⃣ Fetch orders for that farmerId
      const res = await fetch(
        `/api/v1/farmers/dashboard/orders?farmerId=${encodeURIComponent(
          farmerId
        )}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const txt = await res.text();
        console.error("orders error response:", res.status, txt);
        throw new Error("Failed to load orders");
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load orders");

      setOrders(json.data.orders || []);
    } catch (err: any) {
      console.error("farmer dashboard load error:", err);
      // ⛔ only show UI error for *real* failures, not 404-no-profile case
      if (err?.message !== "No farmer profile") {
        setError(err.message || "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  load();
}, [user?.id]);



  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    return { totalOrders, pending, delivered, revenue };
  }, [orders]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortId = (id: string) => (id ? id.slice(-6).toUpperCase() : "");

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                My Orders Dashboard
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Track all orders placed with you, their status and payments.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right text-xs text-stone-500">
              <span>Farmer</span>
              <span className="font-semibold text-stone-800">{user.name}</span>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-stone-100 p-3 sm:p-4">
              <p className="text-xs text-stone-500">Total Orders</p>
              <p className="text-xl font-bold mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl border border-yellow-100 p-3 sm:p-4">
              <p className="text-xs text-yellow-700">Pending</p>
              <p className="text-xl font-bold mt-1 text-yellow-800">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl border border-green-100 p-3 sm:p-4">
              <p className="text-xs text-green-700">Delivered</p>
              <p className="text-xl font-bold mt-1 text-green-800">{stats.delivered}</p>
            </div>
            <div className="bg-white rounded-xl border border-blue-100 p-3 sm:p-4">
              <p className="text-xs text-blue-700">Total Revenue (₹)</p>
              <p className="text-xl font-bold mt-1 text-blue-800">
                {stats.revenue.toFixed(0)}
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
              Showing <span className="font-semibold">{filteredOrders.length}</span> of{" "}
              <span className="font-semibold">{orders.length}</span> orders
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">
                      Customer
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
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-stone-400">
                        Loading orders…
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-red-500">
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-stone-400">
                        No orders found for this filter.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-t border-stone-100 hover:bg-stone-50/60 transition"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono text-xs text-stone-600">
                            #{shortId(o.id)}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {o.source === "voice"
                              ? "Voice"
                              : o.source === "app"
                              ? "App"
                              : o.source || "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-stone-800">
                            {o.customerName || "—"}
                          </div>
                          <div className="text-xs text-stone-500">
                            {o.customerPhone || "No phone"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-700">
                          {o.itemsCount} item{o.itemsCount !== 1 ? "s" : ""}
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
                                  .map((p) => p[0].toUpperCase() + p.slice(1))
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
                              ? o.paymentStatus[0].toUpperCase() + o.paymentStatus.slice(1)
                              : "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                          {o.createdAt ? formatDate(o.createdAt) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
