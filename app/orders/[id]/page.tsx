"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, Package, ShoppingBag, Wallet } from "lucide-react";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";

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

const STATUS_FILTERS = [
  "all",
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function statusBadgeClass(status: string) {
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
}

function paymentBadgeClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-status-success-surface text-status-success border-status-success/30";
    case "unpaid":
      return "bg-status-danger-surface text-status-danger border-status-danger/30";
    default:
      return "bg-surface text-foreground-muted border-border";
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id?: string) {
  return id ? id.slice(-6).toUpperCase() : "";
}

function labelFor(s: string) {
  return s
    .split("_")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

export default function BuyerOrdersPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

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
          `/api/v1/farmers/orders/voice/buyerOrders?buyerId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json?.success)
          throw new Error(json?.message || "Failed to load orders");
        const data: OrdersResponse = json.data;
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    if (!userLoading && user?.id) load();
  }, [user?.id, userLoading]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    spent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
  }), [orders]);

  if (!user && !userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShoppingBag className="mx-auto h-12 w-12 text-brand" />
          <p className="text-sm text-foreground-muted">
            You need to log in to see your orders.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <main className="py-8">
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground-heading sm:text-3xl">
                My Orders
              </h1>
              <p className="mt-1 text-sm text-foreground-muted">
                Track all orders you have placed.
              </p>
            </div>
            {user && (
              <div className="hidden flex-col items-end text-right sm:flex">
                <span className="text-xs text-foreground-muted">Buyer</span>
                <span className="text-sm font-semibold text-foreground-heading">
                  {user.name || user.email}
                </span>
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: Package,
                label: "Total Orders",
                value: stats.total,
                cls: "text-brand",
                iconBg: "bg-surface",
              },
              {
                icon: Clock,
                label: "Pending",
                value: stats.pending,
                cls: "text-status-warning",
                iconBg: "bg-status-warning-surface",
              },
              {
                icon: BadgeCheck,
                label: "Delivered",
                value: stats.delivered,
                cls: "text-status-success",
                iconBg: "bg-status-success-surface",
              },
              {
                icon: Wallet,
                label: "Total Spent",
                value: `₹${stats.spent.toFixed(0)}`,
                cls: "text-status-info",
                iconBg: "bg-status-info-surface",
              },
            ].map(({ icon: Icon, label, value, cls, iconBg }) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-surface-card p-4"
              >
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className={`h-4.5 w-4.5 ${cls}`} />
                </div>
                <p className={`text-xl font-bold ${cls}`}>{loading ? "—" : value}</p>
                <p className="mt-0.5 text-xs text-foreground-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    statusFilter === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-card text-foreground-body hover:bg-surface"
                  }`}
                >
                  {s === "all" ? "All" : labelFor(s)}
                </button>
              ))}
            </div>
            <p className="text-xs text-foreground-muted">
              Showing{" "}
              <span className="font-semibold text-foreground-body">
                {filteredOrders.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground-body">
                {orders.length}
              </span>{" "}
              orders
            </p>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    {["Order", "Items", "Total (₹)", "Status", "Payment", "Placed"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-semibold text-foreground-muted ${
                            i === 2 ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-foreground-muted"
                      >
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-[2.5px] border-primary border-t-transparent" />
                        Loading your orders…
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-status-danger"
                      >
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-tertiary-foreground" />
                        <p className="text-sm text-foreground-muted">
                          {statusFilter === "all"
                            ? "You haven't placed any orders yet."
                            : `No ${labelFor(statusFilter).toLowerCase()} orders.`}
                        </p>
                        <Link
                          href="/shop"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          Start shopping
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
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
                          onClick={() => router.push(`/orders/details/${o._id}`)}
                          className="cursor-pointer border-t border-border transition hover:bg-surface/60"
                        >
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs font-semibold text-foreground-heading">
                              #{shortId(o._id)}
                            </p>
                            <p className="text-[11px] text-foreground-muted capitalize">
                              {o.source || "web"}
                            </p>
                          </td>
                          <td className="max-w-xs px-4 py-3 text-xs text-foreground-body">
                            {itemsSummary}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-foreground-heading">
                            ₹{(o.total ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(
                                o.status
                              )}`}
                            >
                              {o.status ? labelFor(o.status) : "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paymentBadgeClass(
                                o.paymentStatus
                              )}`}
                            >
                              {o.paymentStatus
                                ? o.paymentStatus[0].toUpperCase() +
                                  o.paymentStatus.slice(1)
                                : "Unknown"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground-muted">
                            {formatDate(o.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Continue shopping
          </Link>
        </div>
      </main>
    </div>
  );
}
