// app/farmers/page.tsx
import React from "react";
import { FARMERS } from "@/shared/data/farmers";
import FarmerCard from "@/shared/components/molecules/FarmerCard";

export const metadata = {
  title: "Farmers",
  description: "Meet the farmers behind our produce",
};

export default function FarmersPage() {
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-stone-800">Meet our farmers</h1>
          <p className="mt-2 text-stone-600">Transparent sourcing from trusted smallholders and family farms.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FARMERS.map((f) => (
            <FarmerCard key={f.id} farmer={f} />
          ))}
        </div>
      </div>
    </div>
  );
}
