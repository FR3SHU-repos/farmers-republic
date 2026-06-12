"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CheckCheck,
  Clock,
  MapPin,
  Package,
  Phone,
  Truck,
  Wallet,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;
  status?: string;
};

type DeliveryOrder = {
  _id: string;
  buyerName?: string;
  buyerPhone?: string;
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
};

type StatusFilter = "all" | "pending" | "confirmed" | "out_for_delivery";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "out_for_delivery", label: "Out for Delivery" },
];

// ─── Helpers ─────────────────────────────────────────────────

function statusBadgeClass(s: string) {
  switch (s) {
    case "pending":
      return "bg-status-warning-surface text-status-warning border-status-warning/30";
    case "confirmed":
      return "bg-status-info-surface text-status-info border-status-info/30";
    case "out_for_delivery":
      return "bg-secondary-subtle text-secondary-foreground border-secondary/40";
    case "delivered":
      return "bg-status-success-surface text-status-success border-status-success/30";
    default:
      return "bg-surface text-foreground-muted border-border";
  }
}

function paymentBadgeClass(mode: string, pStatus: string) {
  if (mode === "cod" && pStatus !== "paid")
    return "bg-status-warning-surface text-status-warning border-status-warning/30";
  if (pStatus === "paid")
    return "bg-status-success-surface text-status-success border-status-success/30";
  return "bg-surface text-foreground-muted border-border";
}

function labelFor(s: string) {
  return s.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────

export default function DeliveryDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  // Gate: only delivery persons
  useEffect(() => {
    if (!userLoading && user && user.type !== "Logistics Provider") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/v1/delivery/orders${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load");
      setOrders(json.data.orders || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user?.type === "Logistics Provider") fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, filter]);

  // Quick status update from card
  const quickUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const order = orders.find((o) => o._id === orderId);
      const extra: Record<string, unknown> = {};
      if (newStatus === "out_for_delivery" && user) {
        extra.deliveryPersonId = user.id;
        extra.deliveryPersonName = user.name || user.email;
        extra.deliveryEarning = (order?.deliveryFee ?? 0) > 0 ? order!.deliveryFee : 30;
      }

      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err?.message || "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    outForDelivery: orders.filter((o) => o.status === "out_for_delivery").length,
    cod: orders.filter((o) => o.paymentMode === "cod" && o.paymentStatus !== "paid").length,
  }), [orders]);

  if (!user && !userLoading) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-subtle">
              <Truck className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground-heading">
                My Deliveries
              </h1>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {user?.name && `Hey ${user.name} · `}Orders ready to be picked up
              </p>
            </div>
          </div>
          <Link
            href="/delivery/earnings"
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-card px-3.5 py-2 text-xs font-semibold text-foreground-body transition hover:bg-surface"
          >
            <Wallet className="h-3.5 w-3.5 text-brand" />
            My Earnings
          </Link>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Package, label: "Total", value: stats.total, color: "text-brand", bg: "bg-secondary-subtle" },
            { icon: Clock, label: "Pending", value: stats.pending, color: "text-status-warning", bg: "bg-status-warning-surface" },
            { icon: Truck, label: "In Transit", value: stats.outForDelivery, color: "text-status-info", bg: "bg-status-info-surface" },
            { icon: Wallet, label: "COD to Collect", value: stats.cod, color: "text-status-danger", bg: "bg-status-danger-surface" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface-card p-4">
              <div className={cx("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", bg)}>
                <Icon className={cx("h-4 w-4", color)} />
              </div>
              <p className={cx("text-xl font-bold", color)}>{loading ? "—" : value}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                filter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-card text-foreground-body hover:bg-surface"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-status-danger/30 bg-status-danger-surface p-5 text-sm text-status-danger">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface">
              <CheckCheck className="h-8 w-8 text-brand" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground-body">No orders to deliver right now</p>
            <p className="mt-1 text-xs text-foreground-muted">Check back soon — new orders will appear here.</p>
          </div>
        )}

        {/* Order cards */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
              const isCodUnpaid = order.paymentMode === "cod" && order.paymentStatus !== "paid";
              const isUpdating = updating === order._id;

              return (
                <div
                  key={order._id}
                  className="rounded-2xl border border-border bg-surface-card transition hover:shadow-sm"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                      <p className="font-mono text-xs font-semibold text-foreground-muted">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className={cx(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        statusBadgeClass(order.status)
                      )}>
                        {labelFor(order.status)}
                      </span>
                      {isCodUnpaid && (
                        <span className={cx(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          paymentBadgeClass(order.paymentMode, order.paymentStatus)
                        )}>
                          <Wallet className="h-3 w-3" />
                          COD
                        </span>
                      )}
                      {order.paymentStatus === "paid" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-status-success/30 bg-status-success-surface px-2.5 py-1 text-[11px] font-semibold text-status-success">
                          <BadgeCheck className="h-3 w-3" />
                          Paid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Buyer info */}
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground-heading">
                          {order.buyerName || "Buyer"}
                        </p>
                        {order.buyerPhone && (
                          <a
                            href={`tel:${order.buyerPhone}`}
                            className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary transition hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {order.buyerPhone}
                          </a>
                        )}
                        {order.buyerEmail && (
                          <p className="mt-0.5 truncate text-xs text-foreground-muted">
                            {order.buyerEmail}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-bold text-foreground-heading">
                          ₹{order.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Items summary */}
                    <div className="mt-3 space-y-1.5">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-foreground-muted">
                          <Package className="h-3.5 w-3.5 flex-shrink-0 text-brand" />
                          <span className="truncate font-medium text-foreground-body">
                            {item.name}
                          </span>
                          <span className="flex-shrink-0">× {item.qty}</span>
                          <span className="flex-shrink-0 text-foreground-muted">
                            ₹{(item.price * item.qty).toFixed(0)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-foreground-muted">
                          +{order.items.length - 3} more item{order.items.length - 3 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {isCodUnpaid && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-status-warning/30 bg-status-warning-surface px-3.5 py-2.5">
                        <Wallet className="h-4 w-4 flex-shrink-0 text-status-warning" />
                        <p className="text-xs font-semibold text-status-warning">
                          Collect ₹{order.total.toFixed(2)} cash on delivery
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 border-t border-border px-5 py-3">
                    <Link
                      href={`/delivery/${order._id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:underline"
                    >
                      View full details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <div className="ml-auto flex gap-2">
                      {order.status === "confirmed" && (
                        <button
                          disabled={isUpdating}
                          onClick={() => quickUpdate(order._id, "out_for_delivery")}
                          className="flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary-subtle px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/30 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                          ) : (
                            <Truck className="h-3.5 w-3.5" />
                          )}
                          Pick up
                        </button>
                      )}
                      {order.status === "out_for_delivery" && (
                        <button
                          disabled={isUpdating}
                          onClick={() => quickUpdate(order._id, "delivered")}
                          className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          ) : (
                            <CheckCheck className="h-3.5 w-3.5" />
                          )}
                          Mark delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
