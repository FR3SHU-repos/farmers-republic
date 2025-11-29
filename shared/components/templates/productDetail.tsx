// components/ProductDetail.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { cx } from "@/shared/lib/utils";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";
import Link from "next/link";
import { ProductHealthAndQuality } from "../molecules/productCards/ProductHealthAndQuality";
import { ProductPricingAndTax } from "../molecules/productCards/ProductpricingAndTax";
import { ProductInventoryAndQty } from "../molecules/productCards/ProductqtyAndInventory";
import { ProductCategoryAndMerch } from "../molecules/productCards/ProductCategoryAndMerch";
import { ProductLogisticsAndShipping } from "../molecules/productCards/ProductLogisticsAndShipping";
import { useUser } from "@/shared/context/UserContext";

// 👉 local type for populated farmer (what your API actually returns here)
type PopulatedFarmer = {
  name?: string;
  avatar?: string;
  farmName?: string;
  location?: string;
  phone?: string;
  about?: string;
};

// 👉 override the `farmer` field only for this component
type ProductDetail = Omit<ProductBase, "farmer"> & {
  farmer?: PopulatedFarmer;
};

function Rating({ value, count }: { value: number; count?: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const stars = new Array(5)
    .fill(0)
    .map((_, i) => i + 1 <= Math.round(safeValue));



  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {stars.map((on, idx) => (
          <Star
            key={idx}
            className={cx(
              "w-4 h-4",
              on ? "text-yellow-400" : "text-stone-300",
            )}
            aria-hidden
          />
        ))}
      </div>
      <div className="text-sm text-stone-500">
        {safeValue.toFixed(1)}
        {count ? ` · ${count} reviews` : ""}
      </div>
    </div>
  );
}

export default function ProductDetail({ product }: { product: ProductDetail }) {
  const [qty, setQty] = useState<number>(1);
  const [wish, setWish] = useState(false);
  const { user, login, logout } = useUser();

  const mainImage =
    product.image || product.images?.[0] || "/placeholder.png";

  const [activeImage, setActiveImage] = useState<string>(mainImage);

  const subtotal = useMemo(
    () => (product.price ?? 0) * qty,
    [product.price, qty],
  );

  const inc = () => setQty((q) => Math.min(q + 1, 99));
  const dec = () => setQty((q) => Math.max(q - 1, 1));

  // Derived values
  const hasMrp =
    typeof product.mrp === "number" && product.mrp > (product.price ?? 0);
  const discountPercent = hasMrp
    ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100)
    : 0;

  const dimensions =
    product.dimensionsCm
      ? `${product.dimensionsCm.length} × ${product.dimensionsCm.width} × ${product.dimensionsCm.height} cm`
      : undefined;

  const unitLabel =
    product.unitQuantity && product.unit
      ? `${product.unitQuantity} ${product.unit}`
      : product.unit || "";

  const farmer = product.farmer; // nicely typed as PopulatedFarmer | undefined

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      style={{
        paddingBottom:
          "calc(56px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Image + gallery */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden bg-stone-50 shadow">
            <div className="relative w-full h-[420px] sm:h-[520px]">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              />
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-3 gap-4 h-20">
              {product.images.slice(0, 3).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className="relative w-full aspect-square rounded-xl overflow-hidden bg-stone-100 border border-transparent data-[active=true]:border-green-500"
                  data-active={activeImage === img}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: content */}
        <div className="lg:col-span-2 space-y-6 mt-4">
          {/* Title + price + rating + badges */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {product.name}

            </h1>
            <Link href={`/products/${product.id}/edit`} className="hover:underline">
            Edit Product
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {product.slug && (
                <span className="px-2 py-1 rounded-full bg-stone-100 text-stone-500">
                  /{product.slug}
                </span>
              )}
              {product.sku && (
                <span className="px-2 py-1 rounded-full bg-stone-100 text-stone-500">
                  SKU: {product.sku}
                </span>
              )}
              {product.status && (
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {product.status.toUpperCase()}
                </span>
              )}
              {product.badge && (
                <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                  {product.badge}
                </span>
              )}
              {product.label && (
                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {product.label}
                </span>
              )}
              {product.isFeatured && (
                <span className="px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
                  Featured
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-stone-900">
                    ₹{(product.price ?? 0).toFixed(2)}
                    {unitLabel ? (
                      <span className="text-sm text-stone-500">
                        {" "}
                        / {unitLabel}
                      </span>
                    ) : null}
                  </div>

                  {hasMrp && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-stone-400 line-through">
                        ₹{product.mrp!.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-green-600">
                        {discountPercent}% OFF
                      </span>
                    </div>
                  )}
                </div>

                <Rating
                  value={product.rating ?? 0}
                  count={product.reviewsCount}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWish((s) => !s)}
                  aria-pressed={wish}
                  className={cx(
                    "p-2 rounded-full border hover:bg-stone-100",
                    wish
                      ? "bg-rose-50 border-rose-200"
                      : "bg-white",
                  )}
                >
                  <Heart
                    className={cx(
                      "w-5 h-5",
                      wish ? "text-rose-500" : "text-stone-500",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Key stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-stone-600">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-stone-400">Source from</div>
              <div className="font-medium text-stone-800 mt-1">
                {product.sourceFrom || "-"}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-stone-400">
                Bought (last 30 days)
              </div>
              <div className="font-medium text-stone-800 mt-1">
                {product.purchasedLast30Days ?? 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-stone-400">Time to supply</div>
              <div className="font-medium text-stone-800 mt-1">
                {product.timeToSupply || "2–5 days"}
              </div>
            </div>
          </div>

          {/* Farmer details + swadeshi */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-stone-800">Farmer / Source</h3>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 flex-none relative">
                {farmer?.avatar ? (
                  <Image
                    src={farmer.avatar}
                    alt={farmer.name || product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-stone-500">
                    {product.farmerId ? (
                      <Link href={`/farmers/${product.farmerId}`}>
                        {farmer?.name?.[0] ?? "F"}
                      </Link>
                    ) : (
                      farmer?.name?.[0] ?? "F"
                    )}
                  </div>
                )}
              </div>

              <div>
                {product.farmerId ? (
                  <Link
                    href={`/farmers/${product.farmerId}`}
                    className="hover:underline"
                  >
                    <div className="font-medium">
                      {farmer?.name || product.farmerId}
                    </div>
                  </Link>
                ) : (
                  <div className="font-medium">
                    {farmer?.name || product.farmerId}
                  </div>
                )}

                {farmer?.farmName && (
                  <div className="text-sm text-stone-500">
                    {farmer.farmName}
                  </div>
                )}
                {farmer?.location && (
                  <div className="text-sm text-stone-500 mt-1">
                    📍 {farmer.location}
                  </div>
                )}
                {farmer?.phone && (
                  <div className="text-sm mt-1">📞 {farmer.phone}</div>
                )}
              </div>

              <div className="ml-auto mt-3 sm:mt-0">
                <div className="text-xs text-stone-400">Swadeshi</div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-stone-800">
                    {product.swadeshiPercent ?? 0}%
                  </div>
                  <div className="w-36 bg-stone-100 h-2 rounded">
                    <div
                      className="h-2 rounded bg-green-600"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, product.swadeshiPercent || 0),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {farmer?.about && (
              <p className="mt-3 text-sm text-stone-600">
                {farmer.about}
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold">Description</h3>
              <p className="mt-2 text-sm text-stone-600">
                {product.description}
              </p>
            </div>
          )}

          {/* Short description */}
          {product.shortDescription && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold">Quick summary</h3>
              <p className="mt-2 text-sm text-stone-600">
                {product.shortDescription}
              </p>
            </div>
          )}

          {/* Health & product info & pricing/tax/inventory/logistics/SEO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProductHealthAndQuality product={product} />

            {/* Product meta / category / inventory */}
            <div className="space-y-4">
              {/* Pricing & Tax */}
              <ProductPricingAndTax product={product} unitLabel={unitLabel} />

              {/* Inventory */}
              <ProductInventoryAndQty product={product} />

            </div>
          </div>

          {/* Category / Merch / Logistics / SEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category / Merch + Tags */}
            <ProductCategoryAndMerch product={product} />

            {/* Logistics */}
            <ProductLogisticsAndShipping product={product} />
          </div>

          {/* SEO / Meta */}
          {(product.seoTitle ||
            product.seoDescription ||
            (product.searchKeywords &&
              product.searchKeywords.length > 0)) && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold">SEO / Meta</h4>
              <div className="mt-3 text-sm text-stone-600 space-y-2">
                {product.seoTitle && (
                  <div>
                    <span className="text-stone-500">
                      SEO title:{" "}
                    </span>
                    {product.seoTitle}
                  </div>
                )}
                {product.seoDescription && (
                  <div>
                    <span className="text-stone-500">
                      SEO description:{" "}
                    </span>
                    {product.seoDescription}
                  </div>
                )}
                {product.searchKeywords &&
                  product.searchKeywords.length > 0 && (
                    <div>
                      <span className="text-stone-500">
                        Search keywords:{" "}
                      </span>
                      {product.searchKeywords.join(", ")}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Attributes (if you use them) */}
          {product.attributes &&
            Object.keys(product.attributes).length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold">Additional attributes</h4>
                <div className="mt-3 text-sm text-stone-600 space-y-1">
                  {Object.entries(product.attributes).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span className="text-stone-500 capitalize">
                          {key}:{" "}
                        </span>
                        {String(value)}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Desktop action row */}
          {user?.type === "buyer" && (
            
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
              <button
                aria-label="Decrease"
                onClick={dec}
                className="px-3 py-1 rounded-md border hover:bg-stone-50"
              >
                -
              </button>
              <div className="w-12 text-center font-medium">
                {qty}
              </div>
              <button
                aria-label="Increase"
                onClick={inc}
                className="px-3 py-1 rounded-md border hover:bg-stone-50"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button className="px-4 py-2 rounded-full bg-white border hover:bg-stone-50 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Add to cart
              </button>

              <button className="px-5 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700">
                Buy now — ₹{subtotal.toFixed(2)}
              </button>
            </div>
          </div>

          )}

          {/* Mobile buy bar (in-flow) */}
          {user?.type === "buyer" && (
          <div className="md:hidden mt-6 mb-20">
            <div className="bg-white border-t shadow-lg p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 relative rounded-md overflow-hidden bg-stone-100 flex-shrink-0">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {product.name}
                  </div>
                  <div className="text-xs text-stone-500">
                    ₹{(product.price ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>

              
              <div className="mt-3 flex items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={dec}
                    aria-label="Decrease"
                    className="px-3 py-1 border rounded"
                  >
                    -
                  </button>
                  <div className="w-10 text-center">{qty}</div>
                  <button
                    onClick={inc}
                    aria-label="Increase"
                    className="px-3 py-1 border rounded"
                  >
                    +
                  </button>
                </div>

                <button className="px-4 py-2 rounded-full bg-green-600 text-white font-semibold">
                  Buy — ₹{subtotal.toFixed(2)}
                </button>
              </div>
              

            </div>
          </div>
        )}
          {/* end mobile buy bar */}
        </div>
      </div>
    
</div>
    
  );
}
