// ✅ FIXED: app/farmers/[id]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import FarmerProfile from "@/shared/components/molecules/FarmerProfile";

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host");
  return `${proto}://${host}`;
}

export default async function FarmerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ await params before using
  const { id } = await params;
  if (!id) return notFound();

  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/farmers/${id}`, { cache: "no-store" });

  if (!res.ok) return notFound();

  const json = await res.json();
  const farmer = json?.data;
  if (!farmer) return notFound();

  return <FarmerProfile farmer={farmer} farmerId={id} />;
}
