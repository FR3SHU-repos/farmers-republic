"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, MapPin, Leaf } from "lucide-react";

const FPOS = [
  {
    id: "1",
    name: "Green Valley FPO",
    place: "Visakhapatnam, Andhra Pradesh",
    noOfFarmers: 120,
    totalLandArea: "560 acres",
    crops: ["Rice", "Millets", "Turmeric"],
    image:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Coastal Agro FPO",
    place: "Bhimili, Andhra Pradesh",
    noOfFarmers: 75,
    totalLandArea: "310 acres",
    crops: ["Coconut", "Cashew", "Banana"],
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80&auto=format&fit=crop",
  },
];

export default function FpoListPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground-heading sm:text-3xl">
          Farmer Producer Organizations
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {FPOS.map((fpo) => (
            <Link
              key={fpo.id}
              href={`/fpos/${fpo.id}`}
              className="group overflow-hidden rounded-2xl border border-border bg-surface-card transition hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={fpo.image}
                  alt={fpo.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <h2 className="text-base font-semibold text-foreground-heading transition group-hover:text-brand">
                  {fpo.name}
                </h2>
                <p className="mb-3 mt-0.5 text-sm text-foreground-muted">{fpo.place}</p>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-foreground-body">
                    <Users className="h-4 w-4 flex-shrink-0 text-brand" />
                    <span>{fpo.noOfFarmers} farmers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground-body">
                    <Leaf className="h-4 w-4 flex-shrink-0 text-brand" />
                    <span className="truncate">{fpo.crops.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground-body">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-brand" />
                    <span>{fpo.totalLandArea}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
