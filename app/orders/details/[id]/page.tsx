"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileText,
  ImageOff,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
} from "lucide-react";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;
  status?: string;
  deliveryCharge?: number;
  extraCharge?: number;
  serviceCharge?: number;
  discountTotal?: number;
  paymentStatus?: string;
  paymentMode?: string;
};

type BuyerOrder = {
  _id: string;
  buyerId?: string | null;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
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

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id?: string) {
  return id ? id.slice(-6).toUpperCase() : "";
}

function itemStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("delivered") || s.includes("completed"))
    return "bg-status-success-surface text-status-success border-status-success/30";
  if (s.includes("shipped") || s.includes("transit"))
    return "bg-status-info-surface text-status-info border-status-info/30";
  if (s.includes("cancelled") || s.includes("failed"))
    return "bg-status-danger-surface text-status-danger border-status-danger/30";
  return "bg-status-warning-surface text-status-warning border-status-warning/30";
}

function itemPaymentClass(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "success")
    return "bg-status-success-surface text-status-success border-status-success/30";
  if (s === "refunded")
    return "bg-status-info-surface text-status-info border-status-info/30";
  if (s === "failed")
    return "bg-status-danger-surface text-status-danger border-status-danger/30";
  return "bg-status-warning-surface text-status-warning border-status-warning/30";
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const router = useRouter();

  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/orders/${encodeURIComponent(orderId)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok || !json?.success)
          throw new Error(json?.message || "Failed to load order");
        setOrder(json.data as BuyerOrder);
      } catch (err: any) {
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-sm font-medium text-foreground-muted">
            Fetching your order details…
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-status-danger/30 bg-surface-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-danger-surface">
            <Package className="h-7 w-7 text-status-danger" />
          </div>
          <h2 className="text-center text-xl font-semibold text-foreground-heading">
            Order Not Found
          </h2>
          <p className="mt-2 text-center text-sm text-foreground-muted">
            {error ||
              "The order you're looking for doesn't exist or has been removed."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Back to My Orders
          </button>
        </div>
      </main>
    );
  }

  const deliveryCharges = order.items.reduce(
    (sum, it) => sum + (it.deliveryCharge ?? 0),
    0
  );
  const extraCharges = order.items.reduce(
    (sum, it) => sum + (it.extraCharge ?? 0),
    0
  );
  const serviceCharges = order.items.reduce(
    (sum, it) => sum + (it.serviceCharge ?? 0),
    0
  );
  const discounts = order.items.reduce(
    (sum, it) => sum + (it.discountTotal ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-foreground-heading"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Orders
        </button>

        {/* ── Header card ──────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Left: meta */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground-heading sm:text-3xl">
                  Order #{shortId(order._id)}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                  {order.source === "voice"
                    ? "Voice Order"
                    : order.source === "app"
                    ? "App Order"
                    : "Web Order"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="font-medium">Placed</span>
                  <span>• {formatDate(order.createdAt)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span className="font-medium">Items</span>
                  <span>• {order.items.length}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground-muted">
                  ID: {order._id}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
                  Customer
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-foreground-heading">
                    {order.buyerName || order.buyerEmail}
                  </span>
                  {order.buyerEmail && (
                    <span className="text-foreground-muted">{order.buyerEmail}</span>
                  )}
                  {order.buyerPhone && (
                    <span className="inline-flex items-center gap-1 text-foreground-muted">
                      <Phone className="h-3.5 w-3.5" />
                      {order.buyerPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: total */}
            <div className="w-full md:w-60">
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                    Order Total
                  </span>
                  <CircleDollarSign className="h-5 w-5 text-brand" />
                </div>
                <p className="text-3xl font-extrabold text-foreground-heading">
                  ₹{order.total.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Inclusive of all charges and discounts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Items section ─────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Package className="h-6 w-6 text-brand" />
            <div>
              <h2 className="text-xl font-semibold text-foreground-heading">
                Items in this order
              </h2>
              <p className="text-xs text-foreground-muted">
                {order.items.length} product{order.items.length !== 1 ? "s" : ""}{" "}
                · tap any row for a detailed breakdown
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            {/* Desktop header */}
            <div className="hidden grid-cols-[minmax(0,2.3fr)_auto_auto_auto] border-b border-border bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted sm:grid">
              <div>Product</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Unit Price</div>
              <div className="text-right">Line Total</div>
            </div>

            {order.items.map((it, idx) => {
              const baseTotal = it.price * it.qty;
              const delivery = it.deliveryCharge ?? 0;
              const extra = it.extraCharge ?? 0;
              const service = it.serviceCharge ?? 0;
              const discount = it.discountTotal ?? 0;
              const lineTotal = baseTotal + delivery + extra + service - discount;
              const isExpanded = expandedItemId === it.productId;
              const itemStatus = it.status || "pending";
              const itemPaymentStatus = it.paymentStatus || "unpaid";
              const itemPaymentMode = it.paymentMode || order.paymentMode || "COD";

              return (
                <div
                  key={it.productId}
                  className={`${idx !== 0 ? "border-t border-border" : ""} transition-colors hover:bg-surface/50`}
                >
                  <div
                    onClick={() =>
                      setExpandedItemId((prev) =>
                        prev === it.productId ? null : it.productId
                      )
                    }
                    className="flex cursor-pointer flex-col gap-4 px-4 py-4 sm:grid sm:grid-cols-[minmax(0,2.3fr)_auto_auto_auto]"
                  >
                    {/* Product info */}
                    <div className="flex items-start gap-4">
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.image}
                          alt={it.name}
                          className="h-16 w-16 flex-shrink-0 rounded-xl border border-border object-cover shadow-sm sm:h-14 sm:w-14"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-surface sm:h-14 sm:w-14">
                          <ImageOff className="h-6 w-6 text-tertiary-foreground" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground-heading sm:text-base">
                          {it.name}
                        </p>
                        <p className="font-mono text-xs text-foreground-muted">
                          ID: {it.productId.slice(-6).toUpperCase()}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${itemStatusClass(itemStatus)}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {itemStatus.split("_").join(" ")}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${itemPaymentClass(itemPaymentStatus)}`}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            {itemPaymentStatus[0].toUpperCase() +
                              itemPaymentStatus.slice(1)}{" "}
                            ·{" "}
                            <span className="text-[10px] uppercase opacity-80">
                              {itemPaymentMode}
                            </span>
                          </span>
                        </div>

                        {/* Mobile: qty + line total */}
                        <div className="mt-3 space-y-1.5 border-t border-border pt-3 sm:hidden">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground-muted">Quantity</span>
                            <span className="font-semibold text-foreground-heading">
                              {it.qty}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground-muted">Unit Price</span>
                            <span className="font-semibold text-foreground-heading">
                              ₹{it.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 text-sm">
                            <span className="font-medium text-foreground-body">
                              Line Total
                            </span>
                            <span className="font-bold text-foreground-heading">
                              ₹{lineTotal.toFixed(2)}
                            </span>
                          </div>
                          <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                            {isExpanded ? "Hide" : "View"} breakdown
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop columns */}
                    <div className="hidden items-center justify-end text-base font-medium text-foreground-heading sm:flex">
                      {it.qty}
                    </div>
                    <div className="hidden items-center justify-end text-base font-medium text-foreground-heading sm:flex">
                      ₹{it.price.toFixed(2)}
                    </div>
                    <div className="hidden flex-col items-end justify-center sm:flex">
                      <span className="text-base font-bold text-foreground-heading">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                      <button className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        {isExpanded ? "Hide" : "Show"} breakdown
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded breakdown */}
                  {isExpanded && (
                    <div className="border-t border-border bg-surface px-4 pb-4 pt-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-border bg-surface-card p-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                            Item Status
                          </p>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${itemStatusClass(itemStatus)}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {itemStatus.split("_").join(" ")}
                          </span>
                        </div>

                        <div className="rounded-xl border border-border bg-surface-card p-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                            Payment
                          </p>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${itemPaymentClass(itemPaymentStatus)}`}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            {itemPaymentStatus[0].toUpperCase() +
                              itemPaymentStatus.slice(1)}{" "}
                            · {itemPaymentMode.toUpperCase()}
                          </span>
                        </div>

                        <div className="rounded-xl border border-border bg-surface-card p-3 sm:col-span-2 lg:col-span-1">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                            Price Breakdown
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-foreground-muted">
                                Base ({it.qty} × ₹{it.price.toFixed(2)})
                              </span>
                              <span className="font-medium text-foreground-heading">
                                ₹{baseTotal.toFixed(2)}
                              </span>
                            </div>
                            {delivery > 0 && (
                              <div className="flex justify-between">
                                <span className="text-foreground-muted">Delivery</span>
                                <span className="font-medium text-foreground-heading">
                                  ₹{delivery.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {extra > 0 && (
                              <div className="flex justify-between">
                                <span className="text-foreground-muted">Extra</span>
                                <span className="font-medium text-foreground-heading">
                                  ₹{extra.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {service > 0 && (
                              <div className="flex justify-between">
                                <span className="text-foreground-muted">Service</span>
                                <span className="font-medium text-foreground-heading">
                                  ₹{service.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {discount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-foreground-muted">Discount</span>
                                <span className="font-medium text-status-danger">
                                  −₹{discount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-dashed border-border pt-1.5 font-semibold">
                              <span className="text-foreground-body">Line Total</span>
                              <span className="text-foreground-heading">
                                ₹{lineTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary totals */}
          <div className="mt-8 flex justify-end border-t border-border pt-6">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-medium text-foreground-heading">
                  ₹{order.subtotal.toFixed(2)}
                </span>
              </div>
              {deliveryCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Delivery</span>
                  <span className="font-medium text-foreground-heading">
                    ₹{deliveryCharges.toFixed(2)}
                  </span>
                </div>
              )}
              {extraCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Extra charges</span>
                  <span className="font-medium text-foreground-heading">
                    ₹{extraCharges.toFixed(2)}
                  </span>
                </div>
              )}
              {serviceCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Service</span>
                  <span className="font-medium text-foreground-heading">
                    ₹{serviceCharges.toFixed(2)}
                  </span>
                </div>
              )}
              {discounts > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Discounts</span>
                  <span className="font-medium text-status-danger">
                    −₹{discounts.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t-2 border-border pt-3">
                <span className="text-base font-bold text-foreground-heading">
                  Grand Total
                </span>
                <span className="text-2xl font-extrabold text-primary">
                  ₹{order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Actions ───────────────────────────────────── */}
        <section className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-surface-card p-4 shadow-sm sm:flex-row">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Continue Shopping
          </Link>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-body transition hover:bg-surface">
              <FileText className="h-4 w-4" />
              Download Invoice
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover">
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
