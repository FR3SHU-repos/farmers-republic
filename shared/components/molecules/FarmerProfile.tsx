// shared/components/FarmerProfile.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Farmer } from "@/shared/data/farmers";
import { Phone, MapPin, Users } from "lucide-react";
import { cx } from "@/shared/lib/utils";

export default function FarmerProfile({ farmer }: { farmer: Farmer }) {
  const swadeshi = Math.max(0, Math.min(100, farmer.swadeshiPercent ?? 0));
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: image */}
        <div className="md:col-span-1">
          <div className="rounded-2xl overflow-hidden bg-stone-50 shadow">
            <div className="relative w-full h-72">
              {farmer.avatar ? (
                <Image src={farmer.avatar} alt={farmer.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400">No Image</div>
              )}
            </div>
          </div>

          <div className="mt-4 bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-stone-500">Farm area</div>
                <div className="font-medium">{farmer.farmArea ?? "-"}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-stone-500">Swadeshi</div>
                <div className="font-medium">{swadeshi}%</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-2 bg-green-600" style={{ width: `${swadeshi}%` }} />
              </div>
            </div>

            <div className="mt-3 text-sm text-stone-600">
              <div><strong>FPO:</strong> {farmer.fpo ?? "Independent"}</div>
              <div className="mt-1"><strong>Established:</strong> {farmer.established ?? "—"}</div>
            </div>
          </div>

          <div className="mt-4 bg-white p-3 rounded-xl shadow-sm space-y-2">
            <div className="text-sm text-stone-500">Contact</div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-500" />
                <div className="text-sm">{farmer.phone ?? "—"}</div>
              </div>
              {farmer.phone && (
                <a href={`tel:${farmer.phone}`} className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                  Call
                </a>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
              <MapPin className="w-4 h-4" />
              <div>{farmer.place ?? "-"}</div>
            </div>
          </div>
        </div>

        {/* Right: details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-800">{farmer.name}</h1>
            {farmer.farmName && <div className="text-sm text-stone-500 mt-1">{farmer.farmName}</div>}
            {farmer.about && <p className="mt-4 text-stone-600">{farmer.about}</p>}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-stone-800 mb-3">Crops grown</h3>
            <div className="flex flex-wrap gap-3">
              {farmer.crops.map((c) => (
                <div key={c} className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-stone-800 mb-3">Products produced</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {farmer.products.map((prod) => (
                <div key={prod.name} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{prod.name}</div>
                    {prod.id && <div className="text-xs text-stone-500">Product ID: {prod.id}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-stone-500">Certifications</div>
              <div className="mt-2 text-sm">{(farmer.certifications && farmer.certifications.join(", ")) || "-"}</div>
            </div>

            <div>
              <div className="text-sm text-stone-500">Sold (last 30 days)</div>
              <div className="mt-2 font-medium">{farmer.last30daysSales ?? 0}</div>
            </div>

            <div>
              <div className="text-sm text-stone-500">Phone</div>
              <div className="mt-2">
                {farmer.phone ? (
                  <a className="text-green-700 font-medium" href={`tel:${farmer.phone}`}>{farmer.phone}</a>
                ) : <span>-</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
