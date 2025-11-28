// This is for product category and merchandise

"use client";

import React from "react";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";
import { Tags } from "lucide-react";

type ProductForCategory = Omit<ProductBase, "farmer"> & {
  farmer?: any;
};

type Props = {
  product: ProductForCategory;
};

export const ProductCategoryAndMerch: React.FC<Props> = ({ product }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-green-100 p-3 rounded-xl">
          <Tags className="w-6 h-6 text-green-700" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-stone-900">
            Category & Merchandising
          </h2>
          <p className="text-sm text-stone-500">
            Classification, discovery & listing metadata
          </p>
        </div>
      </div>

      {/* Grid of mini cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CATEGORY */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="text-green-700 font-semibold text-sm uppercase">
            Category
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.category || "-"}
          </div>
        </div>

        {/* SUB CATEGORY */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="text-green-700 font-semibold text-sm uppercase">
            Sub-Category
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.subCategory || "-"}
          </div>
        </div>

        {/* TAGS */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 col-span-1 sm:col-span-2">
          <div className="text-green-700 font-semibold text-sm uppercase">
            Tags
          </div>
          <div className="mt-1 text-stone-800 text-lg flex flex-wrap gap-2">
            {product.tags?.length ? (
              product.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white border border-green-200 text-green-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))
            ) : (
              "-"
            )}
          </div>
        </div>

        {/* SORT PRIORITY */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="text-green-700 font-semibold text-sm uppercase">
            Sort Priority
          </div>
          <div className="mt-1 text-stone-800 text-lg">
            {product.sortPriority ?? "-"}
          </div>
        </div>
      </div>
    </div>
  );
};
