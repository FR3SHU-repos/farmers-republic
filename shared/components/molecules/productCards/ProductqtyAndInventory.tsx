"use client";

import React from "react";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";
import { AlertTriangle, CalendarDays, Package, Tag } from "lucide-react";
import { cx } from "@/shared/lib/utils";

type ProductForInventory = Omit<ProductBase, "farmer"> & { farmer?: any };

type Props = { product: ProductForInventory };

function fmtDate(d?: Date | string) {
  if (!d) return "—";
  return new Date(d as string).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function isExpired(expiryDate?: Date | string) {
  if (!expiryDate) return false;
  return new Date(expiryDate as string) < new Date();
}

function isLowStock(availableQty?: number, threshold?: number) {
  if (threshold == null || threshold <= 0) return false;
  return (availableQty ?? 0) <= threshold;
}

export const ProductInventoryAndQty: React.FC<Props> = ({ product }) => {
  const available      = product.availableQty ?? product.stockQty ?? 0;
  const reserved       = product.reservedQty  ?? 0;
  const stock          = product.stockQty     ?? 0;
  const threshold      = product.lowStockThreshold ?? 0;
  const expired        = isExpired(product.expiryDate);
  const lowStock       = isLowStock(available, threshold);
  const availablePct   = stock > 0 ? Math.min(100, Math.round((available / stock) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface-card p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-subtle">
          <Package className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground-heading">
            Qty &amp; Inventory
          </h2>
          <p className="text-xs text-foreground-muted">
            Stock, reservations &amp; freshness
          </p>
        </div>
        {(expired || lowStock) && (
          <div className={cx(
            "ml-auto flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
            expired
              ? "border-status-danger/30 bg-status-danger-surface text-status-danger"
              : "border-status-warning/30 bg-status-warning-surface text-status-warning"
          )}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {expired ? "Expired" : "Low Stock"}
          </div>
        )}
      </div>

      {/* Live availability bar */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-foreground-muted">
          <span>Available to order</span>
          <span className={cx(
            available <= 0 ? "text-status-danger" :
            lowStock       ? "text-status-warning" :
                             "text-status-success"
          )}>
            {available} / {stock} units
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className={cx(
              "h-full rounded-full transition-all",
              available <= 0 ? "bg-status-danger" :
              lowStock       ? "bg-status-warning" :
                               "bg-status-success"
            )}
            style={{ width: `${availablePct}%` }}
          />
        </div>
      </div>

      {/* Three-number summary */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface px-3 py-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
            In Stock
          </p>
          <p className="mt-1 text-xl font-bold text-foreground-heading">{stock}</p>
        </div>
        <div className="rounded-xl border border-status-warning/30 bg-status-warning-surface px-3 py-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-status-warning">
            Reserved
          </p>
          <p className="mt-1 text-xl font-bold text-status-warning">{reserved}</p>
          <p className="text-[9px] text-status-warning/70">active orders</p>
        </div>
        <div className={cx(
          "rounded-xl border px-3 py-3 text-center",
          available <= 0
            ? "border-status-danger/30 bg-status-danger-surface"
            : lowStock
              ? "border-status-warning/30 bg-status-warning-surface"
              : "border-status-success/30 bg-status-success-surface"
        )}>
          <p className={cx(
            "text-[10px] font-semibold uppercase tracking-wide",
            available <= 0 ? "text-status-danger" : lowStock ? "text-status-warning" : "text-status-success"
          )}>
            Available
          </p>
          <p className={cx(
            "mt-1 text-xl font-bold",
            available <= 0 ? "text-status-danger" : lowStock ? "text-status-warning" : "text-status-success"
          )}>
            {available}
          </p>
          <p className={cx(
            "text-[9px]",
            available <= 0 ? "text-status-danger/70" : lowStock ? "text-status-warning/70" : "text-status-success/70"
          )}>
            buyable now
          </p>
        </div>
      </div>

      {/* Order rules */}
      <div className="mb-5 divide-y divide-border rounded-xl border border-border bg-surface">
        {[
          { label: "Min order qty",   value: product.minOrderQty ?? 1 },
          { label: "Max order qty",   value: product.maxOrderQty ?? "—" },
          { label: "Step qty",        value: product.stepQty ?? 1 },
          { label: "Low stock alert", value: threshold > 0 ? `≤ ${threshold} units` : "Off" },
          { label: "Backorder",       value: product.allowBackorder ? "Allowed" : "Not allowed" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-semibold text-foreground-muted">{label}</span>
            <span className="text-sm font-medium text-foreground-heading">{String(value)}</span>
          </div>
        ))}
      </div>

      {/* Freshness dates */}
      {(product.harvestDate || product.expiryDate || product.batchId) && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            Freshness
          </p>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {product.harvestDate && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-semibold text-foreground-muted">Harvested</span>
                <span className="text-sm font-medium text-foreground-heading">
                  {fmtDate(product.harvestDate)}
                </span>
              </div>
            )}
            {product.expiryDate && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-semibold text-foreground-muted">Expires</span>
                <span className={cx(
                  "text-sm font-medium",
                  expired ? "text-status-danger font-bold" : "text-foreground-heading"
                )}>
                  {fmtDate(product.expiryDate)}
                  {expired && " (Expired)"}
                </span>
              </div>
            )}
            {product.batchId && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
                  <Tag className="h-3 w-3" />
                  Batch ID
                </span>
                <span className="font-mono text-xs font-medium text-foreground-heading">
                  {product.batchId}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
