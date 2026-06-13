"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/shared/context/UserContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { cx } from "@/shared/lib/utils";
import { ArrowLeft, Edit, X, CheckCircle, Loader2, Trash2 } from "lucide-react";

const UNIT_OPTIONS = ["kg", "bunch", "piece", "liter", "box"];

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

type PreBookItem = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  qty: number;
  unit?: string;
  priceAtBooking: number;
  estimatedTotal: number;
  status: string;
  note?: string;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-status-success-surface text-status-success",
    fully_booked: "bg-status-warning-surface text-status-warning",
    harvested: "bg-secondary-subtle text-foreground-muted",
    cancelled: "bg-status-danger-surface text-status-danger",
    draft: "bg-secondary-subtle text-foreground-muted",
    pending: "bg-status-warning-surface text-status-warning",
    confirmed: "bg-status-success-surface text-status-success",
    fulfilled: "bg-secondary-subtle text-foreground-muted",
  };
  const label: Record<string, string> = {
    open: "Open", fully_booked: "Fully Booked", harvested: "Harvested",
    cancelled: "Cancelled", draft: "Draft", pending: "Pending",
    confirmed: "Confirmed", fulfilled: "Fulfilled",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", map[status] ?? "bg-secondary-subtle text-foreground-muted")}>
      {label[status] ?? status}
    </span>
  );
}

export default function FarmerManageHarvestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [harvest, setHarvest] = useState<HarvestDetail | null>(null);
  const [prebooks, setPrebooks] = useState<PreBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "true");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<string | null>(null);

  const [editCrop, setEditCrop] = useState("");
  const [editVariety, setEditVariety] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editExpectedQty, setEditExpectedQty] = useState<number>(0);
  const [editUnit, setEditUnit] = useState("kg");
  const [editEstimatedPrice, setEditEstimatedPrice] = useState<number>(0);
  const [editHarvestDate, setEditHarvestDate] = useState("");
  const [editPreBookDeadline, setEditPreBookDeadline] = useState("");
  const [editMinQty, setEditMinQty] = useState<number>(1);
  const [editMaxQty, setEditMaxQty] = useState<number | "">("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("open");

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const fRes = await fetch(`/api/v1/farmers?profileId=${encodeURIComponent(user.id)}`);
        const fJson = await fRes.json();
        const fid = fJson.success ? fJson.data?.farmerId : null;
        setFarmerId(fid);

        const [hRes, pbRes] = await Promise.all([
          fetch(`/api/v1/harvests/${id}`),
          fid ? fetch(`/api/v1/harvests/${id}/prebookings?farmerId=${encodeURIComponent(fid)}`) : Promise.resolve(null),
        ]);

        const hJson = await hRes.json();
        if (hJson.success) {
          const h = hJson.data as HarvestDetail;
          setHarvest(h);
          setEditCrop(h.crop);
          setEditVariety(h.variety ?? "");
          setEditDescription(h.description ?? "");
          setEditExpectedQty(h.expectedQty);
          setEditUnit(h.unit);
          setEditEstimatedPrice(h.estimatedPrice);
          setEditHarvestDate(h.harvestDate ? h.harvestDate.toString().split("T")[0] : "");
          setEditPreBookDeadline(h.preBookDeadline ? h.preBookDeadline.toString().split("T")[0] : "");
          setEditMinQty(h.minPreBookQty ?? 1);
          setEditMaxQty(h.maxPreBookQty ?? "");
          setEditLocation(h.farmerLocation ?? "");
          setEditNotes(h.notes ?? "");
          setEditStatus(h.status);
        }

        if (pbRes) {
          const pbJson = await pbRes.json();
          if (pbJson.success) setPrebooks(pbJson.data.items ?? []);
        }
      } catch {
        toast.error("Failed to load harvest");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: any = {
        crop: editCrop,
        variety: editVariety || undefined,
        description: editDescription || undefined,
        expectedQty: Number(editExpectedQty),
        unit: editUnit,
        estimatedPrice: Number(editEstimatedPrice),
        harvestDate: editHarvestDate,
        status: editStatus,
        farmerLocation: editLocation || undefined,
        notes: editNotes || undefined,
        minPreBookQty: Number(editMinQty),
      };
      if (editPreBookDeadline) body.preBookDeadline = editPreBookDeadline;
      if (editMaxQty !== "") body.maxPreBookQty = Number(editMaxQty);

      const res = await fetch(`/api/v1/harvests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setHarvest((prev) => prev ? { ...prev, ...json.data } : json.data);
        setEditMode(false);
        toast.success("Harvest updated");
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleHarvestStatusChange = async (newStatus: "harvested" | "cancelled") => {
    setStatusAction(newStatus);
    try {
      const res = newStatus === "cancelled"
        ? await fetch(`/api/v1/harvests/${id}`, { method: "DELETE" })
        : await fetch(`/api/v1/harvests/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
      const json = await res.json();
      if (json.success) {
        setHarvest((prev) => prev ? { ...prev, status: newStatus } : prev);
        toast.success(newStatus === "harvested" ? "Marked as harvested" : "Harvest cancelled");
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setStatusAction(null);
    }
  };

  const handlePreBookAction = async (preBookId: string, status: "confirmed" | "fulfilled" | "cancelled") => {
    setActionId(preBookId);
    try {
      const res = await fetch(`/api/v1/harvests/${id}/prebookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preBookId, status }),
      });
      const json = await res.json();
      if (json.success) {
        setPrebooks((prev) => prev.map((p) => p.id === preBookId ? { ...p, status } : p));
        toast.success("Pre-booking updated");
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionId(null);
    }
  };

  const totalRevenue = prebooks
    .filter((p) => p.status !== "cancelled")
    .reduce((sum, p) => sum + p.estimatedTotal, 0);

  const totalBookedQty = prebooks
    .filter((p) => p.status !== "cancelled")
    .reduce((sum, p) => sum + p.qty, 0);

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!harvest) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-semibold text-foreground-heading">Harvest not found</p>
          <Link href="/farmers/harvests" className="text-sm text-brand underline">Back to harvests</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-5xl px-4 pt-6 space-y-6">
        <Link
          href="/farmers/harvests"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground-heading transition"
        >
          <ArrowLeft className="h-4 w-4" />
          My Harvests
        </Link>

        <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground-heading">{harvest.crop}</h1>
                {harvest.variety && <span className="text-foreground-muted">{harvest.variety}</span>}
                <StatusBadge status={harvest.status} />
              </div>
              <p className="text-sm text-foreground-muted mt-1">
                {new Date(harvest.harvestDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                {harvest.farmerLocation ? ` · ${harvest.farmerLocation}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!editMode && harvest.status !== "cancelled" && harvest.status !== "harvested" && (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground-heading transition"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleHarvestStatusChange("harvested")}
                    disabled={statusAction === "harvested"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-status-success-surface border border-status-success px-3 py-2 text-xs font-semibold text-status-success hover:opacity-80 disabled:opacity-60 transition"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {statusAction === "harvested" ? "Updating..." : "Mark as Harvested"}
                  </button>
                  <button
                    onClick={() => handleHarvestStatusChange("cancelled")}
                    disabled={statusAction === "cancelled"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-status-danger-surface border border-status-danger px-3 py-2 text-xs font-semibold text-status-danger hover:opacity-80 disabled:opacity-60 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {statusAction === "cancelled" ? "Cancelling..." : "Cancel Harvest"}
                  </button>
                </>
              )}
              {editMode && (
                <button
                  onClick={() => setEditMode(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground-heading transition"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel edit
                </button>
              )}
            </div>
          </div>

          {!editMode ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-xs text-foreground-muted">Expected Qty</p>
                <p className="font-semibold text-foreground-heading">{harvest.expectedQty} {harvest.unit}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Price</p>
                <p className="font-semibold text-foreground-heading">₹{harvest.estimatedPrice}/{harvest.unit}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Pre-booked</p>
                <p className="font-semibold text-foreground-heading">{harvest.totalPreBooked} {harvest.unit}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Remaining</p>
                <p className="font-semibold text-foreground-heading">{harvest.remainingQty} {harvest.unit}</p>
              </div>
              {harvest.description && (
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-xs text-foreground-muted">Description</p>
                  <p className="text-foreground-heading mt-0.5">{harvest.description}</p>
                </div>
              )}
              {harvest.notes && (
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-xs text-foreground-muted">Notes</p>
                  <p className="text-foreground-muted mt-0.5">{harvest.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Crop *</label>
                  <input value={editCrop} onChange={(e) => setEditCrop(e.target.value)} required className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Variety</label>
                  <input value={editVariety} onChange={(e) => setEditVariety(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Description</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Expected Qty *</label>
                  <input type="number" value={editExpectedQty} min={1} onChange={(e) => setEditExpectedQty(Number(e.target.value))} required className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Unit</label>
                  <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition">
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Price per {editUnit} (₹) *</label>
                  <input type="number" value={editEstimatedPrice} min={0} step={0.5} onChange={(e) => setEditEstimatedPrice(Number(e.target.value))} required className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Harvest Date *</label>
                  <input type="date" value={editHarvestDate} onChange={(e) => setEditHarvestDate(e.target.value)} required className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Pre-book Deadline</label>
                  <input type="date" value={editPreBookDeadline} max={editHarvestDate} onChange={(e) => setEditPreBookDeadline(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Min Pre-book Qty</label>
                  <input type="number" value={editMinQty} min={1} onChange={(e) => setEditMinQty(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Max Pre-book Qty</label>
                  <input type="number" value={editMaxQty} min={editMinQty} onChange={(e) => setEditMaxQty(e.target.value === "" ? "" : Number(e.target.value))} placeholder="No limit" className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Location</label>
                  <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Village, District" className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition">
                    <option value="open">Open</option>
                    <option value="draft">Draft</option>
                    <option value="harvested">Harvested</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Notes</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading outline-none focus:border-primary transition resize-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition">
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={() => setEditMode(false)} className="rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-foreground-muted hover:text-foreground-heading transition">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-card overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-foreground-heading">Pre-bookings</h2>
            <div className="flex items-center gap-4 text-sm text-foreground-muted">
              <span>{prebooks.length} bookings</span>
              <span>{totalBookedQty} {harvest.unit} pre-booked</span>
              <span className="font-semibold text-foreground-heading">₹{totalRevenue.toFixed(0)} est. revenue</span>
            </div>
          </div>

          {prebooks.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-1">
              <p className="font-semibold text-foreground-heading">No pre-bookings yet</p>
              <p className="text-sm text-foreground-muted">When buyers pre-book, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary-subtle border-b border-border">
                  <tr>
                    {["Buyer", "Phone", "Qty", "Est. Total", "Status", "Booked At", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prebooks.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary-subtle transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground-heading">{p.buyerName}</div>
                        {p.buyerEmail && <div className="text-xs text-foreground-muted">{p.buyerEmail}</div>}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">{p.buyerPhone}</td>
                      <td className="px-4 py-3 font-semibold text-foreground-heading">{p.qty} {p.unit ?? harvest.unit}</td>
                      <td className="px-4 py-3 font-semibold text-foreground-heading">₹{p.estimatedTotal.toFixed(0)}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.status === "pending" && (
                            <button
                              onClick={() => handlePreBookAction(p.id, "confirmed")}
                              disabled={actionId === p.id}
                              className="rounded-lg bg-status-success-surface px-2.5 py-1 text-xs font-semibold text-status-success hover:opacity-80 disabled:opacity-60 transition"
                            >
                              Confirm
                            </button>
                          )}
                          {p.status === "confirmed" && (
                            <button
                              onClick={() => handlePreBookAction(p.id, "fulfilled")}
                              disabled={actionId === p.id}
                              className="rounded-lg bg-secondary-subtle px-2.5 py-1 text-xs font-semibold text-foreground-muted hover:opacity-80 disabled:opacity-60 transition"
                            >
                              Fulfilled
                            </button>
                          )}
                          {(p.status === "pending" || p.status === "confirmed") && (
                            <button
                              onClick={() => handlePreBookAction(p.id, "cancelled")}
                              disabled={actionId === p.id}
                              className="rounded-lg bg-status-danger-surface px-2.5 py-1 text-xs font-semibold text-status-danger hover:opacity-80 disabled:opacity-60 transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
