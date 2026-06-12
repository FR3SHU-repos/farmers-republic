// app/farmers/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type FarmerOrder = {
  id: string;
  buyerId: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  source: string;
  createdAt: string;
  itemsCount: number;
};

type OrdersResponse = {
  orders: FarmerOrder[];
  total: number;
  totalPages: number;
  page: number;
};

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<
  string,
  { pill: string; dot: string }
> = {
  pending: {
    pill: "border-status-warning/30 bg-status-warning-surface text-status-warning",
    dot: "bg-status-warning",
  },
  confirmed: {
    pill: "border-status-info/30 bg-status-info-surface text-status-info",
    dot: "bg-status-info",
  },
  out_for_delivery: {
    pill: "border-brand/30 bg-secondary-subtle text-brand",
    dot: "bg-brand",
  },
  delivered: {
    pill: "border-status-success/30 bg-status-success-surface text-status-success",
    dot: "bg-status-success",
  },
  cancelled: {
    pill: "border-status-danger/30 bg-status-danger-surface text-status-danger",
    dot: "bg-status-danger",
  },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        s.pill
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function fmtDate(str: string) {
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function FarmerOrdersPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  // Gate: farmers only
  useEffect(() => {
    if (!userLoading && user && user.type !== "Farmer") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  // Step 1: resolve farmerId from user.id
  useEffect(() => {
    if (!user?.id || user.type !== "Farmer") return;

    fetch(`/api/v1/helper/by-profile/${encodeURIComponent(user.id)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json.data?.farmerId) {
          setFarmerId(json.data.farmerId);
        } else {
          setError("Could not find your farmer profile. Please create one first.");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load farmer profile.");
        setLoading(false);
      });
  }, [user]);

  // Step 2: fetch orders once farmerId is known
  useEffect(() => {
    if (!farmerId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          farmerId,
          page: String(page),
          limit: "20",
        });
        if (filter) params.set("status", filter);

        const res = await fetch(
          `/api/v1/farmers/dashboard/orders?${params.toString()}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.message || "Failed to load orders");
        setData(json.data);
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [farmerId, filter, page]);

  // ── Derived stats from loaded orders ──────────────────────
  const allOrders = data?.orders ?? [];
  const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
  const pendingCount = allOrders.filter((o) => o.status === "pending").length;
  const deliveredCount = allOrders.filter((o) => o.status === "delivered").length;

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-status-danger-surface">
          <Package className="h-8 w-8 text-status-danger" />
        </div>
        <p className="text-sm font-medium text-status-danger">{error}</p>
        {error.includes("create one") && (
          <Link
            href="/farmers/create"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Create Farmer Profile
          </Link>
        )}
        <Link href="/farmers/dashboard" className="text-sm text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/farmers/dashboard"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-card text-foreground-muted transition hover:text-foreground-heading"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground-heading">
                My Orders
              </h1>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Buyer orders containing your products
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary-subtle px-3 py-1.5">
            <Package className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-semibold text-secondary-foreground">
              {data?.total ?? 0} total
            </span>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: ShoppingCart,
              label: "Total Orders",
              value: data?.total ?? 0,
              iconBg: "bg-secondary-subtle",
              iconColor: "text-brand",
              valueColor: "text-foreground-heading",
            },
            {
              icon: Clock,
              label: "Pending",
              value: pendingCount,
              iconBg: "bg-status-warning-surface",
              iconColor: "text-status-warning",
              valueColor: "text-status-warning",
            },
            {
              icon: CheckCircle2,
              label: "Delivered",
              value: deliveredCount,
              iconBg: "bg-status-success-surface",
              iconColor: "text-status-success",
              valueColor: "text-status-success",
            },
            {
              icon: TrendingUp,
              label: "Revenue",
              value: `₹${totalRevenue.toLocaleString("en-IN")}`,
              iconBg: "bg-status-info-surface",
              iconColor: "text-status-info",
              valueColor: "text-status-info",
            },
          ].map(({ icon: Icon, label, value, iconBg, iconColor, valueColor }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-surface-card p-4"
            >
              <div
                className={cx(
                  "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
                  iconBg
                )}
              >
                <Icon className={cx("h-4 w-4", iconColor)} />
              </div>
              <p className={cx("text-lg font-bold", valueColor)}>{value}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Filter pills ─────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setFilter(opt.value);
                setPage(1);
              }}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                filter === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-card text-foreground-muted hover:border-primary/40 hover:text-foreground-heading"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Orders list ──────────────────────────────────── */}
        {allOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-card py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface">
              <Package className="h-8 w-8 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground-heading">
                No orders yet
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                {filter
                  ? `No ${STATUS_LABELS[filter] ?? filter} orders found`
                  : "When buyers order your products, they'll appear here"}
              </p>
            </div>
            <Link
              href="/products/create"
              className="mt-1 flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover"
            >
              <Package className="h-3.5 w-3.5" />
              Add a product
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {allOrders.map((order) => (
              <Link
                key={order.id}
                href={`/farmers/orders/${order.id}?farmerId=${encodeURIComponent(farmerId!)}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-surface-card p-5 transition hover:border-primary/30 hover:shadow-sm"
              >
                {/* Icon */}
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface">
                  <Truck className="h-5 w-5 text-brand" />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground-heading">
                        {order.customerName || "Customer"}
                      </p>
                      <StatusPill status={order.status} />
                    </div>
                    <p className="text-sm font-bold text-primary">
                      ₹{order.total.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                    <span className="font-mono">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span>·</span>
                    <span>
                      {order.itemsCount} item{order.itemsCount !== 1 ? "s" : ""}
                    </span>
                    <span>·</span>
                    <span>{fmtDate(order.createdAt)}</span>
                    {order.paymentMode === "cod" && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-status-warning">COD</span>
                      </>
                    )}
                    {order.paymentStatus === "paid" && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-status-success">Paid</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────── */}
        {data && data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-card text-foreground-muted transition hover:text-foreground-heading disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <span className="text-sm text-foreground-muted">
              Page{" "}
              <span className="font-semibold text-foreground-heading">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-foreground-heading">
                {data.totalPages}
              </span>
            </span>

            <button
              type="button"
              disabled={page >= (data?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-card text-foreground-muted transition hover:text-foreground-heading disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Also see farmer-created orders ───────────────── */}
        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground-heading">
                Voice / Phone Orders
              </p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                Orders you captured yourself via call or app
              </p>
            </div>
            <Link
              href="/orders/farmerOrders"
              className="flex items-center gap-1.5 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
