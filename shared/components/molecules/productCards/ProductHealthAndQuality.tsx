// shared/components/molecules/productCards/ProductHealthAndQuality.tsx

"use client";

import React from "react";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";

// We don't care about the exact farmer type here, so override it to `any`
type ProductForHealth = Omit<ProductBase, "farmer"> & {
  farmer?: any;
};

type Props = {
  product: ProductForHealth;
};

// This is for health and quality info of the product
export const ProductHealthAndQuality: React.FC<Props> = ({ product }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h4 className="font-semibold">Health & Quality</h4>
      <div className="mt-3 text-sm text-stone-600 space-y-2">
        <div>
          <span className="text-stone-500">Health benefits:</span>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {product.healthBenefits && product.healthBenefits.length > 0 ? (
              product.healthBenefits.map((hb, i) => <li key={i}>{hb}</li>)
            ) : (
              <li>No specific claims listed.</li>
            )}
          </ul>
        </div>

        <div>
          <span className="text-stone-500">Shelf life: </span>
          {product.shelfLife || "-"}
        </div>

        <div>
          <span className="text-stone-500">Storage instructions: </span>
          {product.storageInstructions || "-"}
        </div>

        <div>
          <span className="text-stone-500">Ingredients: </span>
          {product.ingredients?.length
            ? product.ingredients.join(", ")
            : "-"}
        </div>

        <div>
          <span className="text-stone-500">Origin country: </span>
          {product.originCountry || "India"}
        </div>

        <div>
          <span className="text-stone-500">Organic: </span>
          {product.isOrganic ? "Yes" : "No"}
        </div>

        <div>
          <span className="text-stone-500">Certifications: </span>
          {product.certifications?.length
            ? product.certifications.join(", ")
            : "-"}
        </div>
      </div>
    </div>
  );
};
