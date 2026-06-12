// shared/components/FarmerCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  BadgeCheck,
  Leaf,
  MapPin,
  Ruler,
  TrendingUp,
} from "lucide-react";

/**
 * Use a lightweight preview type for list cards (only what the card needs).
 * This avoids forcing the list page to supply full Farmer objects.
 */
type FarmerPreview = {
  id: string;
  name: string;
  farmName?: string | null;
  avatar?: string | null;
  about?: string | null;
  place?: string | null;
  fpo?: string | null;
  category?: string | null;
  farmArea?: string | null;
  last30daysSales?: number | null;
};

export default function FarmerCard({ farmer }: { farmer: FarmerPreview }) {
  return (
    <Link href={`/farmers/${farmer.id}`} className="group block h-full">
      <article
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-[0_18px_50px_rgba(15,61,46,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,61,46,0.14)]"
        aria-labelledby={`farmer-${farmer.id}`}
      >
        <div className="relative h-56 overflow-hidden bg-lime-50">
          {farmer.avatar ? (
            <Image
              src={farmer.avatar}
              alt={farmer.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(190,242,100,0.42),transparent_32%),linear-gradient(135deg,#ecfccb,#ccfbf1)]">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/80 text-3xl font-semibold text-emerald-950 shadow-sm">
                {farmer.name?.[0] ?? "F"}
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950/60 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-sm backdrop-blur">
              <Leaf className="h-3.5 w-3.5 text-lime-600" />
              {farmer.category || "Farmer"}
            </span>
            {farmer.fpo && (
              <span className="rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                FPO
              </span>
            )}
          </div>
          <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-900 shadow-lg transition group-hover:bg-lime-300">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3
                id={`farmer-${farmer.id}`}
                className="truncate text-xl font-semibold text-emerald-950"
              >
                {farmer.name}
              </h3>
              {farmer.farmName && (
                <p className="mt-1 truncate text-sm font-medium text-stone-500">
                  {farmer.farmName}
                </p>
              )}
            </div>
            <BadgeCheck className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600" />
          </div>

          <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">
            {farmer.about ?? "No profile bio available."}
          </p>

          <div className="mt-5 grid gap-2 text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 text-emerald-700" />
              <span className="truncate">{farmer.place ?? "Location pending"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 flex-shrink-0 text-emerald-700" />
              <span>{farmer.farmArea ?? "Farm area not listed"}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-stone-600">
              <TrendingUp className="h-4 w-4 text-lime-600" />
              <span className="font-semibold text-emerald-900">
                {farmer.last30daysSales ?? 0}
              </span>
              sold in 30d
            </span>
            <span className="font-semibold text-emerald-800">View profile</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
