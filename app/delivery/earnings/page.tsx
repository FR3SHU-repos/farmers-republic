"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCheck,
  CreditCard,
  IndianRupee,
  Package,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type DailyPoint = { date: string; earning: number };

type DeliveredOrder = {
  _id: string;
  buyerName: string;
  total: number;
  deliveryFee: number;
  deliveryEarning: number;
  paymentMode: string;
  paymentStatus: string;
  itemCount: number;
  deliveredAt: string;
};

type EarningsData = {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalDeliveries: number;
  daily: DailyPoint[];
  orders: DeliveredOrder[];
};

// ─── Helpers ─────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ─── Mini CSS bar chart ───────────────────────────────────────

function EarningsChart({ daily }: { daily: DailyPoint[] }) {
  const max = Math.max(...daily.map((d) => d.earning), 1);
  // Show only last 14 days on mobile-friendly view
  const visible = daily.slice(-14);

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {visible.map((pt) => {
          const pct = (pt.earning / max) * 100;
          const hasEarning = pt.earning > 0;
          return (
            <div
              key={pt.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${fmtDay(pt.date)}: ₹${pt.earning}`}
            >
              <div
                className={cx(
                  "w-full rounded-t-sm transition-all",
                  hasEarning ? "bg-primary" : "bg-surface"
                )}
                style={{ height: `${Math.max(pct, hasEarning ? 4 : 2)}%` }}
              />
              {/* tooltip */}
              {hasEarning && (
                <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded-lg border border-border bg-surface-card px-2 py-1 text-[10px] font-semibold text-foreground-heading shadow-sm group-hover:block whitespace-nowrap">
                  ₹{pt.earning}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* X-axis labels — show every ~3rd */}
      <div className="mt-1.5 flex items-center gap-1">
        {visible.map((pt, i) => (
          <div key={pt.date} className="flex-1 text-center">
            {i % 3 === 0 && (
              <span className="text-[9px] text-foreground-muted">{fmtDay(pt.date).split(" ")[0]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function DeliveryEarningsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gate
  useEffect(() => {
    if (!userLoading && user && user.type !== "Logistics Provider") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetch_ = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/delivery/earnings?deliveryPersonId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed");
        setData(json.data);
      } catch (err: any) {
        setError(err?.message || "Failed to load earnings");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading && user?.type === "Logistics Provider") fetch_();
  }, [user, userLoading]);

  // ── Loading ──────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-sm text-status-danger">{error}</p>
        <Link href="/delivery" className="text-sm text-primary hover:underline">
          Back to deliveries
        </Link>
      </div>
    );
  }

  const avgPerDelivery =
    data.totalDeliveries > 0
      ? (data.totalEarnings / data.totalDeliveries).toFixed(2)
      : "0.00";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/delivery"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-card text-foreground-muted transition hover:text-foreground-heading"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground-heading">
                My Earnings
              </h1>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {user?.name && `${user.name} · `}Delivery person earnings overview
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary-subtle px-3 py-1.5">
            <Truck className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-semibold text-secondary-foreground">
              {data.totalDeliveries} delivered
            </span>
          </div>
        </div>

        {/* ── Hero earning ──────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
            Total lifetime earnings
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <IndianRupee className="h-7 w-7 text-primary" strokeWidth={2.5} />
            <span className="text-5xl font-extrabold text-primary">
              {data.totalEarnings.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            Avg ₹{avgPerDelivery} per delivery
          </p>

          {/* Progress bar — monthly vs total */}
          {data.totalEarnings > 0 && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-foreground-muted">
                <span>This month</span>
                <span>₹{data.monthEarnings.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (data.monthEarnings / data.totalEarnings) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Stat cards ────────────────────────────────── */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: CalendarDays,
              label: "Today",
              value: `₹${data.todayEarnings.toLocaleString("en-IN")}`,
              color: "text-status-info",
              bg: "bg-status-info-surface",
            },
            {
              icon: TrendingUp,
              label: "This week",
              value: `₹${data.weekEarnings.toLocaleString("en-IN")}`,
              color: "text-brand",
              bg: "bg-secondary-subtle",
            },
            {
              icon: Wallet,
              label: "This month",
              value: `₹${data.monthEarnings.toLocaleString("en-IN")}`,
              color: "text-status-success",
              bg: "bg-status-success-surface",
            },
            {
              icon: CheckCheck,
              label: "Deliveries",
              value: data.totalDeliveries,
              color: "text-status-warning",
              bg: "bg-status-warning-surface",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface-card p-4">
              <div className={cx("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", bg)}>
                <Icon className={cx("h-4 w-4", color)} />
              </div>
              <p className={cx("text-lg font-bold", color)}>{value}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* ── 14-day chart ──────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <TrendingUp className="h-3.5 w-3.5 text-brand" />
            </div>
            Last 14 days
          </h2>
          {data.daily.every((d) => d.earning === 0) ? (
            <div className="flex h-28 items-center justify-center text-sm text-foreground-muted">
              No deliveries in the last 14 days
            </div>
          ) : (
            <EarningsChart daily={data.daily} />
          )}
        </div>

        {/* ── Delivery history ──────────────────────────── */}
        <div className="rounded-2xl border border-border bg-surface-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground-heading">
              Delivery History
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              All completed deliveries and earnings
            </p>
          </div>

          {data.orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-surface">
                <Package className="h-7 w-7 text-brand" />
              </div>
              <p className="text-sm font-medium text-foreground-body">
                No deliveries completed yet
              </p>
              <p className="text-xs text-foreground-muted">
                Start delivering to see your earnings here.
              </p>
              <Link
                href="/delivery"
                className="mt-1 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover"
              >
                <Truck className="h-3.5 w-3.5" />
                View available deliveries
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.orders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-start gap-4 px-5 py-4 transition hover:bg-surface/60"
                >
                  {/* Earning amount */}
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-status-success-surface">
                    <IndianRupee className="h-4 w-4 text-status-success" />
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground-heading">
                          {order.buyerName}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-muted">
                          {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} ·{" "}
                          Order ₹{order.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-base font-bold text-status-success">
                          +₹{order.deliveryEarning.toFixed(2)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-foreground-muted">
                          earned
                        </p>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-status-success/30 bg-status-success-surface px-2 py-0.5 text-[10px] font-semibold text-status-success">
                        <CheckCheck className="h-3 w-3" />
                        Delivered
                      </span>

                      <span className={cx(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        order.paymentStatus === "paid"
                          ? "border-status-success/30 bg-status-success-surface text-status-success"
                          : "border-status-warning/30 bg-status-warning-surface text-status-warning"
                      )}>
                        {order.paymentMode === "cod" ? (
                          <Wallet className="h-3 w-3" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        {order.paymentMode.toUpperCase()}
                        {order.paymentStatus === "paid" ? (
                          <BadgeCheck className="h-3 w-3" />
                        ) : null}
                      </span>

                      <span className="text-[10px] text-foreground-muted">
                        {fmtDate(order.deliveredAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earnings note */}
        <p className="mt-4 text-center text-[11px] text-foreground-muted">
          Earnings = delivery fee collected per order (min ₹30 for free-delivery orders).
          Payments are settled weekly.
        </p>
      </div>
    </div>
  );
}
