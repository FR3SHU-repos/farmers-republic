// shared/components/FarmerCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Farmer } from "@/shared/data/farmers";
import { cx } from "@/shared/lib/utils";

export default function FarmerCard({ farmer }: { farmer: Farmer }) {
  return (
    <Link href={`/farmers/${farmer.id}`} className="block">
      <article
        className={cx(
          "bg-white rounded-2xl shadow-sm hover:shadow-md transition p-4 flex gap-4 h-full",
        )}
        aria-labelledby={`farmer-${farmer.id}`}
      >
        <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
          {farmer.avatar ? (
            <Image src={farmer.avatar} alt={farmer.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-stone-400">
              {farmer.name?.[0]}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 id={`farmer-${farmer.id}`} className="text-lg font-semibold text-stone-800">
            {farmer.name}
          </h3>
          {farmer.farmName && <div className="text-sm text-stone-500">{farmer.farmName}</div>}
          <div className="mt-2 text-sm text-stone-600 line-clamp-2">
            {farmer.about ?? "No profile bio available."}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">{farmer.place}</div>
            <div className="px-2 py-1 rounded-full bg-amber-50 text-amber-700">{farmer.fpo ?? "Independent"}</div>
            <div className="px-2 py-1 rounded-full bg-stone-100 text-stone-700">
              {farmer.last30daysSales ?? 0} sold (30d)
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
