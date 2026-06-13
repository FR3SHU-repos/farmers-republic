"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Heart,
  Leaf,
  Minus,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import type { Product } from "@/shared/interfaces/mongodb/products/product";
import { useCart } from "@/shared/context/CartContext";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cx } from "@/shared/lib/utils";

// ─── Sub-components ──────────────────────────────────────────

function StarRating({ value, count }: { value: number; count?: number }) {
  const rounded = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cx(
              "h-4 w-4",
              i < rounded
                ? "fill-yellow-400 text-yellow-400"
                : "text-tertiary"
            )}
          />
        ))}
      </div>
      <span className="text-sm text-foreground-muted">
        {value.toFixed(1)}
        {count ? ` (${count} reviews)` : ""}
      </span>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        {icon}
        <p className="text-sm font-medium text-foreground-heading">{value}</p>
      </div>
    </div>
  );
}

function PillBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
}) {
  const cls = {
    default: "bg-surface text-foreground-muted border-border",
    success:
      "bg-status-success-surface text-status-success border-status-success/30",
    warning:
      "bg-status-warning-surface text-status-warning border-status-warning/30",
    danger:
      "bg-status-danger-surface text-status-danger border-status-danger/30",
    accent: "bg-secondary text-secondary-foreground border-secondary/40",
  }[variant];

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        cls
      )}
    >
      {children}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useUser();

  const isFarmer = user?.type === "Farmer";

  const allImages = [
    ...(product.image ? [product.image] : []),
    ...(product.images?.filter((img) => img !== product.image) ?? []),
  ].filter(Boolean) as string[];

  const [activeImage, setActiveImage] = useState(allImages[0] ?? "");
  const [qty, setQty] = useState(product.minOrderQty ?? 1);
  const [wish, setWish] = useState(false);

  const step = product.stepQty ?? 1;
  const min = product.minOrderQty ?? 1;
  const max = product.maxOrderQty ?? 99;
  const outOfStock = product.inStock === false;

  const inc = () => setQty((q) => Math.min(q + step, max));
  const dec = () => setQty((q) => Math.max(q - step, min));

  const hasMrp =
    typeof product.mrp === "number" && product.mrp > product.price;
  const discount = hasMrp
    ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100)
    : 0;

  const unitLabel =
    product.unitQuantity && product.unit
      ? `${product.unitQuantity} ${product.unit}`
      : product.unit ?? "";

  const subtotal = product.price * qty;
  const farmerName =
    typeof product.farmer === "string" ? product.farmer : "";

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart({
      id: String(product.id),
      name: product.name,
      price: product.price,
      image: product.image,
      qty,
      farmerId: product.farmerId ? String(product.farmerId) : undefined,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  // ── Inline action panel (shared between sidebar + mobile bar) ──
  const ActionPanel = ({ compact = false }: { compact?: boolean }) => (
    <div className={cx("space-y-3", compact ? "" : "")}>
      {/* Quick stats */}
      <div className="flex gap-2 text-xs">
        <div className="flex flex-1 items-center gap-1.5 rounded-xl bg-surface px-3 py-2">
          <Zap className="h-3.5 w-3.5 flex-shrink-0 text-brand" />
          <span className="text-foreground-muted">
            {product.timeToSupply ?? "2–5 days"}
          </span>
        </div>
        <div className="flex flex-1 items-center gap-1.5 rounded-xl bg-surface px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-status-success" />
          <span className="text-foreground-muted">
            {outOfStock
              ? "Out of stock"
              : product.stockQty
              ? `${product.stockQty} left`
              : "In stock"}
          </span>
        </div>
      </div>

      {/* Qty */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Quantity{unitLabel ? ` (${unitLabel})` : ""}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
            <button
              onClick={dec}
              disabled={qty <= min}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-bold text-foreground-heading">
              {qty}
            </span>
            <button
              onClick={inc}
              disabled={qty >= max}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm font-bold text-foreground-heading">
            = ₹{subtotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* CTAs */}
      <button
        onClick={handleAddToCart}
        disabled={outOfStock}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-surface-card py-3 text-sm font-semibold text-primary transition hover:bg-surface disabled:opacity-40"
      >
        <ShoppingCart className="h-4 w-4" />
        Add to cart
      </button>
      <button
        onClick={handleBuyNow}
        disabled={outOfStock}
        className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-40"
      >
        Buy now — ₹{subtotal.toFixed(2)}
      </button>

      {product.codAvailable !== false && (
        <p className="text-center text-xs text-foreground-muted">
          ✓ Cash on delivery available
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-1.5 font-medium text-foreground-muted transition hover:text-foreground-heading"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <span className="text-foreground-muted">/</span>
          <Link
            href="/products"
            className="text-foreground-muted transition hover:text-foreground-heading"
          >
            Products
          </Link>
          <span className="text-foreground-muted">/</span>
          <span className="line-clamp-1 text-foreground-heading">
            {product.name}
          </span>
        </nav>

        {/* Farmer edit banner — only visible to Farmer role */}
        {isFarmer && product.id && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-secondary/40 bg-secondary-subtle px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/20">
                <Sprout className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground-heading">
                  This is your product
                </p>
                <p className="text-xs text-foreground-muted">
                  Update stock, price, freshness dates and more
                </p>
              </div>
            </div>
            <Link
              href={`/products/${product.id}/edit`}
              className="flex flex-shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover"
            >
              <Pencil className="h-4 w-4" />
              Edit product
            </Link>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ── Left: Images + content ──────────────── */}
          <div className="space-y-5">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                {activeImage ? (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={activeImage}
                      alt={product.name}
                      fill
                      priority
                      className="object-cover"
                      sizes="(min-width:1024px) 55vw, 100vw"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-card">
                      <Sprout className="h-12 w-12 text-brand" />
                    </div>
                  </div>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={cx(
                        "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition",
                        activeImage === img
                          ? "border-primary"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product identity (mobile only — sidebar has it on desktop) */}
            <div className="rounded-2xl border border-border bg-surface-card p-5 lg:hidden">
              <ProductIdentity
                product={product}
                hasMrp={hasMrp}
                discount={discount}
                unitLabel={unitLabel}
                wish={wish}
                setWish={setWish}
              />
            </div>

            {/* Mobile action panel */}
            <div className="rounded-2xl border border-border bg-surface-card p-5 lg:hidden">
              <ActionPanel compact />
            </div>

            {/* Description */}
            {(product.description || product.shortDescription) && (
              <div className="rounded-2xl border border-border bg-surface-card p-5">
                <h2 className="mb-3 text-base font-semibold text-foreground-heading">
                  About this product
                </h2>
                {product.shortDescription && (
                  <p className="mb-2 text-sm font-medium text-foreground-body">
                    {product.shortDescription}
                  </p>
                )}
                {product.description && (
                  <p className="text-sm leading-7 text-foreground-muted">
                    {product.description}
                  </p>
                )}
              </div>
            )}

            {/* Health & Quality */}
            {(product.healthBenefits?.length ||
              product.isOrganic ||
              product.shelfLife ||
              product.certifications?.length ||
              product.storageInstructions ||
              product.originCountry) && (
              <div className="rounded-2xl border border-border bg-surface-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-subtle">
                    <Leaf className="h-4 w-4 text-brand" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground-heading">
                    Health & Quality
                  </h2>
                </div>

                {product.healthBenefits?.length ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {product.healthBenefits.map((b, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-secondary/50 bg-secondary-subtle px-3 py-1 text-xs font-medium text-foreground-body"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.isOrganic != null && (
                    <InfoTile
                      label="Organic"
                      value={product.isOrganic ? "Yes" : "No"}
                      icon={
                        product.isOrganic ? (
                          <BadgeCheck className="h-4 w-4 text-status-success" />
                        ) : undefined
                      }
                    />
                  )}
                  {product.shelfLife && (
                    <InfoTile label="Shelf Life" value={product.shelfLife} />
                  )}
                  {product.storageInstructions && (
                    <InfoTile
                      label="Storage"
                      value={product.storageInstructions}
                    />
                  )}
                  {product.originCountry && (
                    <InfoTile label="Origin" value={product.originCountry} />
                  )}
                  {product.ingredients?.length ? (
                    <InfoTile
                      label="Ingredients"
                      value={product.ingredients.join(", ")}
                    />
                  ) : null}
                </div>

                {product.certifications?.length ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.certifications.map((c, i) => (
                        <PillBadge key={i} variant="success">
                          <BadgeCheck className="mr-1 h-3 w-3" />
                          {c}
                        </PillBadge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Farmer */}
            {(product.farmerId || farmerName) && (
              <div className="rounded-2xl border border-border bg-surface-card p-5">
                <h2 className="mb-4 text-base font-semibold text-foreground-heading">
                  Grown by
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xl font-bold text-brand">
                    {(farmerName || "F")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    {product.farmerId ? (
                      <Link
                        href={`/farmers/${product.farmerId}`}
                        className="flex items-center gap-1 font-semibold text-foreground-heading transition hover:text-primary"
                      >
                        {farmerName || String(product.farmerId)}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <p className="font-semibold text-foreground-heading">
                        {farmerName}
                      </p>
                    )}
                    {product.sourceFrom && (
                      <p className="mt-0.5 text-sm text-foreground-muted">
                        {product.sourceFrom}
                      </p>
                    )}
                  </div>
                  {product.swadeshiPercent != null && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-foreground-muted">Swadeshi</p>
                      <p className="text-xl font-bold text-primary">
                        {product.swadeshiPercent}%
                      </p>
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, product.swadeshiPercent)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Logistics & Tax */}
            {(product.weightGrams ||
              product.codAvailable != null ||
              product.perishable != null ||
              product.fragile != null ||
              product.gstRate != null ||
              product.hsnCode) && (
              <div className="rounded-2xl border border-border bg-surface-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface">
                    <Truck className="h-4 w-4 text-foreground-body" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground-heading">
                    Shipping & Tax
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.weightGrams && (
                    <InfoTile label="Weight" value={`${product.weightGrams}g`} />
                  )}
                  {product.codAvailable != null && (
                    <InfoTile
                      label="COD"
                      value={product.codAvailable ? "Available" : "Not available"}
                    />
                  )}
                  {product.perishable != null && (
                    <InfoTile
                      label="Perishable"
                      value={product.perishable ? "Yes" : "No"}
                    />
                  )}
                  {product.fragile != null && (
                    <InfoTile
                      label="Fragile"
                      value={product.fragile ? "Yes" : "No"}
                    />
                  )}
                  {product.gstRate != null && (
                    <InfoTile
                      label="GST"
                      value={`${product.gstRate}%${product.gstIncludedInPrice ? " (incl.)" : ""}`}
                    />
                  )}
                  {product.hsnCode && (
                    <InfoTile label="HSN Code" value={product.hsnCode} />
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Attributes */}
            {product.attributes &&
              Object.keys(product.attributes).length > 0 && (
                <div className="rounded-2xl border border-border bg-surface-card p-5">
                  <h2 className="mb-3 text-base font-semibold text-foreground-heading">
                    Additional Details
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Object.entries(product.attributes).map(([k, v]) => (
                      <InfoTile
                        key={k}
                        label={k}
                        value={String(v)}
                      />
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* ── Right: sticky action sidebar ──────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-surface-card p-6">
                <ProductIdentity
                  product={product}
                  hasMrp={hasMrp}
                  discount={discount}
                  unitLabel={unitLabel}
                  wish={wish}
                  setWish={setWish}
                />
              </div>

              <div className="rounded-2xl border border-border bg-surface-card p-6">
                <ActionPanel />
              </div>

              {product.purchasedLast30Days ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-secondary/40 bg-secondary-subtle/60 px-4 py-3">
                  <Package className="h-4 w-4 flex-shrink-0 text-brand" />
                  <p className="text-xs font-medium text-foreground-body">
                    <span className="font-bold text-foreground-heading">
                      {product.purchasedLast30Days}
                    </span>{" "}
                    people bought this in the last 30 days
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ──────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface-card px-4 py-3 safe-area-bottom lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {/* Inline qty */}
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-background p-1">
            <button
              onClick={dec}
              disabled={qty <= min}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-foreground-heading">
              {qty}
            </span>
            <button
              onClick={inc}
              disabled={qty >= max}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-primary bg-surface-card text-sm font-semibold text-primary transition hover:bg-surface disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
          </button>

          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-40"
          >
            Buy — ₹{subtotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product identity block (name, badges, price, rating) ────

function ProductIdentity({
  product,
  hasMrp,
  discount,
  unitLabel,
  wish,
  setWish,
}: {
  product: Product;
  hasMrp: boolean;
  discount: number;
  unitLabel: string;
  wish: boolean;
  setWish: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.category && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
              {product.category}
            </p>
          )}
          <h1 className="text-xl font-bold leading-snug text-foreground-heading sm:text-2xl">
            {product.name}
          </h1>
        </div>
        <button
          onClick={() => setWish(!wish)}
          className={cx(
            "flex-shrink-0 rounded-full border p-2 transition",
            wish
              ? "border-rose-200 bg-rose-50 text-rose-500"
              : "border-border bg-background text-foreground-muted hover:text-rose-400"
          )}
        >
          <Heart className={cx("h-5 w-5", wish ? "fill-rose-500" : "")} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {product.badge && (
          <PillBadge variant="accent">{product.badge}</PillBadge>
        )}
        {product.isOrganic && (
          <PillBadge variant="success">Organic</PillBadge>
        )}
        {product.isFeatured && (
          <PillBadge variant="warning">Featured</PillBadge>
        )}
        {product.inStock === false && (
          <PillBadge variant="danger">Out of stock</PillBadge>
        )}
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-extrabold text-foreground-heading">
          ₹{product.price.toFixed(2)}
        </span>
        {unitLabel && (
          <span className="text-sm text-foreground-muted">/ {unitLabel}</span>
        )}
        {hasMrp && (
          <>
            <span className="text-base text-foreground-muted line-through">
              ₹{product.mrp!.toFixed(2)}
            </span>
            <PillBadge variant="accent">{discount}% OFF</PillBadge>
          </>
        )}
      </div>

      {/* Rating */}
      {product.rating != null && product.rating > 0 && (
        <StarRating value={product.rating} count={product.reviewsCount} />
      )}

      {/* SKU */}
      {product.sku && (
        <p className="text-xs text-foreground-muted">SKU: {product.sku}</p>
      )}
    </div>
  );
}
