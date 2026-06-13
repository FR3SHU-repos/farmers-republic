"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/shared/context/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cx } from "@/shared/lib/utils";
import { ArrowLeft, Plus, Eye, Edit, CheckCircle, Filter } from "lucide-react";

type HarvestItem = {
  id: string;
  crop: string;
  variety?: string;
  harvestDate: string;
  expectedQty: number;
  unit: string;
  estimatedPrice: number;
  totalPreBooked: number;
  status: string;
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-status-success-surface text-status-success",
    fully_booked: "bg-status-warning-surface text-status-warning",
    harvested: "bg-secondary-subtle text-foreground-muted",
    cancelled: "bg-status-danger-surface text-status-danger",
    draft: "bg-secondary-subtle text-foreground-muted",
  };
  const label: Record<string, string> = {
    open: "Open",
    fully_booked: "Fully Booked",
    harvested: "Harvested",
    cancelled: "Cancelled",
    draft: "Draft",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", map[status] ?? "bg-secondary-subtle text-foreground-muted")}>
      {label[status] ?? status}
    </span>
  );
}

function ProgressBar({ booked, total }: { booked: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (booked / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FarmerHarvestsPage() {
  const { user } = useUser();
  const router = useRouter();

  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [harvests, setHarvests] = useState<HarvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const fRes = await fetch(`/api/v1/farmers?profileId=${encodeURIComponent(user.id)}`);
        const fJson = await fRes.json();
        if (!fJson.success || !fJson.data?.farmerId) {
          toast.error("Farmer profile not found");
          return;
        }

        const fid = fJson.data.farmerId as string;
        setFarmerId(fid);

        const hRes = await fetch(`/api/v1/harvests?farmerId=${encodeURIComponent(fid)}&status=&limit=50`);
        const hJson = await hRes.json();

        if (hJson.success) {
          setHarvests(hJson.data.items ?? []);
        }
      } catch {
        toast.error("Failed to load harvests");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const handleMarkHarvested = async (harvestId: string) => {
    setMarkingId(harvestId);
    try {
      const res = await fetch(`/api/v1/harvests/${harvestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "harvested" }),
      });
      const json = await res.json();
      if (json.success) {
        setHarvests((prev) => prev.map((h) => h.id === harvestId ? { ...h, status: "harvested" } : h));
        toast.success("Marked as harvested");
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setMarkingId(null);
    }
  };

  const stats = {
    open: harvests.filter((h) => h.status === "open").length,
    fully_booked: harvests.filter((h) => h.status === "fully_booked").length,
    harvested: harvests.filter((h) => h.status === "harvested").length,
    totalPreBookings: harvests.reduce((sum, h) => sum + (h.totalPreBooked ?? 0), 0),
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-5xl px-4 pt-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/farmers"
              className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground-heading transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Farmers
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="text-2xl font-bold text-foreground-heading">My Harvests</h1>
          </div>
          <Link
            href="/farmers/harvests/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Announce Harvest
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Open", value: stats.open, cls: "border-primary" },
            { label: "Fully Booked", value: stats.fully_booked, cls: "border-status-warning" },
            { label: "Harvested", value: stats.harvested, cls: "border-border" },
            { label: "Total Pre-bookings", value: stats.totalPreBookings, cls: "border-border" },
          ].map((s) => (
            <div key={s.label} className={cx("rounded-2xl border bg-surface-card p-4", s.cls)}>
              <p className="text-xs text-foreground-muted">{s.label}</p>
              <p className="text-2xl font-bold text-foreground-heading mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Status filter */}
        {!loading && harvests.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-foreground-muted flex-shrink-0" />
            {[
              { value: "all", label: "All" },
              { value: "draft", label: "Draft" },
              { value: "open", label: "Open" },
              { value: "fully_booked", label: "Fully Booked" },
              { value: "harvested", label: "Harvested" },
              { value: "cancelled", label: "Cancelled" },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={cx(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-surface-card text-foreground-muted hover:border-primary hover:text-foreground-heading",
                )}
              >
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1 opacity-60">
                    ({harvests.filter((h) => h.status === f.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface-card p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : harvests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-card px-8 py-16 text-center space-y-3">
            <p className="font-semibold text-foreground-heading">No harvest announcements yet.</p>
            <p className="text-sm text-foreground-muted">Announce your first harvest so buyers can pre-book!</p>
            <Link
              href="/farmers/harvests/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition mt-2"
            >
              <Plus className="h-4 w-4" />
              Announce Harvest
            </Link>
          </div>
        ) : harvests.filter((h) => statusFilter === "all" || h.status === statusFilter).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-card px-8 py-10 text-center">
            <p className="text-sm text-foreground-muted">No harvests with status <strong>{statusFilter}</strong>.</p>
            <button type="button" onClick={() => setStatusFilter("all")} className="mt-2 text-xs font-semibold text-brand hover:underline">Show all</button>
          </div>
        ) : (
          <div className="space-y-3">
            {harvests.filter((h) => statusFilter === "all" || h.status === statusFilter).map((h) => {
              const days = daysUntil(h.harvestDate);
              return (
                <div key={h.id} className="rounded-2xl border border-border bg-surface-card p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-foreground-heading">{h.crop}</span>
                      {h.variety && <span className="text-sm text-foreground-muted">{h.variety}</span>}
                      <StatusBadge status={h.status} />
                    </div>
                    <p className="text-sm text-foreground-muted">
                      {new Date(h.harvestDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {days >= 0 ? ` · ${days} day${days !== 1 ? "s" : ""} away` : " · Harvest date passed"}
                    </p>
                    <div className="space-y-1 max-w-xs">
                      <ProgressBar booked={h.totalPreBooked} total={h.expectedQty} />
                      <p className="text-xs text-foreground-muted">
                        {h.totalPreBooked} / {h.expectedQty} {h.unit} pre-booked
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => router.push(`/farmers/harvests/${h.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground-heading transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View bookings
                    </button>
                    <button
                      onClick={() => router.push(`/farmers/harvests/${h.id}?edit=true`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground-heading transition"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {h.status === "open" && (
                      <button
                        onClick={() => handleMarkHarvested(h.id)}
                        disabled={markingId === h.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-status-success bg-status-success-surface px-3 py-2 text-xs font-semibold text-status-success hover:opacity-80 disabled:opacity-60 transition"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {markingId === h.id ? "Updating..." : "Mark Harvested"}
                      </button>
                    )}
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
