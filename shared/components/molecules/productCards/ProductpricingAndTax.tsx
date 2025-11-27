"use client";

import React from "react";
import { IndianRupee, ReceiptCent } from "lucide-react";
import type { Product as ProductBase } from "@/shared/interfaces/mongodb/products/product";

// we don’t care about exact farmer type here either
type ProductForPricing = Omit<ProductBase, "farmer"> & { farmer?: any };

type Props = {
  product: ProductForPricing;
  unitLabel?: string; // ex: "1 kg", "500 ml"
};

export const ProductPricingAndTax: React.FC<Props> = ({ product, unitLabel }) => {
  const price = product.price ?? 0;
  const hasMrp = typeof product.mrp === "number" && product.mrp > price;
  const discountPercent = hasMrp
    ? Math.round(((product.mrp! - price) / product.mrp!) * 100)
    : 0;

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-stone-900">
              Pricing & Tax
            </h2>
            <p className="text-xs text-stone-500">
              Final price, discount & GST info
            </p>
          </div>
        </div>

        {hasMrp && (
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1">
            <ReceiptCent className="w-3 h-3 text-emerald-700" />
            <span className="text-xs font-semibold text-emerald-700">
              {discountPercent}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Main price line */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-stone-900">
            ₹{price.toFixed(2)}
            {unitLabel && (
              <span className="text-xs text-stone-500 font-normal">
                {" "}
                / {unitLabel}
              </span>
            )}
          </div>

          {hasMrp && (
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-stone-400 line-through">
                ₹{product.mrp!.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <p className="mt-1 text-[11px] text-stone-500">
          {product.gstIncludedInPrice
            ? "Price shown is inclusive of GST."
            : "GST will be calculated at checkout."}
        </p>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-stone-800">
        <MetaRow label="Currency" value={product.currency || "INR"} />
        <MetaRow label="HSN code" value={product.hsnCode || "—"} />
        <MetaRow
          label="GST rate"
          value={
            product.gstRate != null ? `${product.gstRate}%` : "Not specified"
          }
        />
        <MetaRow
          label="Price type"
          value={product.gstIncludedInPrice ? "GST inclusive" : "GST exclusive"}
        />
      </div>
    </section>
  );
};

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase">
      {label}
    </span>
    <span className="text-sm text-stone-900">{value}</span>
  </div>
);
