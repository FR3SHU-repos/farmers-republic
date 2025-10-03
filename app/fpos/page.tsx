"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, MapPin, Leaf } from "lucide-react";

// Mock data (same structure as before)
const FPOS = [
  {
    id: "1",
    name: "Green Valley FPO",
    place: "Visakhapatnam, Andhra Pradesh",
    noOfFarmers: 120,
    totalLandArea: "560 acres",
    crops: ["Rice", "Millets", "Turmeric"],
    image:
      "https://images.unsplash.com/photo-1599076480547-47dc5e42a0ab?w=1200&q=80&auto=format&fit=crop",
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
    <div className="min-h-screen bg-stone-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">Farmer Producer Organizations</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FPOS.map((fpo) => (
            <Link
              key={fpo.id}
              href={`/fpos/${fpo.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-40 w-full">
                <Image
                  src={fpo.image}
                  alt={fpo.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-stone-800 group-hover:text-green-600">
                  {fpo.name}
                </h2>
                <p className="text-sm text-stone-500 mb-3">{fpo.place}</p>

                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>{fpo.noOfFarmers} farmers</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-stone-600 mt-1">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <span>{fpo.crops.join(", ")}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-stone-600 mt-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span>{fpo.totalLandArea}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
