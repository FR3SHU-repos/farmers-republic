"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cx } from "@/shared/lib/utils";
import { Search, Leaf, Calendar, Users, ClipboardList } from "lucide-react";

type HarvestItem = {
  id: string;
  farmerId: string;
  farmerName?: string;
  farmerLocation?: string;
  crop: string;
  variety?: string;
  description?: string;
  expectedQty: number;
  unit: string;
  estimatedPrice: number;
  currency?: string;
  harvestDate: string;
  preBookDeadline?: string;
  minPreBookQty?: number;
  maxPreBookQty?: number;
  totalPreBooked: number;
  status: string;
  images?: string[];
  notes?: string;
};

type DateFilter = "all" | "this_week" | "next_week";

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function CountdownBadge({ harvestDate }: { harvestDate: string }) {
  const days = daysUntil(harvestDate);

  if (days < 0) {
    return (
      <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", "bg-status-success-surface text-status-success")}>
        Harvested
      </span>
    );
  }

  if (days <= 2) {
    return (
      <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", "bg-status-success-surface text-status-success")}>
        <span className="text-base leading-none">🌱</span>
        Harvests in <strong>{days}</strong> day{days !== 1 ? "s" : ""} · Ready soon
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", "bg-status-warning-surface text-status-warning")}>
        <span className="text-base leading-none">🌿</span>
        Harvests in <strong>{days}</strong> days · Coming soon
      </span>
    );
  }

  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", "bg-secondary-subtle text-foreground-muted")}>
      <span className="text-base leading-none">📅</span>
      Harvests in <strong>{days}</strong> days · Upcoming
    </span>
  );
}

function ProgressBar({ booked, total }: { booked: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (booked / total) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-border overflow-hidden">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface-card p-5 animate-pulse space-y-3">
      <div className="h-6 w-28 rounded-full bg-border" />
      <div className="h-5 w-3/4 rounded bg-border" />
      <div className="h-4 w-1/2 rounded bg-border" />
      <div className="h-4 w-full rounded bg-border" />
      <div className="h-10 w-full rounded-xl bg-border mt-2" />
    </div>
  );
}

export default function HarvestMarketplacePage() {
  const router = useRouter();
  const [harvests, setHarvests] = useState<HarvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCrop, setSearchCrop] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [debouncedCrop, setDebouncedCrop] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCrop(searchCrop), 350);
    return () => clearTimeout(t);
  }, [searchCrop]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: "open", page: "1", limit: "20" });
        if (debouncedCrop) params.set("crop", debouncedCrop);
        const res = await fetch(`/api/v1/harvests?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setHarvests(json.data.items ?? []);
        }
      } catch {
        setHarvests([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedCrop]);

  const filtered = harvests.filter((h) => {
    if (dateFilter === "all") return true;
    const days = daysUntil(h.harvestDate);
    if (dateFilter === "this_week") return days >= 0 && days <= 7;
    if (dateFilter === "next_week") return days > 7 && days <= 14;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface pb-24">
      <section className="border-b border-border bg-surface-card py-12 px-4">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand">
            <Leaf className="h-4 w-4" />
            Harvest Pre-booking
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground-heading sm:text-5xl">
            Fresh before it&apos;s harvested
          </h1>
          <p className="text-base text-foreground-muted max-w-2xl mx-auto">
            Pre-book directly from farmers. Know exactly when and where your food comes from.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/profile/prebookings"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground-heading hover:border-primary transition"
            >
              <ClipboardList className="h-4 w-4" />
              My Pre-bookings
            </Link>
            <Link
              href="/farmers/harvests"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground-heading hover:border-primary transition"
            >
              <Leaf className="h-4 w-4" />
              Farmer? Announce a harvest
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted pointer-events-none" />
            <input
              value={searchCrop}
              onChange={(e) => setSearchCrop(e.target.value)}
              placeholder="Search by crop (tomatoes, mango...)"
              className="h-11 w-full rounded-full border border-border bg-surface-card pl-11 pr-4 text-sm text-foreground-heading placeholder:text-foreground-muted outline-none focus:border-primary transition"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "this_week", "next_week"] as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={cx(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition",
                  dateFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-surface-card text-foreground-muted hover:border-primary hover:text-foreground-heading",
                )}
              >
                {f === "all" ? "All" : f === "this_week" ? "This Week" : "Next Week"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-card px-8 py-16 text-center">
            <Calendar className="mx-auto h-10 w-10 text-foreground-muted mb-3" />
            <p className="text-base font-semibold text-foreground-heading">No upcoming harvests right now.</p>
            <p className="mt-1 text-sm text-foreground-muted">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((h) => {
              const available = Math.max(0, h.expectedQty - h.totalPreBooked);
              const fullyBooked = h.status === "fully_booked" || available === 0;

              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-border bg-surface-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <CountdownBadge harvestDate={h.harvestDate} />

                  <div>
                    <h2 className="text-xl font-bold text-foreground-heading">{h.crop}</h2>
                    {h.variety && (
                      <p className="text-sm text-foreground-muted">{h.variety}</p>
                    )}
                  </div>

                  <p className="text-sm text-foreground-muted flex items-center gap-1.5">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>
                      {h.farmerName ?? "Unknown farmer"}
                      {h.farmerLocation ? ` · ${h.farmerLocation}` : ""}
                    </span>
                  </p>

                  <p className="text-2xl font-bold text-brand">
                    ₹{h.estimatedPrice}
                    <span className="text-sm font-normal text-foreground-muted"> / {h.unit}</span>
                  </p>

                  <div className="space-y-1.5">
                    <ProgressBar booked={h.totalPreBooked} total={h.expectedQty} />
                    <p className="text-xs text-foreground-muted">
                      {available} {h.unit} available · {h.totalPreBooked} pre-booked
                    </p>
                  </div>

                  <button
                    disabled={fullyBooked}
                    onClick={() => router.push(`/harvests/${h.id}`)}
                    className={cx(
                      "mt-auto w-full rounded-xl py-2.5 text-sm font-semibold transition",
                      fullyBooked
                        ? "bg-border text-foreground-muted cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    )}
                  >
                    {fullyBooked ? "Fully Booked" : "Pre-book now →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
