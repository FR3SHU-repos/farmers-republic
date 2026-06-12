// app/farmers/orders/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCheck,
  CreditCard,
  IndianRupee,
  Mail,
  Package,
  Phone,
  Sprout,
  Truck,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  status?: string;
  deliveryCharge?: number;
  extraCharge?: number;
  serviceCharge?: number;
  platformFeeTotal?: number;
  discountTotal?: number;
};

type FarmerOrderDetail = {
  orderId: string;
  farmerId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  source: string;
  createdAt: string;
  subtotal: number;
  total: number;
  itemsCount: number;
  deliveryTotal?: number;
  extraTotal?: number;
  serviceTotal?: number;
  platformFeeTotal?: number;
  discountTotal?: number;
  items: OrderItem[];
};

// ─── Constants ────────────────────────────────────────────────

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const PAYMENT_STATUS_OPTIONS = ["unpaid", "paid"] as const;

const STATUS_ORDER = ["pending", "confirmed", "out_for_delivery", "delivered"] as const;

// ─── Helpers ─────────────────────────────────────────────────

function statusBadgeClass(s: string) {
  switch (s) {
    case "pending":
      return "bg-status-warning-surface text-status-warning border-status-warning/30";
    case "confirmed":
      return "bg-status-info-surface text-status-info border-status-info/30";
    case "out_for_delivery":
      return "bg-secondary-subtle text-secondary-foreground border-secondary/40";
    case "delivered":
      return "bg-status-success-surface text-status-success border-status-success/30";
    case "cancelled":
      return "bg-status-danger-surface text-status-danger border-status-danger/30";
    default:
      return "bg-surface text-foreground-muted border-border";
  }
}

function labelFor(s: string) {
  return s.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
}

function fmtDate(str?: string) {
  if (!str) return "—";
  return new Date(str).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deriveStatusFromItems(items: OrderItem[], prev: string): string {
  if (!items.length) return prev;
  if (items.every((it) => it.status === "cancelled")) return "cancelled";
  let max = -1;
  for (const it of items) {
    const idx = STATUS_ORDER.indexOf((it.status || "") as (typeof STATUS_ORDER)[number]);
    if (idx > max) max = idx;
  }
  return max >= 0 ? STATUS_ORDER[max] : prev;
}

function calcTotals(items: OrderItem[]) {
  let subtotal = 0, deliveryTotal = 0, extraTotal = 0, serviceTotal = 0,
    platformFeeTotal = 0, discountTotal = 0;
  for (const it of items) {
    subtotal += it.price * it.qty;
    deliveryTotal += it.deliveryCharge ?? 0;
    extraTotal += it.extraCharge ?? 0;
    serviceTotal += it.serviceCharge ?? 0;
    platformFeeTotal += it.platformFeeTotal ?? 0;
    discountTotal += it.discountTotal ?? 0;
  }
  const total = subtotal + deliveryTotal + extraTotal + serviceTotal - platformFeeTotal - discountTotal;
  return { subtotal, deliveryTotal, extraTotal, serviceTotal, platformFeeTotal, discountTotal, total };
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-center justify-between gap-4 py-2.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground-heading">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function FarmerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const searchParams = useSearchParams();
  const farmerId = searchParams.get("farmerId") || "";
  const router = useRouter();
  const { user } = useUser();

  const isFarmer = user?.type === "Farmer";

  const [data, setData] = useState<FarmerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!orderId || !farmerId) {
        setError(!orderId ? "Missing order ID" : "Missing farmerId — navigate from your orders list.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/farmers/orders/${encodeURIComponent(orderId)}?farmerId=${encodeURIComponent(farmerId)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load order");
        const d = json.data as FarmerOrderDetail;
        const safe: OrderItem[] = (d.items || []).map((it) => ({
          ...it,
          price: Number(it.price ?? 0),
          qty: Number(it.qty ?? 0),
          deliveryCharge: Number(it.deliveryCharge ?? 0),
          extraCharge: Number(it.extraCharge ?? 0),
          serviceCharge: Number(it.serviceCharge ?? 0),
          platformFeeTotal: Number(it.platformFeeTotal ?? 0),
          discountTotal: Number(it.discountTotal ?? 0),
        }));
        setData({ ...d, items: safe, ...calcTotals(safe) });
      } catch (err: any) {
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, farmerId]);

  const handleUpdate = async (patch: { status?: string; paymentStatus?: string }) => {
    if (!data || !orderId || !isFarmer) return;
    const prev = data;
    setData((curr) => (curr ? { ...curr, ...patch } : curr));
    try {
      setSaving(true);
      const res = await fetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      toast.success("Order updated");
    } catch (err: any) {
      setData(prev);
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleItemUpdate = async (
    productId: string,
    patch: {
      status?: string;
      deliveryCharge?: number;
      extraCharge?: number;
      serviceCharge?: number;
      discountTotal?: number;
    }
  ) => {
    if (!data || !orderId || !farmerId || !isFarmer) return;
    const prev = data;
    setData((curr) => {
      if (!curr) return curr;
      const newItems = curr.items.map((it) =>
        it.productId === productId ? { ...it, ...patch } : it
      );
      return { ...curr, status: deriveStatusFromItems(newItems, curr.status), items: newItems, ...calcTotals(newItems) };
    });
    try {
      setSaving(true);
      const res = await fetch(
        `/api/v1/farmers/orders/${encodeURIComponent(orderId)}?farmerId=${encodeURIComponent(farmerId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, ...patch }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      toast.success("Item updated");
    } catch (err: any) {
      setData(prev);
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-status-danger-surface">
          <Package className="h-8 w-8 text-status-danger" />
        </div>
        <p className="text-sm text-foreground-muted">{error || "Order not found"}</p>
        <Link
          href="/farmers/orders"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>
    );
  }

  const isDelivered = data.status === "delivered";
  const isCancelled = data.status === "cancelled";
  const itemCount = data.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-12">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">

        {/* ── Back ──────────────────────────────────── */}
        <Link
          href="/farmers/orders"
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-foreground-heading"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          All orders
        </Link>

        {/* ── Order header ──────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
                Order
              </p>
              <p className="mt-0.5 font-mono text-2xl font-bold text-foreground-heading">
                #{data.orderId.slice(-8).toUpperCase()}
              </p>
            </div>
            <span
              className={cx(
                "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
                statusBadgeClass(data.status)
              )}
            >
              {labelFor(data.status)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                <Calendar className="h-3 w-3" />
                Placed
              </p>
              <p className="mt-1 text-xs font-medium text-foreground-body">
                {fmtDate(data.createdAt)}
              </p>
            </div>
            <div className="rounded-xl bg-surface px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                <Package className="h-3 w-3" />
                Items
              </p>
              <p className="mt-1 text-xs font-medium text-foreground-body">
                {itemCount} unit{itemCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl bg-surface px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                <CreditCard className="h-3 w-3" />
                Payment
              </p>
              <p className="mt-1 text-xs font-medium uppercase text-foreground-body">
                {data.paymentMode}
              </p>
            </div>
          </div>
        </div>

        {/* ── Buyer card ────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <Phone className="h-3.5 w-3.5 text-brand" />
            </div>
            Buyer details
          </h2>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-foreground-heading">
                  {data.buyerName || "Customer"}
                </p>
                {data.source && (
                  <p className="mt-0.5 text-xs text-foreground-muted capitalize">
                    via {data.source === "voice" ? "📞 Voice" : data.source === "app" ? "📱 App" : "🌐 Web"}
                  </p>
                )}
              </div>
              {data.buyerPhone && (
                <a
                  href={`tel:${data.buyerPhone}`}
                  className="flex flex-shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              )}
            </div>

            {data.buyerPhone && (
              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                  Phone
                </p>
                <a
                  href={`tel:${data.buyerPhone}`}
                  className="mt-0.5 block text-sm font-medium text-primary"
                >
                  {data.buyerPhone}
                </a>
              </div>
            )}

            {data.buyerEmail && (
              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                  <Mail className="h-3 w-3" />
                  Email
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground-body">
                  {data.buyerEmail}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Items ─────────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <Sprout className="h-3.5 w-3.5 text-brand" />
            </div>
            Your products in this order
          </h2>

          {data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Package className="h-8 w-8 text-foreground-muted opacity-40" />
              <p className="text-sm text-foreground-muted">No items linked to your farm.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((it) => {
                const baseTotal = it.price * it.qty;
                const charges = (it.deliveryCharge ?? 0) + (it.extraCharge ?? 0) + (it.serviceCharge ?? 0);
                const discount = it.discountTotal ?? 0;
                const lineTotal = baseTotal + charges - discount;

                return (
                  <div
                    key={it.productId}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    {/* Item row */}
                    <div className="flex gap-4">
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.image}
                          alt={it.name}
                          className="h-16 w-16 flex-shrink-0 rounded-xl border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                          <Package className="h-6 w-6 text-foreground-muted opacity-40" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground-heading line-clamp-1">
                          {it.name}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-muted">
                          ₹{it.price.toFixed(2)} per unit
                        </p>
                        {it.status && (
                          <span
                            className={cx(
                              "mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              statusBadgeClass(it.status)
                            )}
                          >
                            {labelFor(it.status)}
                          </span>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground-heading">
                          × {it.qty}
                        </div>
                        <p className="mt-1.5 text-sm font-bold text-primary">
                          ₹{lineTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Per-item controls — farmers only */}
                    {isFarmer && (
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                          Manage item
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-foreground-muted">
                              Status
                            </label>
                            <select
                              value={it.status || data.status}
                              disabled={saving}
                              onChange={(e) => handleItemUpdate(it.productId, { status: e.target.value })}
                              className="rounded-lg border border-border bg-surface-card px-3 py-1.5 text-xs text-foreground-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{labelFor(s)}</option>
                              ))}
                            </select>
                          </div>

                          {(
                            [
                              { key: "deliveryCharge" as const, label: "Delivery ₹", val: it.deliveryCharge ?? 0 },
                              { key: "extraCharge" as const, label: "Extra ₹", val: it.extraCharge ?? 0 },
                              { key: "serviceCharge" as const, label: "Service ₹", val: it.serviceCharge ?? 0 },
                              { key: "discountTotal" as const, label: "Discount ₹", val: it.discountTotal ?? 0 },
                            ] as const
                          ).map(({ key, label, val }) => (
                            <div key={key} className="flex flex-col gap-1">
                              <label className="text-[10px] font-semibold text-foreground-muted">
                                {label}
                              </label>
                              <input
                                type="number"
                                min={0}
                                defaultValue={val}
                                disabled={saving}
                                onBlur={(e) =>
                                  handleItemUpdate(it.productId, { [key]: Number(e.target.value || 0) })
                                }
                                className="w-20 rounded-lg border border-border bg-surface-card px-2.5 py-1.5 text-right text-xs text-foreground-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Payment summary ───────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <CreditCard className="h-3.5 w-3.5 text-brand" />
            </div>
            Earnings summary
          </h2>

          <div className="divide-y divide-border">
            <InfoRow label="Items subtotal" value={`₹${data.subtotal.toFixed(2)}`} />
            {(data.deliveryTotal ?? 0) > 0 && (
              <InfoRow label="Delivery charges" value={`₹${(data.deliveryTotal ?? 0).toFixed(2)}`} />
            )}
            {(data.extraTotal ?? 0) > 0 && (
              <InfoRow label="Extra charges" value={`₹${(data.extraTotal ?? 0).toFixed(2)}`} />
            )}
            {(data.serviceTotal ?? 0) > 0 && (
              <InfoRow label="Service charges" value={`₹${(data.serviceTotal ?? 0).toFixed(2)}`} />
            )}
            {(data.platformFeeTotal ?? 0) > 0 && (
              <InfoRow
                label="Platform fees"
                value={
                  <span className="text-status-danger">
                    -₹{(data.platformFeeTotal ?? 0).toFixed(2)}
                  </span>
                }
              />
            )}
            {(data.discountTotal ?? 0) > 0 && (
              <InfoRow
                label="Discounts"
                value={
                  <span className="text-status-danger">
                    -₹{(data.discountTotal ?? 0).toFixed(2)}
                  </span>
                }
              />
            )}
            <InfoRow
              label="Payment mode"
              value={
                <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold uppercase">
                  {data.paymentMode}
                </span>
              }
            />
            <InfoRow
              label="Payment status"
              value={
                <span
                  className={cx(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    data.paymentStatus === "paid"
                      ? "border-status-success/30 bg-status-success-surface text-status-success"
                      : "border-status-warning/30 bg-status-warning-surface text-status-warning"
                  )}
                >
                  {data.paymentStatus === "paid" && <BadgeCheck className="h-3 w-3" />}
                  {data.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                </span>
              }
            />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary-subtle px-4 py-3">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold text-foreground-heading">You receive</span>
            </div>
            <span className="text-2xl font-extrabold text-primary">
              ₹{data.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ── Order status (manage) ─────────────────── */}
        {isFarmer && (
          <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
                <Wallet className="h-3.5 w-3.5 text-brand" />
              </div>
              Manage order
            </h2>

            <div className="space-y-4">
              {/* Status select */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Order status
                </label>
                <select
                  value={data.status}
                  onChange={(e) => handleUpdate({ status: e.target.value })}
                  disabled={saving}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{labelFor(s)}</option>
                  ))}
                </select>
              </div>

              {/* Payment status */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Payment status
                </label>
                <div className="flex gap-2">
                  {PAYMENT_STATUS_OPTIONS.map((ps) => (
                    <button
                      key={ps}
                      type="button"
                      disabled={saving}
                      onClick={() => handleUpdate({ paymentStatus: ps })}
                      className={cx(
                        "flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition disabled:opacity-50",
                        data.paymentStatus === ps
                          ? ps === "paid"
                            ? "border-status-success bg-status-success text-white"
                            : "border-status-danger bg-status-danger text-white"
                          : "border-border bg-surface-card text-foreground-muted hover:border-primary/40 hover:text-foreground-heading"
                      )}
                    >
                      {ps === "paid" ? "Mark Paid" : "Mark Unpaid"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick action buttons ──────────────────── */}
        {isFarmer && !isDelivered && !isCancelled && (
          <div className="space-y-3">
            {data.status === "pending" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate({ status: "confirmed" })}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-secondary/40 bg-secondary-subtle py-3.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/30 disabled:opacity-50"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Confirm Order
              </button>
            )}

            {data.status === "confirmed" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate({ status: "out_for_delivery" })}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-secondary/40 bg-secondary-subtle py-3.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/30 disabled:opacity-50"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Ready for Pickup
              </button>
            )}

            {data.status === "out_for_delivery" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate({ status: "delivered" })}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark as Delivered
              </button>
            )}
          </div>
        )}

        {/* Delivered state */}
        {isDelivered && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-status-success/30 bg-status-success-surface p-6 text-center">
            <CheckCheck className="h-10 w-10 text-status-success" />
            <p className="text-base font-bold text-status-success">Order Delivered!</p>
            <p className="text-xs text-foreground-muted">
              This order has been successfully fulfilled.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
