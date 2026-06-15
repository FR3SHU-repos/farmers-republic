// app/farmers/dashboard/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";

type FarmerOrder = {
  id: string;
  buyerId: string;
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

const STATUS_FILTERS = [
  "all",
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function FarmerOrdersDashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [farmerId, setFarmerId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        // 1️⃣ get REAL farmerId from profile
        const fRes = await fetch(`/api/v1/helper/by-profile/${user.id}`, {
          cache: "no-store",
        });

        if (fRes.status === 404) {
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

        const realFarmerId = fJson.data.farmerId as string;
        setFarmerId(realFarmerId);

        // 2️⃣ fetch orders for that farmer
        const res = await fetch(
          `/api/v1/farmers/dashboard/orders?farmerId=${encodeURIComponent(
            realFarmerId,
          )}&limit=20`,
          { cache: "no-store" },
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
        return "bg-status-warning-surface text-status-warning border-status-warning/30";
      case "confirmed":
      case "out_for_delivery":
        return "bg-status-info-surface text-status-info border-status-info/30";
      case "delivered":
        return "bg-status-success-surface text-status-success border-status-success/30";
      case "cancelled":
        return "bg-status-danger-surface text-status-danger border-status-danger/30";
      default:
        return "bg-surface text-foreground-muted border-border";
    }
  };

  const paymentBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-status-success-surface text-status-success border-status-success/30";
      case "unpaid":
        return "bg-status-danger-surface text-status-danger border-status-danger/30";
      default:
        return "bg-surface text-foreground-muted border-border";
    }
  };

  const handleRowClick = (orderId: string) => {
    if (!farmerId) return;
    router.push(
      `/farmers/orders/${encodeURIComponent(
        orderId,
      )}?farmerId=${encodeURIComponent(farmerId)}`,
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="py-8">
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground-heading sm:text-3xl">
                My Orders Dashboard
              </h1>
              <p className="mt-1 text-sm text-foreground-muted">
                Track all orders placed with you, their status and payments.
              </p>
            </div>
            <div className="hidden flex-col items-end text-right sm:flex">
              <span className="text-xs text-foreground-muted">Farmer</span>
              <span className="text-xs font-semibold text-foreground-heading">{user.name}</span>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface-card p-3 sm:p-4">
              <p className="text-xs text-foreground-muted">Total Orders</p>
              <p className="mt-1 text-xl font-bold text-foreground-heading">{stats.totalOrders}</p>
            </div>
            <div className="rounded-2xl border border-status-warning/30 bg-status-warning-surface p-3 sm:p-4">
              <p className="text-xs text-status-warning">Pending</p>
              <p className="mt-1 text-xl font-bold text-status-warning">{stats.pending}</p>
            </div>
            <div className="rounded-2xl border border-status-success/30 bg-status-success-surface p-3 sm:p-4">
              <p className="text-xs text-status-success">Delivered</p>
              <p className="mt-1 text-xl font-bold text-status-success">{stats.delivered}</p>
            </div>
            <div className="rounded-2xl border border-status-info/30 bg-status-info-surface p-3 sm:p-4">
              <p className="text-xs text-status-info">Revenue (₹)</p>
              <p className="mt-1 text-xl font-bold text-status-info">{stats.revenue.toFixed(0)}</p>
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
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-card text-foreground-body hover:bg-surface"
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

            <div className="text-xs text-foreground-muted">
              Showing{" "}
              <span className="font-semibold">{filteredOrders.length}</span> of{" "}
              <span className="font-semibold">{orders.length}</span> orders
            </div>
          </div>

          {/* Mobile card list — shown below sm */}
          <div className="sm:hidden space-y-3">
            {loading && (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {!loading && error && (
              <p className="text-center text-xs text-status-danger py-6">{error}</p>
            )}
            {!loading && !error && filteredOrders.length === 0 && (
              <p className="text-center text-xs text-foreground-muted py-6">No orders found for this filter.</p>
            )}
            {!loading && !error && filteredOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => handleRowClick(o.id)}
                className="cursor-pointer rounded-2xl border border-border bg-surface-card p-4 transition hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-foreground-muted">
                      #{shortId(o.id)}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground-heading">
                      {o.customerName || "—"}
                    </p>
                    {o.customerPhone && (
                      <p className="text-xs text-foreground-muted">{o.customerPhone}</p>
                    )}
                  </div>
                  <p className="text-base font-bold text-foreground-heading">
                    ₹{(o.total ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${statusBadgeClass(o.status)}`}>
                    {o.status ? o.status.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ") : "Unknown"}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${paymentBadgeClass(o.paymentStatus)}`}>
                    {o.paymentStatus ? o.paymentStatus[0].toUpperCase() + o.paymentStatus.slice(1) : "Unknown"}
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    {o.itemsCount} item{o.itemsCount !== 1 ? "s" : ""} · {o.createdAt ? formatDate(o.createdAt) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table — hidden on mobile */}
          <div className="hidden sm:block rounded-2xl border border-border bg-surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-surface">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                      Items
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-muted">
                      Total (₹)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-foreground-muted">
                        Loading orders…
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-status-danger">
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-foreground-muted">
                        No orders found for this filter.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => handleRowClick(o.id)}
                        className="cursor-pointer border-t border-border transition hover:bg-surface/60"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono text-xs font-semibold text-foreground-muted">
                            #{shortId(o.id)}
                          </div>
                          <div className="text-[11px] text-foreground-muted">
                            {o.source === "voice"
                              ? "Voice"
                              : o.source === "app"
                              ? "App"
                              : o.source || "Web"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-foreground-heading">
                            {o.customerName || "—"}
                          </div>
                          <div className="text-xs text-foreground-muted">
                            {o.customerPhone || "No phone"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-body">
                          {o.itemsCount} item{o.itemsCount !== 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-foreground-heading">
                          ₹{(o.total ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${statusBadgeClass(o.status)}`}>
                            {o.status
                              ? o.status.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ")
                              : "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${paymentBadgeClass(o.paymentStatus)}`}>
                            {o.paymentStatus
                              ? o.paymentStatus[0].toUpperCase() + o.paymentStatus.slice(1)
                              : "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-muted">
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
