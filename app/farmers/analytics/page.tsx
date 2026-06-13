"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";

type Period = "7d" | "30d" | "90d" | "all";

interface CoreStats {
  totalRevenue: number;
  totalUnitsSold: number;
  orderCount: number;
  avgRevenuePerOrder: number;
}

interface DailyPoint {
  date: string;
  revenue: number;
  units: number;
}

interface ProductItem {
  _id: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

interface StatusItem {
  _id: string;
  count: number;
}

interface FarmerInfo {
  name: string;
  farmName?: string;
  location: string;
  rating: number;
}

interface AnalyticsData {
  period: Period;
  farmer: FarmerInfo | null;
  core: CoreStats;
  topProducts: ProductItem[];
  dailyRevenue: DailyPoint[];
  orderStatusBreakdown: StatusItem[];
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

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="text-yellow-400 text-base">★</span>
      ))}
      {half && <span className="text-yellow-300 text-base">★</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="text-foreground-muted text-base opacity-30">★</span>
      ))}
      <span className="text-xs text-foreground-muted ml-1">{rating.toFixed(1)}</span>
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

export default function FarmerAnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("30d");
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && user && user.type !== "Farmer") {
      router.replace("/farmers");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user?.id || user.type !== "Farmer") return;

    const resolveFarmerId = async () => {
      try {
        const res = await fetch(`/api/v1/farmers?profileId=${encodeURIComponent(user.id)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json.success && json.data?.farmerId) {
          setFarmerId(json.data.farmerId);
        }
      } catch {
        setError("Could not load your farmer profile.");
      }
    };

    resolveFarmerId();
  }, [user?.id, user?.type]);

  useEffect(() => {
    if (!farmerId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/analytics/farmer?farmerId=${encodeURIComponent(farmerId)}&period=${period}`,
          { cache: "no-store" },
        );
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
  }, [farmerId, period]);

  if (userLoading || !user) return null;
  if (user.type !== "Farmer") return null;

  const totalStatusCount =
    data?.orderStatusBreakdown.reduce((s, i) => s + i.count, 0) ?? 0;

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground-heading">
              My Analytics
            </h1>
            <p className="text-sm text-foreground-muted mt-1">
              Sales, revenue, and product performance for your farm
            </p>
          </div>

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

        {!farmerId && !loading && !error && (
          <div className="bg-status-warning-surface text-status-warning rounded-2xl p-4 text-sm">
            No farmer profile found for your account.
          </div>
        )}

        {!loading && data && (
          <>
            {/* Section 1: KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-card border border-border rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-foreground-muted">Total Revenue</span>
                <span className="text-xl font-bold text-foreground-heading">
                  {inrShort(data.core.totalRevenue)}
                </span>
                <span className="text-[11px] text-foreground-muted">Delivered orders</span>
              </div>
              <div className="bg-surface-card border border-border rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-foreground-muted">Units Sold</span>
                <span className="text-xl font-bold text-foreground-heading">
                  {data.core.totalUnitsSold.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-surface-card border border-border rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-foreground-muted">Orders</span>
                <span className="text-xl font-bold text-foreground-heading">
                  {data.core.orderCount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-surface-card border border-border rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs text-foreground-muted">Avg. Revenue / Order</span>
                <span className="text-xl font-bold text-foreground-heading">
                  {inrShort(data.core.avgRevenuePerOrder)}
                </span>
              </div>
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

            {/* Section 3: Top Products */}
            <div className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                Top Products
              </h2>
              {data.topProducts.length === 0 ? (
                <p className="text-xs text-foreground-muted">No sales data for this period.</p>
              ) : (
                <div className="space-y-4">
                  {data.topProducts.map((p, idx) => {
                    const maxRev = data.topProducts[0]?.revenue ?? 1;
                    return (
                      <div key={p._id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground-muted w-5 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground-heading truncate max-w-[180px]">
                              {p.name}
                            </span>
                            <span className="text-sm font-bold text-brand ml-2 shrink-0">
                              {inr(p.revenue)}
                            </span>
                          </div>
                          <div className="bg-surface rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 bg-primary rounded-full"
                              style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-foreground-muted">
                            {p.unitsSold} units sold
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 4: Orders by Status */}
            <div className="bg-surface-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                Orders by Status
              </h2>
              {data.orderStatusBreakdown.length === 0 ? (
                <p className="text-xs text-foreground-muted">No order data for this period.</p>
              ) : (
                <div className="space-y-3">
                  {data.orderStatusBreakdown
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
                                totalStatusCount > 0
                                  ? `${(s.count / totalStatusCount) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                        <span className="text-xs text-foreground-muted w-12 text-right shrink-0">
                          {s.count}
                        </span>
                        <span className="text-xs text-foreground-muted w-10 text-right shrink-0">
                          {totalStatusCount > 0
                            ? `${Math.round((s.count / totalStatusCount) * 100)}%`
                            : "0%"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Section 5: Performance Summary */}
            {data.farmer && (
              <div className="bg-surface-card border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-foreground-heading mb-4">
                  Your Farm at a Glance
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-foreground-muted">Rating</span>
                    <StarRating rating={data.farmer.rating} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-foreground-muted">Location</span>
                    <span className="text-sm font-medium text-foreground-heading">
                      {data.farmer.location || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-foreground-muted">Farm Name</span>
                    <span className="text-sm font-medium text-foreground-heading">
                      {data.farmer.farmName || data.farmer.name || "—"}
                    </span>
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
