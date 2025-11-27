"use client";

import React from "react";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";
import { Package } from "lucide-react";

/** Override farmer field — we don’t use it here */
type ProductForInventory = Omit<ProductBase, "farmer"> & {
  farmer?: any;
};

type Props = {
  product: ProductForInventory;
};

export const ProductInventoryAndQty: React.FC<Props> = ({ product }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-green-100 p-3 rounded-xl">
          <Package className="w-6 h-6 text-green-700" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-stone-900">Qty & Inventory</h2>
          <p className="text-sm text-stone-500">
            Stock, order limits & availability
          </p>
        </div>
      </div>

      {/* Grid of mini cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="font-semibold text-green-700 text-sm uppercase">
            Stock Quantity
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.stockQty ?? "-"}
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="font-semibold text-green-700 text-sm uppercase">
            In Stock
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.inStock ? "Yes" : "No"}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="font-semibold text-green-700 text-sm uppercase">
            Min Order Qty
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.minOrderQty ?? 1}
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="font-semibold text-green-700 text-sm uppercase">
            Max Order Qty
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.maxOrderQty ?? "-"}
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="font-semibold text-green-700 text-sm uppercase">
            Step Quantity
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.stepQty ?? 1}
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="font-semibold text-green-700 text-sm uppercase">
            Backorder Allowed
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.allowBackorder ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
};
