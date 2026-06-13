"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import { ArrowLeft, Leaf, Calendar, Package } from "lucide-react";

type PreBookItem = {
  id: string;
  harvestId: string;
  cropName?: string;
  harvestDate?: string;
  qty: number;
  unit?: string;
  priceAtBooking: number;
  estimatedTotal: number;
  status: string;
  note?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-status-warning-surface text-status-warning",
  confirmed: "bg-status-success-surface text-status-success",
  fulfilled: "bg-secondary-subtle text-foreground-muted",
  cancelled: "bg-status-danger-surface text-status-danger",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[status] ?? "bg-secondary-subtle text-foreground-muted")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function MyPreBookingsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<PreBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/prebookings?buyerId=${encodeURIComponent(user.id)}`);
        const json = await res.json();
        if (json.success) setItems(json.data.items ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const filtered = statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    confirmed: items.filter((i) => i.status === "confirmed").length,
    fulfilled: items.filter((i) => i.status === "fulfilled").length,
    cancelled: items.filter((i) => i.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-4xl px-4 pt-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/harvests"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground-heading transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Harvests
          </Link>
          <span className="text-foreground-muted">/</span>
          <h1 className="text-xl font-bold text-foreground-heading">My Pre-bookings</h1>
        </div>

        {/* Summary stats */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.all, cls: "border-border" },
              { label: "Pending", value: counts.pending, cls: "border-status-warning" },
              { label: "Confirmed", value: counts.confirmed, cls: "border-status-success" },
              { label: "Fulfilled", value: counts.fulfilled, cls: "border-border" },
            ].map((s) => (
              <div key={s.label} className={cx("rounded-2xl border bg-surface-card p-4", s.cls)}>
                <p className="text-xs text-foreground-muted">{s.label}</p>
                <p className="text-2xl font-bold text-foreground-heading mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {!loading && items.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "confirmed", "fulfilled", "cancelled"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={cx(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition capitalize",
                  statusFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-surface-card text-foreground-muted hover:border-primary hover:text-foreground-heading",
                )}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]}
                <span className="ml-1 opacity-60">({counts[f]})</span>
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface-card p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-card px-8 py-16 text-center space-y-3">
            <Package className="mx-auto h-10 w-10 text-foreground-muted" />
            <p className="font-semibold text-foreground-heading">
              {items.length === 0 ? "No pre-bookings yet." : `No ${statusFilter} pre-bookings.`}
            </p>
            <p className="text-sm text-foreground-muted">
              {items.length === 0
                ? "Browse upcoming harvests and pre-book directly from farmers."
                : undefined}
            </p>
            {items.length === 0 && (
              <Link
                href="/harvests"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition mt-2"
              >
                <Leaf className="h-4 w-4" />
                Browse Harvests
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-surface-card p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-foreground-heading text-lg">
                      {item.cropName ?? "Crop"}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>

                  {item.harvestDate && (
                    <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      Harvest: {new Date(item.harvestDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}

                  <p className="text-sm text-foreground-muted">
                    {item.qty} {item.unit} · ₹{item.priceAtBooking}/{item.unit}
                  </p>

                  {item.note && (
                    <p className="text-xs text-foreground-muted italic">&ldquo;{item.note}&rdquo;</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="text-xl font-bold text-brand">₹{item.estimatedTotal.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-foreground-muted">
                    Booked {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <Link
                    href={`/harvests/${item.harvestId}`}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    View harvest →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
