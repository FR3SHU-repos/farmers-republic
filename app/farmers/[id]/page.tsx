// app/farmers/[id]/page.tsx
import React from "react";
import { FARMERS } from "@/shared/data/farmers";
import FarmerProfile from "@/shared/components/molecules/FarmerProfile";
import { notFound } from "next/navigation";

type Params = { params: { id: string } };

export async function generateStaticParams() {
  return FARMERS.map((f) => ({ id: f.id }));
}

export default function FarmerDetailPage({ params }: Params) {
  const { id } = params;
  const farmer = FARMERS.find((f) => f.id === id);
  if (!farmer) {
    notFound();
  }
  return <FarmerProfile farmer={farmer!} />;
}
