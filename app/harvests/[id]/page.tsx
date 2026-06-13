"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/shared/context/UserContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { cx } from "@/shared/lib/utils";
import { ArrowLeft, Calendar, MapPin, Package, CheckCircle } from "lucide-react";

type HarvestDetail = {
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
  remainingQty: number;
  status: string;
  images?: string[];
  notes?: string;
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function CountdownBadgeLarge({ harvestDate }: { harvestDate: string }) {
  const days = daysUntil(harvestDate);

  if (days < 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-status-success-surface px-5 py-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-lg font-bold text-status-success">Harvested</p>
          <p className="text-xs text-status-success opacity-80">This crop has been harvested</p>
        </div>
      </div>
    );
  }

  const colorClass = days <= 2
    ? "bg-status-success-surface text-status-success"
    : days <= 7
    ? "bg-status-warning-surface text-status-warning"
    : "bg-secondary-subtle text-foreground-muted";

  const emoji = days <= 2 ? "🌱" : days <= 7 ? "🌿" : "📅";
  const label = days <= 2 ? "Ready soon" : days <= 7 ? "Coming soon" : "Upcoming";

  return (
    <div className={cx("inline-flex items-center gap-3 rounded-2xl px-5 py-3", colorClass)}>
      <span className="text-3xl font-black">{days}</span>
      <div>
        <p className="text-sm font-bold">{emoji} {label}</p>
        <p className="text-xs opacity-80">days until harvest</p>
      </div>
    </div>
  );
}

type PreBookConfirmation = {
  preBookId: string;
  harvestId: string;
  crop: string;
  qty: number;
  estimatedTotal: number;
};

export default function HarvestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user } = useUser();

  const [harvest, setHarvest] = useState<HarvestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<PreBookConfirmation | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/harvests/${id}`);
        const json = await res.json();
        if (json.success) {
          setHarvest(json.data);
          setQty(json.data.minPreBookQty ?? 1);
        }
      } catch {
        toast.error("Failed to load harvest");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user) {
      if (user.name) setBuyerName(user.name);
      if (user.phoneNumber) setBuyerPhone(user.phoneNumber);
      if (user.email) setBuyerEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvest) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/harvests/${harvest.id}/prebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          buyerPhone,
          buyerEmail,
          qty,
          buyerId: user?.id,
          note,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setConfirmation(json.data);
        toast.success("Pre-booking confirmed!");
      } else {
        toast.error(json.message || "Failed to pre-book");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-foreground-muted animate-pulse">Loading harvest details...</div>
      </div>
    );
  }

  if (!harvest) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-foreground-heading font-semibold">Harvest not found</p>
          <Link href="/harvests" className="text-brand text-sm underline">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  const days = daysUntil(harvest.harvestDate);
  const isPast = days < 0;
  const isFullyBooked = harvest.status === "fully_booked";
  const estimatedTotal = qty * harvest.estimatedPrice;
  const minQty = harvest.minPreBookQty ?? 1;
  const maxQty = harvest.maxPreBookQty ?? harvest.remainingQty;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-6xl px-4 pt-6 space-y-6">
        <Link
          href="/harvests"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground-heading transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-5">
              <CountdownBadgeLarge harvestDate={harvest.harvestDate} />

              <div>
                <h1 className="text-3xl font-bold text-foreground-heading">{harvest.crop}</h1>
                {harvest.variety && (
                  <p className="text-foreground-muted mt-1">{harvest.variety}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
                {harvest.farmerName && (
                  <span className="flex items-center gap-1.5">
                    🧑‍🌾 {harvest.farmerName}
                    {harvest.farmerLocation ? ` · ${harvest.farmerLocation}` : ""}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {harvest.farmerLocation ?? "Location not specified"}
                </span>
              </div>

              {harvest.description && (
                <p className="text-sm text-foreground-muted leading-relaxed">{harvest.description}</p>
              )}

              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center gap-2 text-foreground-heading font-semibold">
                  <Calendar className="h-5 w-5 text-brand" />
                  Harvest Date
                </div>
                <p className="text-2xl font-bold text-foreground-heading">
                  {new Date(harvest.harvestDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted mb-3">
                  Freshness Timeline
                </p>
                <div className="flex items-center gap-0">
                  {["Announced", "Harvesting", "Available"].map((step, i) => (
                    <React.Fragment key={step}>
                      <div className={cx(
                        "flex flex-col items-center gap-1",
                        i === 0 ? "text-status-success" : i === 1 ? "text-status-warning" : "text-foreground-muted",
                      )}>
                        <div className={cx(
                          "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                          i === 0
                            ? "border-status-success bg-status-success-surface text-status-success"
                            : i === 1 && !isPast
                            ? "border-status-warning bg-status-warning-surface text-status-warning"
                            : i === 2 && isPast
                            ? "border-status-success bg-status-success-surface text-status-success"
                            : "border-border bg-surface text-foreground-muted",
                        )}>
                          {i + 1}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">{step}</span>
                      </div>
                      {i < 2 && (
                        <div className={cx(
                          "flex-1 h-0.5 mb-5",
                          i === 0 ? "bg-status-warning-surface" : "bg-border",
                        )} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <Package className="h-4 w-4 shrink-0" />
                <span>
                  {harvest.expectedQty} {harvest.unit} expected ·{" "}
                  {harvest.remainingQty} {harvest.unit} still available
                </span>
              </div>

              {harvest.notes && (
                <div className="rounded-xl bg-secondary-subtle p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted mb-1">Notes</p>
                  <p className="text-sm text-foreground-muted">{harvest.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-5">
              {confirmation ? (
                <div className="space-y-4 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-status-success" />
                  <h2 className="text-xl font-bold text-foreground-heading">Pre-booking Confirmed!</h2>
                  <div className="rounded-xl bg-status-success-surface p-4 text-left space-y-1 text-sm">
                    <p className="text-status-success font-semibold">{confirmation.crop}</p>
                    <p className="text-foreground-muted">Qty: {confirmation.qty} {harvest.unit}</p>
                    <p className="text-foreground-muted">Estimated total: ₹{confirmation.estimatedTotal.toFixed(2)}</p>
                    <p className="text-xs text-foreground-muted mt-2">Booking ID: {confirmation.preBookId.slice(-8).toUpperCase()}</p>
                  </div>
                  <p className="text-xs text-foreground-muted">The farmer will contact you to confirm details.</p>
                </div>
              ) : isPast ? (
                <div className="space-y-3 text-center py-4">
                  <Calendar className="mx-auto h-10 w-10 text-foreground-muted" />
                  <p className="font-semibold text-foreground-heading">This harvest has passed</p>
                  <p className="text-sm text-foreground-muted">Pre-booking is no longer available.</p>
                </div>
              ) : isFullyBooked ? (
                <div className="space-y-3 text-center py-4">
                  <div className="rounded-2xl bg-status-danger-surface px-4 py-5">
                    <p className="text-xl font-bold text-status-danger">Fully Booked</p>
                    <p className="text-sm text-status-danger opacity-80 mt-1">All available quantity has been pre-booked.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground-heading">Pre-book this harvest</h2>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      Quantity ({harvest.unit}) *
                    </label>
                    <input
                      type="number"
                      min={minQty}
                      max={maxQty}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      required
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                    {minQty > 1 && (
                      <p className="text-xs text-foreground-muted">Min: {minQty} {harvest.unit}</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-secondary-subtle p-3 flex justify-between items-center">
                    <span className="text-xs text-foreground-muted">
                      {qty} × ₹{harvest.estimatedPrice}
                    </span>
                    <span className="text-base font-bold text-foreground-heading">
                      ₹{estimatedTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      required
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      Note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Any special requests..."
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
                  >
                    {submitting ? "Confirming..." : "Confirm pre-booking"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
