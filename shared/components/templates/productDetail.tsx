// components/ProductDetail.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { cx } from "@/shared/lib/utils";

export type Farmer = {
  name: string;
  location: string;
  phone?: string;
  avatar?: string;
  farmName?: string;
  about?: string;
};

export type ProductDetail = {
  id: number | string;
  name: string;
  image: string;
  price: number;
  rating: number; // 0-5
  reviewsCount?: number;
  sourceFrom: string;
  purchasedLast30Days: number;
  farmer: Farmer;
  swadeshiPercent?: number; // 0-100
  healthBenefits?: string[]; 
  timeToSupply?: string; // e.g. "2-4 days"
  tags?: string[]; // health products, categories
  fssai?: string;
  shelfLife?: string; // e.g. "12 months"
  description?: string;
};

function Rating({ value, count }: { value: number; count?: number }) {
  const stars = new Array(5).fill(0).map((_, i) => i + 1 <= Math.round(value));
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {stars.map((on, idx) => (
          <Star
            key={idx}
            className={cx("w-4 h-4", on ? "text-yellow-400" : "text-stone-300")}
            aria-hidden
          />
        ))}
      </div>
      <div className="text-sm text-stone-500">
        {value.toFixed(1)} {count ? `· ${count} reviews` : ""}
      </div>
    </div>
  );
}

export default function ProductDetail({ product }: { product: ProductDetail }) {
  const [qty, setQty] = useState<number>(1);
  const [wish, setWish] = useState(false);

  const subtotal = useMemo(() => product.price * qty, [product.price, qty]);

  const inc = () => setQty((q) => Math.min(q + 1, 99));
  const dec = () => setQty((q) => Math.max(q - 1, 1));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Image */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden bg-stone-50 shadow">
            <div className="relative w-full h-[420px] sm:h-[520px]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              />
            </div>
          </div>

          {/* small gallery stub */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="h-20 rounded-md bg-stone-100" />
            <div className="h-20 rounded-md bg-stone-100" />
            <div className="h-20 rounded-md bg-stone-100" />
          </div>
        </div>

        {/* Middle: details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-stone-900">₹{product.price.toFixed(2)}</div>
                <Rating value={product.rating} count={product.reviewsCount} />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWish((s) => !s)}
                  aria-pressed={wish}
                  className={cx(
                    "p-2 rounded-full border hover:bg-stone-100",
                    wish ? "bg-rose-50 border-rose-200" : "bg-white"
                  )}
                >
                  <Heart className={cx("w-5 h-5", wish ? "text-rose-500" : "text-stone-500")} />
                </button>
              </div>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-stone-600">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-stone-400">Source from</div>
              <div className="font-medium text-stone-800 mt-1">{product.sourceFrom}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-stone-400">Bought (30 days)</div>
              <div className="font-medium text-stone-800 mt-1">{product.purchasedLast30Days}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-stone-400">Time to supply</div>
              <div className="font-medium text-stone-800 mt-1">{product.timeToSupply || "2-5 days"}</div>
            </div>
          </div>

          {/* Farmer details + swadeshi */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-stone-800">Farmer / Source</h3>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 flex-none">
                {product.farmer.avatar ? (
                  <Image src={product.farmer.avatar} alt={product.farmer.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-stone-500">{product.farmer.name?.[0]}</div>
                )}
              </div>
              <div>
                <div className="font-medium">{product.farmer.name}</div>
                <div className="text-sm text-stone-500">{product.farmer.farmName || ""}</div>
                <div className="text-sm text-stone-500 mt-1">📍 {product.farmer.location}</div>
                {product.farmer.phone && <div className="text-sm mt-1">📞 {product.farmer.phone}</div>}
              </div>
              <div className="ml-auto mt-3 sm:mt-0">
                <div className="text-xs text-stone-400">Swadeshi</div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-stone-800">{product.swadeshiPercent ?? 0}%</div>
                  <div className="w-36 bg-stone-100 h-2 rounded">
                    <div
                      className="h-2 rounded bg-green-600"
                      style={{ width: `${Math.max(0, Math.min(100, product.swadeshiPercent || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {product.farmer.about && (
              <p className="mt-3 text-sm text-stone-600">{product.farmer.about}</p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold">Description</h3>
              <p className="mt-2 text-sm text-stone-600">{product.description}</p>
            </div>
          )}

          {/* Health & product info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold">Health Benefits</h4>
              <ul className="mt-3 list-disc pl-5 text-sm text-stone-600 space-y-2">
                {(product.healthBenefits && product.healthBenefits.length > 0) ? (
                  product.healthBenefits.map((hb, i) => <li key={i}>{hb}</li>)
                ) : <li>No specific claims listed.</li>}
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold">Product Info</h4>
              <div className="mt-3 text-sm text-stone-600 space-y-2">
                <div><span className="text-stone-500">Tags: </span>{product.tags?.join(", ") || "-"}</div>
                <div><span className="text-stone-500">FSSAI: </span>{product.fssai || "-"}</div>
                <div><span className="text-stone-500">Shelf life: </span>{product.shelfLife || "-"}</div>
              </div>
            </div>
          </div>

          {/* Action row (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
              <button aria-label="Decrease" onClick={dec} className="px-3 py-1 rounded-md border hover:bg-stone-50">-</button>
              <div className="w-12 text-center font-medium">{qty}</div>
              <button aria-label="Increase" onClick={inc} className="px-3 py-1 rounded-md border hover:bg-stone-50">+</button>
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
        </div>
      </div>

      {/* Sticky mobile buy bar */}
      <div className="fixed left-0 right-0 bottom-0 sm:hidden bg-white border-t shadow-lg p-3 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative rounded-md overflow-hidden bg-stone-100">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold">{product.name}</div>
              <div className="text-xs text-stone-500">₹{product.price.toFixed(2)}</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg px-2 py-1">
              <button onClick={dec} aria-label="Decrease" className="px-2">-</button>
              <div className="w-6 text-center text-sm">{qty}</div>
              <button onClick={inc} aria-label="Increase" className="px-2">+</button>
            </div>

            <button className="px-4 py-2 rounded-full bg-green-600 text-white font-semibold">
              Buy — ₹{subtotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
