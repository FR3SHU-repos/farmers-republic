"use client";

import React from "react";
import { Truck } from "lucide-react";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";

// We don’t need exact farmer typing here
type ProductForLogistics = Omit<ProductBase, "farmer"> & {
  farmer?: any;
};

type Props = {
  product: ProductForLogistics;
};

export const ProductLogisticsAndShipping: React.FC<Props> = ({ product }) => {
  const dimensions = product.dimensionsCm
    ? `${product.dimensionsCm.length} × ${product.dimensionsCm.width} × ${product.dimensionsCm.height} cm`
    : "-";

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-green-100 p-3 rounded-xl">
          <Truck className="w-6 h-6 text-green-700" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-stone-900">
            Logistics & Shipping
          </h2>
          <p className="text-sm text-stone-500">
            Product type, weight & delivery constraints
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product type */}
        <InfoTile
          label="Product type"
          value={product.productType || "physical"}
        />

        {/* Weight */}
        <InfoTile
          label="Weight (grams)"
          value={
            typeof product.weightGrams === "number"
              ? `${product.weightGrams} g`
              : "Not specified"
          }
        />

        {/* Dimensions */}
        <InfoTile
          label="Dimensions"
          value={dimensions}
        />

        {/* COD */}
        <InfoTile
          label="COD available"
          value={product.codAvailable ? "Yes" : "No"}
        />

        {/* Fragile */}
        <InfoTile
          label="Fragile"
          value={product.fragile ? "Yes" : "No"}
        />

        {/* Perishable */}
        <InfoTile
          label="Perishable"
          value={product.perishable ? "Yes" : "No"}
        />
      </div>
    </section>
  );
};

const InfoTile = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="bg-green-50 rounded-xl border border-green-100 px-4 py-3 flex flex-col h-full">
    <span className="text-[11px] font-semibold text-green-700 tracking-wide uppercase mb-1 leading-snug">
      {label}
    </span>
    <span className="text-sm font-medium text-stone-900 leading-relaxed break-words">
      {value}
    </span>
  </div>
);
