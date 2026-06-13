"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import {
  Users,
  Sprout,
  IndianRupee,
  AlertCircle,
  Package,
  ShoppingBag,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

type Stats = {
  totalUsers: number;
  totalFarmers: number;
  totalOrders: number;
  totalProducts: number;
  pendingKYC: number;
  gmv: number;
  aov: number;
};

type OrderStatus = { status: string; count: number };
type RecentOrder = { id: string; buyerName: string; total: number; status: string; createdAt: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-status-warning-surface text-status-warning",
  confirmed: "bg-status-info-surface text-status-info",
  out_for_delivery: "bg-status-info-surface text-status-info",
  delivered: "bg-status-success-surface text-status-success",
  cancelled: "bg-status-danger-surface text-status-danger",
  returned: "bg-status-danger-surface text-status-danger",
};

function statusBadge(status: string) {
  return cx(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    STATUS_COLORS[status] ?? "bg-secondary-subtle text-foreground-muted",
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<OrderStatus[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.type !== "Admin") {
      router.replace("/");
      return;
    }

    fetch("/api/v1/admin/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setStats(json.data.stats);
          setOrdersByStatus(json.data.ordersByStatus ?? []);
          setRecentOrders(json.data.recentOrders ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32 text-foreground-muted text-sm">
        Loading dashboard…
      </div>
    );
  }

  if (!stats) return null;

  const maxStatusCount = Math.max(...ordersByStatus.map((s) => s.count), 1);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground-heading">Admin Dashboard</h1>
          <p className="text-sm text-foreground-muted mt-1">{today}</p>
        </div>
      </div>

      {stats.pendingKYC > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-status-warning bg-status-warning-surface px-4 py-3 text-sm text-status-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            {stats.pendingKYC} farmer{stats.pendingKYC > 1 ? "s" : ""} waiting for KYC verification
          </span>
          <Link
            href="/admin/farmers?kycStatus=submitted"
            className="ml-auto font-semibold underline underline-offset-2 hover:opacity-80"
          >
            Review now →
          </Link>
        </div>
      )}

      {/* Primary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-brand" },
          { label: "Total Farmers", value: stats.totalFarmers, icon: Sprout, color: "text-brand" },
          {
            label: "Gross GMV",
            value: `₹${formatCurrency(stats.gmv)}`,
            icon: IndianRupee,
            color: "text-status-success",
          },
          {
            label: "Pending KYC",
            value: stats.pendingKYC,
            icon: AlertCircle,
            color: stats.pendingKYC > 0 ? "text-status-warning" : "text-foreground-muted",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-surface-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground-muted">{card.label}</p>
              <card.icon className={cx("h-5 w-5", card.color)} />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground-heading">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Orders", value: stats.totalOrders, icon: Package },
          { label: "Active Products", value: stats.totalProducts, icon: ShoppingBag },
          { label: "Avg Order Value", value: `₹${formatCurrency(stats.aov)}`, icon: IndianRupee },
          { label: "Analytics", value: "View →", icon: BarChart3, href: "/admin/analytics" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-surface-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground-muted">{card.label}</p>
              <card.icon className="h-5 w-5 text-foreground-muted" />
            </div>
            {card.href ? (
              <Link
                href={card.href}
                className="mt-3 block text-xl font-bold text-brand hover:underline"
              >
                {card.value}
              </Link>
            ) : (
              <p className="mt-3 text-2xl font-bold text-foreground-heading">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground-heading">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-brand hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left text-xs font-medium text-foreground-muted">Buyer</th>
                  <th className="pb-2 text-right text-xs font-medium text-foreground-muted">Total</th>
                  <th className="pb-2 text-left text-xs font-medium text-foreground-muted pl-3">Status</th>
                  <th className="pb-2 text-right text-xs font-medium text-foreground-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-foreground-muted">
                      No orders yet
                    </td>
                  </tr>
                )}
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 text-foreground-heading font-medium truncate max-w-[120px]">
                      {o.buyerName}
                    </td>
                    <td className="py-2.5 text-right text-foreground-heading">₹{formatCurrency(o.total)}</td>
                    <td className="py-2.5 pl-3">
                      <span className={statusBadge(o.status)}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-xs text-foreground-muted whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by status */}
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="font-semibold text-foreground-heading mb-4">Orders by Status</h2>
          {ordersByStatus.length === 0 ? (
            <p className="text-xs text-foreground-muted py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {ordersByStatus.map((s) => (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="capitalize text-foreground-heading">{s.status.replace(/_/g, " ")}</span>
                    <span className="font-medium text-foreground-muted">{s.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.round((s.count / maxStatusCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
