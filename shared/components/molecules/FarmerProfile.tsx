// shared/components/FarmerProfile.tsx
"use client";

import React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Farmer } from "@/shared/interfaces/mongodb/farmer"; // 👈 new source of truth
import { Phone, MapPin } from "lucide-react";
import ProductFarmerCard from "@/shared/components/molecules/FarmerProductCard";

export default function FarmerProfile({ farmer,farmerId }: { farmer: Farmer, farmerId: string }) {
  
  // Format createdAt nicely if it exists
  const createdAtText =
    farmer.createdAt instanceof Date
      ? farmer.createdAt.toLocaleDateString()
      : farmer.createdAt
      ? new Date(farmer.createdAt).toLocaleDateString()
      : null;


      type Product = {
        _id: string;
        name: string;
        price?: number;
        image?: string;
      };

      const [products, setProducts] = useState<Product[]>([]);

      useEffect(() => {
        async function loadProducts() {
          if (!farmerId) return;

          const res = await fetch(`/api/v1/products/by-farmer/${farmerId}`);
          const json = await res.json();

          setProducts((json.data?.items as Product[]) || []);
        }

        loadProducts();
        console.log("Loading products for farmer:", farmerId);
      }, [farmer]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: image + basic meta + contact */}
        <div className="md:col-span-1 space-y-4">
          {/* Avatar */}
          <div className="rounded-2xl overflow-hidden bg-stone-50 shadow">
            <div className="relative w-full h-72">
              {farmer.avatar ? (
                <Image
                  src={farmer.avatar}
                  alt={farmer.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Farm details: area + category + since */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs text-stone-500">Farm area</div>
                <div className="text-sm font-medium">
                  {farmer.farmArea || "-"}
                </div>
              </div>

              <div className="flex-1 text-right">
                <div className="text-xs text-stone-500">Category</div>
                <div className="text-sm font-medium">
                  {farmer.category || "-"}
                </div>
              </div>
            </div>

            {createdAtText && (
              <div className="pt-2 border-t border-stone-100 text-xs text-stone-500">
                Onboarded:{" "}
                <span className="font-medium text-stone-700">
                  {createdAtText}
                </span>
              </div>
            )}
          </div>

          {/* Contact card */}
          <div className="bg-white p-3 rounded-xl shadow-sm space-y-2">
            <div className="text-sm text-stone-500">Contact</div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-500" />
                <div className="text-sm">{farmer.phone || "—"}</div>
              </div>
              {farmer.phone && (
                <a
                  href={`tel:${farmer.phone}`}
                  className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium"
                >
                  Call
                </a>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
              <MapPin className="w-4 h-4" />
              <div>{farmer.place || "-"}</div>
            </div>
          </div>
        </div>

        {/* Right: main details */}
        <div className="md:col-span-2 space-y-6">
          {/* Name + farmName + about */}
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">
              {farmer.name}
            </h1>

            {farmer.farmName && (
              <div className="text-sm text-stone-500 mt-1">
                {farmer.farmName}
              </div>
            )}

            {farmer.category && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-[11px] font-semibold text-green-700 border border-green-100">
                {farmer.category}
              </div>
            )}

            {farmer.about && (
              <p className="mt-4 text-sm text-stone-600 leading-relaxed">
                {farmer.about}
              </p>
            )}
          </div>

          

          {/* Optional: simple info card so page doesn’t look empty
              (only shows rows that actually have data) */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
            <h3 className="font-semibold text-stone-800 mb-2 text-sm">
              Farm details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
              {farmer.farmArea && (
                <div>
                  <span className="text-stone-500">Area: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.farmArea}
                  </span>
                </div>
              )}
              {farmer.place && (
                <div>
                  <span className="text-stone-500">Location: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.place}
                  </span>
                </div>
              )}
              {farmer.phone && (
                <div>
                  <span className="text-stone-500">Phone: </span>
                  <a
                    className="font-medium text-green-700"
                    href={`tel:${farmer.phone}`}
                  >
                    {farmer.phone}
                  </a>
                </div>
              )}
            </div>

            {!farmer.farmArea && !farmer.place && !farmer.phone && (
              <div className="text-xs text-stone-400">
                No additional farm details provided yet.
              </div>
            )}
          </div>

          <ProductFarmerCard products={products} />

        </div>
      </div>
    </div>
  );
}
