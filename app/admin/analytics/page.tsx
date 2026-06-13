"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";

type Period = "7d" | "30d" | "90d" | "all";

interface CoreStats {
  totalOrders: number;
  gmv: number;
  revenue: number;
  cancelledCount: number;
  deliveredCount: number;
  avgOrderValue: number;
  cancellationRate: number;
  deliveryRate: number;
}

interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface UserPoint {
  date: string;
  count: number;
}

interface StatusItem {
  _id: string;
  count: number;
}

interface ProductItem {
  _id: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

interface FarmerItem {
  _id: string;
  revenue: number;
  orderCount: number;
}

interface PaymentMode {
  _id: string;
  count: number;
  total: number;
}

interface RepeatCustomers {
  total: number;
  repeat: number;
  repeatRate: number;
}

interface AnalyticsData {
  period: Period;
  core: CoreStats;
  ordersByStatus: StatusItem[];
  dailyRevenue: DailyPoint[];
  topProducts: ProductItem[];
  topFarmers: FarmerItem[];
  newUsers: UserPoint[];
  paymentModes: PaymentMode[];
  repeatCustomers: RepeatCustomers;
  totalUsers: number;
  totalFarmers: number;
  verifiedFarmers: number;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
];

const inr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const inrShort = (amount: number): string => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
};

const labelStatus = (s: string) =>
  s
    .split("_")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");

function BarChart({ data }: { data: { date: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 flex flex-col items-center gap-1 group relative"
          title={`${d.date.slice(5)}: ${inr(d.revenue)}`}
        >
          <div
            className="w-full bg-primary rounded-t-sm opacity-80 hover:opacity-100 transition-all"
            style={{ height: `${(d.revenue / max) * 100}%` }}
          />
          <span className="text-[9px] text-foreground-muted rotate-45 origin-left hidden group-hover:block absolute -bottom-4">
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 flex flex-col items-center gap-1 group relative"
          title={`${d.date.slice(5)}: ${d.count} users`}
        >
          <div
            className="w-full bg-secondary-subtle rounded-t-sm hover:bg-secondary transition-all"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
}

function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-xl font-bold text-foreground-heading">{value}</span>
      {sub && <span className="text-[11px] text-foreground-muted">{sub}</span>}
    </div>
  );
}

const statusColorClass = (status: string): string => {
  switch (status) {
    case "delivered":
      return "bg-status-success-surface text-status-success";
    case "cancelled":
      return "bg-status-danger-surface text-status-danger";
    case "pending":
      return "bg-status-warning-surface text-status-warning";
    case "confirmed":
    case "out_for_delivery":
    case "packed":
      return "bg-status-info-surface text-status-info";
    default:
      return "bg-surface text-foreground-muted";
  }
};

export default function AdminAnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && user && user.type !== "Admin") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user || user.type !== "Admin") return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/analytics/admin?period=${period}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed to load analytics");
        setData(json.data);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, user]);

  if (userLoading || !user) return null;
  if (user.type !== "Admin") return null;

  const totalOrdersFromStatus = data?.ordersByStatus.reduce(
    (s, i) => s + i.count,
    0,
  ) ?? 0;

  const newUsersCount = data?.newUsers.reduce((s, u) => s + u.count, 0) ?? 0;

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground-heading">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-foreground-muted mt-1">
              Platform-wide business intelligence overview
            </p>
          </div>

          {/* Period selector */}
          <div className="flex gap-2 p-1 bg-surface-card border border-border rounded-full w-fit">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cx(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:text-foreground-heading",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48 text-foreground-muted text-sm">
            Loading analytics…
          </div>
        )}

        {error && (
          <div className="bg-status-danger-surface text-status-danger rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Section 1: KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                label="Gross Merchandise Value"
                value={inrShort(data.core.gmv)}
                sub="Total transaction volume"
              />
              <KpiCard
                label="Revenue"
                value={inrShort(data.core.revenue)}
                sub="Delivered orders only"
              />
              <KpiCard
                label="Total Orders"
                value={data.core.totalOrders.toLocaleString("en-IN")}
                sub={`Avg ${inr(data.core.avgOrderValue)}/order`}
              />
              <KpiCard
                label="Avg Order Value"
                value={inr(data.core.avgOrderValue)}
              />
              <KpiCard
                label="Delivery Rate"
                value={`${data.core.deliveryRate}%`}
                sub={`${data.core.deliveredCount} delivered`}
              />
              <KpiCard
                label="Cancellation Rate"
                value={`${data.core.cancellationRate}%`}
                sub={`${data.core.cancelledCount} cancelled`}
              />
              <KpiCard
                label="Repeat Customer Rate"
                value={`${data.repeatCustomers.repeatRate}%`}
                sub={`${data.repeatCustomers.repeat} of ${data.repeatCustomers.total} buyers`}
              />
              <KpiCard
                label="New Users"
                value={newUsersCount.toLocaleString("en-IN")}
                sub={`${data.totalUsers} total · ${data.totalFarmers} farmers`}
              />
            </div>

            {/* Section 2: Revenue Over Time */}
            {data.dailyRevenue.length > 0 && (
              <div className="bg-surface-card border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                  Revenue Over Time
                </h2>
                <BarChart data={data.dailyRevenue} />
                <div className="flex justify-between mt-2 text-[10px] text-foreground-muted">
                  <span>{data.dailyRevenue.at(0)?.date}</span>
                  <span>{data.dailyRevenue.at(-1)?.date}</span>
                </div>
              </div>
            )}

            {/* Section 3: Orders by Status */}
            <div className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                Orders by Status
              </h2>
              <div className="space-y-3">
                {data.ordersByStatus
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((s) => (
                    <div key={s._id} className="flex items-center gap-3">
                      <span
                        className={cx(
                          "text-[11px] font-medium px-2.5 py-1 rounded-full w-32 text-center shrink-0",
                          statusColorClass(s._id),
                        )}
                      >
                        {labelStatus(s._id)}
                      </span>
                      <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-primary opacity-70"
                          style={{
                            width:
                              totalOrdersFromStatus > 0
                                ? `${(s.count / totalOrdersFromStatus) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-foreground-muted w-12 text-right shrink-0">
                        {s.count}
                      </span>
                      <span className="text-xs text-foreground-muted w-10 text-right shrink-0">
                        {totalOrdersFromStatus > 0
                          ? `${Math.round((s.count / totalOrdersFromStatus) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Section 4: Top Products & Farmers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Products */}
              <div className="bg-surface-card border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                  Top Products by Revenue
                </h2>
                {data.topProducts.length === 0 ? (
                  <p className="text-xs text-foreground-muted">No data</p>
                ) : (
                  <div className="space-y-3">
                    {data.topProducts.slice(0, 5).map((p, idx) => {
                      const maxRev = data.topProducts[0]?.revenue ?? 1;
                      return (
                        <div key={p._id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-foreground-muted w-5 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-foreground-heading truncate max-w-[140px]">
                                {p.name}
                              </span>
                              <span className="text-xs font-semibold text-brand ml-2 shrink-0">
                                {inrShort(p.revenue)}
                              </span>
                            </div>
                            <div className="bg-surface rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 bg-primary rounded-full"
                                style={{
                                  width: `${(p.revenue / maxRev) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-foreground-muted">
                              {p.unitsSold} units
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Farmers */}
              <div className="bg-surface-card border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                  Top Farmers by Revenue
                </h2>
                {data.topFarmers.length === 0 ? (
                  <p className="text-xs text-foreground-muted">No data</p>
                ) : (
                  <div className="space-y-3">
                    {data.topFarmers.slice(0, 5).map((f, idx) => {
                      const maxRev = data.topFarmers[0]?.revenue ?? 1;
                      return (
                        <div key={f._id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-foreground-muted w-5 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-foreground-heading font-mono truncate max-w-[120px]">
                                {String(f._id).slice(-8).toUpperCase()}
                              </span>
                              <span className="text-xs font-semibold text-brand ml-2 shrink-0">
                                {inrShort(f.revenue)}
                              </span>
                            </div>
                            <div className="bg-surface rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 bg-secondary rounded-full"
                                style={{
                                  width: `${(f.revenue / maxRev) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-foreground-muted">
                              {f.orderCount} order items
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Payment Mode Breakdown */}
            <div className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                Payment Mode Breakdown
              </h2>
              <div className="flex flex-wrap gap-3">
                {data.paymentModes.map((pm) => (
                  <div
                    key={pm._id}
                    className="flex flex-col gap-1 bg-surface border border-border rounded-xl px-4 py-3 min-w-[120px]"
                  >
                    <span className="text-xs font-semibold text-foreground-heading uppercase tracking-wide">
                      {pm._id || "Unknown"}
                    </span>
                    <span className="text-lg font-bold text-brand">
                      {pm.count}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      {inrShort(pm.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6: User Growth */}
            {data.newUsers.length > 0 && (
              <div className="bg-surface-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground-heading">
                    New User Registrations
                  </h2>
                  <span className="text-sm font-bold text-brand">
                    {newUsersCount} new
                  </span>
                </div>
                <MiniBarChart data={data.newUsers} />
                <div className="flex justify-between mt-2 text-[10px] text-foreground-muted">
                  <span>{data.newUsers.at(0)?.date}</span>
                  <span>{data.newUsers.at(-1)?.date}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="text-base font-bold text-foreground-heading">
                      {data.totalUsers.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-foreground-muted">
                      Total Users
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-foreground-heading">
                      {data.totalFarmers.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-foreground-muted">
                      Total Farmers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-status-success">
                      {data.verifiedFarmers.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-foreground-muted">
                      Verified Farmers
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
