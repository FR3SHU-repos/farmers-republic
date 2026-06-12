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

  // Gate
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
      // Always include delivery person info on pickup AND delivery so the
      // PATCH route can create the DeliveryEarning record reliably.
      const extra: Record<string, unknown> = {};
      if ((newStatus === "out_for_delivery" || newStatus === "delivered") && user) {
        extra.deliveryPersonId   = user.id;
        extra.deliveryPersonName = user.name || user.email;
        // Earn the delivery fee; minimum ₹30 for free-delivery orders
        extra.deliveryEarning    = order.deliveryFee > 0 ? order.deliveryFee : 30;
      }

      const res = await fetch(`/api/v1/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(
        newStatus === "out_for_delivery"
          ? "Order picked up — you're on the way!"
          : "Order marked as delivered!"
      );
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

  const isCodUnpaid = order.paymentMode === "cod" && order.paymentStatus !== "paid";
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

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
                Payment has not been received yet — collect before handing over.
              </p>
            </div>
          </div>
        )}

        {/* Buyer / Delivery info */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground-heading">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
              <Phone className="h-3.5 w-3.5 text-brand" />
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
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-border bg-surface p-3"
              >
                {/* Image */}
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

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground-heading line-clamp-1">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    ₹{item.price.toFixed(2)} per unit
                  </p>
                  {item.farmerId && (
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      Farmer ID:{" "}
                      <Link
                        href={`/farmers/${item.farmerId}`}
                        className="text-primary hover:underline"
                      >
                        {item.farmerId.slice(-6).toUpperCase()}
                      </Link>
                    </p>
                  )}
                </div>

                {/* Qty + line total */}
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

        {/* Action buttons — visible if not terminal status */}
        {!isDelivered && !isCancelled && (
          <div className="space-y-3">
            {order.status === "confirmed" && (
              <button
                onClick={() => updateStatus("out_for_delivery")}
                disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-secondary/40 bg-secondary-subtle py-3.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/30 disabled:opacity-50"
              >
                {updating ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                I've picked up — Start Delivery
              </button>
            )}

            {order.status === "out_for_delivery" && (
              <button
                onClick={() => updateStatus("delivered")}
                disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-50"
              >
                {updating ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark as Delivered
              </button>
            )}

            {order.status === "pending" && (
              <div className="rounded-2xl border border-border bg-surface p-4 text-center text-sm text-foreground-muted">
                Waiting for this order to be confirmed before pickup.
              </div>
            )}
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
      </div>
    </div>
  );
}
