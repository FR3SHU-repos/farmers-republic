"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCheck,
  CreditCard,
  ImageOff,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;
  status?: string;
};

type DeliveryOrder = {
  _id: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  source?: string;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
};

// ─── Delivery lifecycle (person's steps only) ────────────────

const DELIVERY_STEPS: Record<string, { next: string; label: string; primary: boolean }> = {
  confirmed:       { next: "picked_up",       label: "Pick Up Order",       primary: false },
  packed:          { next: "picked_up",       label: "Pick Up Order",       primary: false },
  picked_up:       { next: "in_transit",      label: "Start Transit",       primary: false },
  in_transit:      { next: "out_for_delivery",label: "Out for Delivery",    primary: false },
  out_for_delivery:{ next: "delivered",       label: "Mark as Delivered",   primary: true  },
};

// Statuses where we must attach delivery person identity (for earning record)
const EARNING_STATUSES = new Set(["picked_up", "in_transit", "out_for_delivery", "delivered"]);

// ─── Helpers ─────────────────────────────────────────────────

function statusBadgeClass(s: string) {
  switch (s) {
    case "payment_pending":
      return "bg-status-warning-surface text-status-warning border-status-warning/30";
    case "pending":
      return "bg-status-warning-surface text-status-warning border-status-warning/30";
    case "confirmed":
      return "bg-status-info-surface text-status-info border-status-info/30";
    case "packed":
      return "bg-secondary-subtle text-secondary-foreground border-secondary/40";
    case "picked_up":
      return "bg-secondary-subtle text-secondary-foreground border-secondary/40";
    case "in_transit":
      return "bg-secondary-subtle text-secondary-foreground border-secondary/40";
    case "out_for_delivery":
      return "bg-primary/10 text-primary border-primary/30";
    case "delivered":
      return "bg-status-success-surface text-status-success border-status-success/30";
    case "cancelled":
    case "returned":
    case "refund_initiated":
    case "refunded":
      return "bg-status-danger-surface text-status-danger border-status-danger/30";
    default:
      return "bg-surface text-foreground-muted border-border";
  }
}

function labelFor(s: string) {
  return s.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-start justify-between gap-4 py-2.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground-heading">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function DeliveryOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!userLoading && user && user.type !== "Logistics Provider") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/orders/${id}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Order not found");
        setOrder(json.data);
      } catch (err: any) {
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const body: Record<string, unknown> = {
        status:    newStatus,
        actorType: "delivery",
      };

      // Attach delivery person info from pickup onward so the earning record
      // is always reachable even if the delivered PATCH is the first call.
      if (EARNING_STATUSES.has(newStatus) && user) {
        body.deliveryPersonId   = user.id;
        body.deliveryPersonName = user.name || user.email;
        body.deliveryEarning    = order.deliveryFee > 0 ? order.deliveryFee : 30;
        body.actorName          = user.name || user.email;
      }

      const res = await fetch(`/api/v1/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);

      const toastMsg: Record<string, string> = {
        picked_up:        "Order picked up!",
        in_transit:       "In transit — on the way!",
        out_for_delivery: "Out for delivery — nearly there!",
        delivered:        "Order marked as delivered!",
      };
      toast.success(toastMsg[newStatus] || "Status updated");
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-status-danger-surface">
          <Package className="h-8 w-8 text-status-danger" />
        </div>
        <p className="text-sm text-foreground-muted">{error || "Order not found"}</p>
        <Link
          href="/delivery"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to deliveries
        </Link>
      </div>
    );
  }

  const isCodUnpaid  = order.paymentMode === "cod" && order.paymentStatus !== "paid";
  const itemCount    = order.items.reduce((s, i) => s + i.qty, 0);
  const isDelivered  = order.status === "delivered";
  const isTerminal   = ["delivered", "cancelled", "returned", "refunded"].includes(order.status);
  const currentStep  = DELIVERY_STEPS[order.status];

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-12">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">

        {/* Back */}
        <Link
          href="/delivery"
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-foreground-heading"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          All deliveries
        </Link>

        {/* Order header */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
                Order
              </p>
              <p className="mt-0.5 font-mono text-2xl font-bold text-foreground-heading">
                #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
            <span className={cx(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
              statusBadgeClass(order.status)
            )}>
              {labelFor(order.status)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                <Calendar className="h-3 w-3" />
                Placed
              </p>
              <p className="mt-1 text-xs font-medium text-foreground-body">
                {fmtDate(order.createdAt)}
              </p>
            </div>
            <div className="rounded-xl bg-surface px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                <ShoppingBag className="h-3 w-3" />
                Items
              </p>
              <p className="mt-1 text-xs font-medium text-foreground-body">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl bg-surface px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                <CreditCard className="h-3 w-3" />
                Payment
              </p>
              <p className="mt-1 text-xs font-medium text-foreground-body uppercase">
                {order.paymentMode}
              </p>
            </div>
          </div>
        </div>

        {/* COD collection banner */}
        {isCodUnpaid && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-status-warning/30 bg-status-warning-surface p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-status-warning/10">
              <Wallet className="h-5 w-5 text-status-warning" />
            </div>
            <div>
              <p className="text-sm font-bold text-status-warning">
                Collect ₹{order.total.toFixed(2)} cash on delivery
              </p>
              <p className="mt-0.5 text-xs text-status-warning/80">
                Payment not received yet — collect before handing over.
              </p>
            </div>
          </div>
        )}

        {/* Step indicator strip */}
        {!isTerminal && (
          <div className="mb-5 overflow-x-auto rounded-2xl border border-border bg-surface-card p-4">
            <div className="flex min-w-max items-center gap-1">
              {(["packed", "picked_up", "in_transit", "out_for_delivery", "delivered"] as const).map(
                (step, idx, arr) => {
                  const STEP_ORDER = ["confirmed","packed","picked_up","in_transit","out_for_delivery","delivered"];
                  const currentIdx = STEP_ORDER.indexOf(order.status);
                  const stepIdx    = STEP_ORDER.indexOf(step);
                  const isDone     = stepIdx < currentIdx;
                  const isActive   = step === order.status || (order.status === "confirmed" && step === "packed");
                  return (
                    <div key={step} className="flex items-center gap-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cx(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition",
                          isDone   ? "border-primary bg-primary text-primary-foreground"
                          : isActive ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface text-foreground-muted"
                        )}>
                          {isDone ? <CheckCheck className="h-3.5 w-3.5" /> : idx + 1}
                        </div>
                        <span className={cx(
                          "text-[9px] font-semibold whitespace-nowrap",
                          isActive ? "text-primary" : isDone ? "text-foreground-muted" : "text-foreground-muted/60"
                        )}>
                          {labelFor(step)}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={cx(
                          "mb-4 h-px w-6 flex-shrink-0",
                          isDone ? "bg-primary" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Buyer / Delivery info */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <MapPin className="h-3.5 w-3.5 text-brand" />
            </div>
            Deliver To
          </h2>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-foreground-heading">
                  {order.buyerName || "Customer"}
                </p>
                {order.buyerEmail && (
                  <p className="mt-0.5 text-sm text-foreground-muted">
                    {order.buyerEmail}
                  </p>
                )}
              </div>
              {order.buyerPhone && (
                <a
                  href={`tel:${order.buyerPhone}`}
                  className="flex flex-shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              )}
            </div>

            {order.buyerPhone && (
              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                  Phone
                </p>
                <a
                  href={`tel:${order.buyerPhone}`}
                  className="mt-0.5 block text-sm font-medium text-primary"
                >
                  {order.buyerPhone}
                </a>
              </div>
            )}

            <div className="rounded-xl bg-surface px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                <Package className="h-3 w-3" />
                Source
              </p>
              <p className="mt-0.5 text-sm font-medium capitalize text-foreground-body">
                {order.source || "Web"}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <Package className="h-3.5 w-3.5 text-brand" />
            </div>
            Items in this order
          </h2>

          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-surface p-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-background">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-6 w-6 text-tertiary-foreground" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground-heading line-clamp-1">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    ₹{item.price.toFixed(2)} per unit
                  </p>
                  {item.farmerId && (
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      Farmer:{" "}
                      <Link
                        href={`/farmers/${item.farmerId}`}
                        className="text-primary hover:underline"
                      >
                        {item.farmerId.slice(-6).toUpperCase()}
                      </Link>
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground-heading">
                    × {item.qty}
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-foreground-heading">
                    ₹{(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <CreditCard className="h-3.5 w-3.5 text-brand" />
            </div>
            Payment Summary
          </h2>

          <div className="divide-y divide-border">
            <InfoRow label="Subtotal" value={`₹${order.subtotal.toFixed(2)}`} />
            <InfoRow
              label="Delivery fee"
              value={
                order.deliveryFee > 0 ? `₹${order.deliveryFee.toFixed(2)}` : (
                  <span className="text-status-success">Free</span>
                )
              }
            />
            <InfoRow
              label="Payment mode"
              value={
                <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold uppercase">
                  {order.paymentMode}
                </span>
              }
            />
            <InfoRow
              label="Payment status"
              value={
                <span className={cx(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  order.paymentStatus === "paid"
                    ? "border-status-success/30 bg-status-success-surface text-status-success"
                    : "border-status-warning/30 bg-status-warning-surface text-status-warning"
                )}>
                  {order.paymentStatus === "paid" && <BadgeCheck className="h-3 w-3" />}
                  {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                </span>
              }
            />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="text-sm font-semibold text-foreground-heading">Total</span>
            <span className="text-2xl font-extrabold text-primary">
              ₹{order.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action button — advances to the next step in DELIVERY_STEPS */}
        {!isTerminal && currentStep && (
          <button
            onClick={() => updateStatus(currentStep.next)}
            disabled={updating}
            className={cx(
              "flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold shadow-sm transition disabled:opacity-50",
              currentStep.primary
                ? "bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-hover"
                : "border border-secondary/40 bg-secondary-subtle text-secondary-foreground hover:bg-secondary/30"
            )}
          >
            {updating ? (
              <span className={cx(
                "h-4 w-4 animate-spin rounded-full border-2 border-t-transparent",
                currentStep.primary ? "border-primary-foreground" : "border-secondary-foreground"
              )} />
            ) : currentStep.primary ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            {currentStep.label}
          </button>
        )}

        {/* Waiting for farmer */}
        {!isTerminal && !currentStep && (
          <div className="rounded-2xl border border-border bg-surface p-4 text-center text-sm text-foreground-muted">
            Waiting for this order to be packed by the farmer before pickup.
          </div>
        )}

        {/* Delivered state */}
        {isDelivered && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-status-success/30 bg-status-success-surface p-6 text-center">
            <CheckCheck className="h-10 w-10 text-status-success" />
            <p className="text-base font-bold text-status-success">Order Delivered!</p>
            <p className="text-xs text-foreground-muted">
              This order has been successfully delivered.
            </p>
          </div>
        )}

        {/* Cancelled / returned */}
        {["cancelled", "returned", "refund_initiated", "refunded"].includes(order.status) && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-status-danger/30 bg-status-danger-surface p-6 text-center">
            <Package className="h-10 w-10 text-status-danger" />
            <p className="text-base font-bold text-status-danger">{labelFor(order.status)}</p>
            <p className="text-xs text-foreground-muted">This order is no longer active.</p>
          </div>
        )}

      </div>
    </div>
  );
}
