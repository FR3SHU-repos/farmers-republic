// ✅ FIXED: app/farmers/[id]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import FarmerProfile from "@/shared/components/molecules/FarmerProfile";
import { farmerAPI, FarmerAPIError } from "@/shared/lib/api/farmers";

export default async function FarmerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ await params before using
  const { id } = await params;
  if (!id) return notFound();

  let farmer;
  try { farmer = await farmerAPI.get(id); } catch (error) {
    if (error instanceof FarmerAPIError && error.status === 404) return notFound();
    return <main className="mx-auto max-w-3xl px-6 py-20"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900"><h1 className="text-xl font-semibold">Farmer profile temporarily unavailable</h1><p className="mt-2">Please try again shortly.</p></div></main>;
  }

  return <FarmerProfile farmer={farmer as any} farmerId={id} />;
}
