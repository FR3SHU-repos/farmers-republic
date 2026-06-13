"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { cx } from "@/shared/lib/utils";
import { ArrowLeft, Eye, Calendar, Package } from "lucide-react";

const UNIT_OPTIONS = ["kg", "bunch", "piece", "liter", "box"];

function todayPlusOne() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function NewHarvestPage() {
  const { user } = useUser();
  const router = useRouter();

  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [farmerName, setFarmerName] = useState("");
  const [loadingFarmer, setLoadingFarmer] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [description, setDescription] = useState("");
  const [harvestDate, setHarvestDate] = useState(todayPlusOne());
  const [expectedQty, setExpectedQty] = useState<number>(100);
  const [unit, setUnit] = useState("kg");
  const [estimatedPrice, setEstimatedPrice] = useState<number>(50);
  const [preBookDeadline, setPreBookDeadline] = useState("");
  const [minPreBookQty, setMinPreBookQty] = useState<number>(1);
  const [maxPreBookQty, setMaxPreBookQty] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"open" | "draft">("open");

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoadingFarmer(true);
      try {
        const res = await fetch(`/api/v1/farmers?profileId=${encodeURIComponent(user.id)}`);
        const json = await res.json();
        if (json.success && json.data?.farmerId) {
          setFarmerId(json.data.farmerId);
          setFarmerName(json.data.farmer?.name ?? user.name ?? "");
          setLocation(
            [json.data.farmer?.village, json.data.farmer?.district].filter(Boolean).join(", ") ?? ""
          );
        } else {
          toast.error("Farmer profile not found. Please complete your profile first.");
        }
      } catch {
        toast.error("Failed to load farmer profile");
      } finally {
        setLoadingFarmer(false);
      }
    };

    load();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId) {
      toast.error("Farmer profile not found");
      return;
    }

    setSubmitting(true);
    try {
      const body: any = {
        farmerId,
        farmerName,
        farmerLocation: location,
        crop,
        variety: variety || undefined,
        description: description || undefined,
        harvestDate,
        expectedQty: Number(expectedQty),
        unit,
        estimatedPrice: Number(estimatedPrice),
        status,
        notes: notes || undefined,
        minPreBookQty: Number(minPreBookQty),
      };

      if (preBookDeadline) body.preBookDeadline = preBookDeadline;
      if (maxPreBookQty !== "") body.maxPreBookQty = Number(maxPreBookQty);

      const res = await fetch("/api/v1/harvests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Harvest announced!");
        router.push(`/farmers/harvests/${json.data.id}`);
      } else {
        toast.error(json.message || "Failed to announce harvest");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const daysAway = harvestDate
    ? Math.ceil((new Date(harvestDate).getTime() - Date.now()) / 86400000)
    : 0;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-6xl px-4 pt-6 space-y-6">
        <Link
          href="/farmers/harvests"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground-heading transition"
        >
          <ArrowLeft className="h-4 w-4" />
          My Harvests
        </Link>

        <h1 className="text-2xl font-bold text-foreground-heading">Announce Harvest</h1>

        {loadingFarmer ? (
          <div className="text-foreground-muted animate-pulse">Loading your profile...</div>
        ) : !farmerId ? (
          <div className="rounded-2xl border border-status-danger-surface bg-status-danger-surface px-6 py-8 text-center space-y-2">
            <p className="font-semibold text-status-danger">Farmer profile not found</p>
            <p className="text-sm text-foreground-muted">Please complete your farmer profile before announcing a harvest.</p>
            <Link href="/farmers/create" className="text-sm text-brand underline">Create profile</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground-heading border-b border-border pb-3">Crop Details</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Crop Name *
                    </label>
                    <input
                      type="text"
                      value={crop}
                      onChange={(e) => setCrop(e.target.value)}
                      required
                      placeholder="Tomatoes, Mango, Rice..."
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Variety
                    </label>
                    <input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      placeholder="Alphonso, Cherry, Ponni..."
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Tell buyers about this crop, growing method, quality..."
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition resize-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground-heading border-b border-border pb-3">Harvest Schedule</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Harvest Date *
                    </label>
                    <input
                      type="date"
                      value={harvestDate}
                      min={todayPlusOne()}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Pre-book Deadline
                    </label>
                    <input
                      type="date"
                      value={preBookDeadline}
                      max={harvestDate}
                      onChange={(e) => setPreBookDeadline(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground-heading border-b border-border pb-3">Quantity & Pricing</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Expected Quantity *
                    </label>
                    <input
                      type="number"
                      value={expectedQty}
                      min={1}
                      onChange={(e) => setExpectedQty(Number(e.target.value))}
                      required
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Estimated Price per {unit} (₹) *
                  </label>
                  <input
                    type="number"
                    value={estimatedPrice}
                    min={0}
                    step={0.5}
                    onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Min Pre-book Qty
                    </label>
                    <input
                      type="number"
                      value={minPreBookQty}
                      min={1}
                      onChange={(e) => setMinPreBookQty(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Max Pre-book Qty (optional)
                    </label>
                    <input
                      type="number"
                      value={maxPreBookQty}
                      min={minPreBookQty}
                      onChange={(e) => setMaxPreBookQty(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="No limit"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground-heading border-b border-border pb-3">Location & Notes</h2>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Location (Village, District)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Rajam, Srikakulam"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Delivery, pickup, quality notes..."
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Visibility
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "open" | "draft")}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                  >
                    <option value="open">Open (visible to buyers)</option>
                    <option value="draft">Draft (hidden)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !farmerId}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
              >
                {submitting ? "Announcing..." : "Announce harvest"}
              </button>
            </form>

            <div className="hidden lg:block">
              <div className="sticky top-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground-muted">
                  <Eye className="h-4 w-4" />
                  Preview
                </div>
                <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-3">
                  <div className={cx(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    daysAway <= 2
                      ? "bg-status-success-surface text-status-success"
                      : daysAway <= 7
                      ? "bg-status-warning-surface text-status-warning"
                      : "bg-secondary-subtle text-foreground-muted",
                  )}>
                    <Calendar className="h-3.5 w-3.5" />
                    {daysAway > 0 ? `Harvests in ${daysAway} days` : "Harvest date set"}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground-heading">{crop || "Crop name"}</h3>
                    {variety && <p className="text-sm text-foreground-muted">{variety}</p>}
                  </div>

                  <p className="text-sm text-foreground-muted">
                    🧑‍🌾 {farmerName || user.name}{location ? ` · ${location}` : ""}
                  </p>

                  <p className="text-xl font-bold text-brand">
                    ₹{estimatedPrice || 0}
                    <span className="text-sm font-normal text-foreground-muted"> / {unit}</span>
                  </p>

                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div className="h-1.5 w-0 rounded-full bg-primary" />
                    </div>
                    <p className="text-xs text-foreground-muted flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      {expectedQty || 0} {unit} available
                    </p>
                  </div>

                  <div className="w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground">
                    Pre-book now →
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
