"use client";

import React from "react";
import { Leaf } from "lucide-react";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";

type ProductForHealth = Omit<ProductBase, "farmer"> & { farmer?: any };

export const ProductHealthAndQuality = ({ product }: { product: ProductForHealth }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900">Health & Quality</h2>
          <p className="text-sm text-stone-500">Benefits, shelf life & origin</p>
        </div>
      </div>

      {/* Health Benefits */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-stone-600 tracking-wider mb-2">
          HEALTH BENEFITS
        </h3>

        <div className="flex flex-wrap gap-2">
          {product.healthBenefits?.length ? (
            product.healthBenefits.map((hb, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200"
              >
                {hb}
              </span>
            ))
          ) : (
            <span className="text-sm text-stone-500">No benefits listed</span>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

        <InfoCard
          title="SHELF LIFE"
          value={product.shelfLife || "—"}
        />
        <InfoCard
          title="STORAGE"
          value={product.storageInstructions || "Normal conditions"}
        />
        <InfoCard
          title="INGREDIENTS"
          value={
            product.ingredients?.length
              ? product.ingredients.join(", ")
              : "Not specified"
          }
        />
        <InfoCard
          title="ORIGIN COUNTRY"
          value={product.originCountry || "India"}
        />
        <InfoCard
          title="ORGANIC"
          value={product.isOrganic ? "Yes" : "No"}
        />
      </div>
    </div>
  );
};

/* Reusable mini-card component */
const InfoCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="bg-green-50 rounded-2xl border border-green-100 px-4 py-3 flex flex-col gap-1 h-full">
      <span className="text-[11px] font-semibold text-green-700 tracking-wide leading-snug break-words">
        {title}
      </span>

      <span className="text-sm font-medium text-stone-900 leading-relaxed break-words">
        {value}
      </span>
    </div>
  );
};

