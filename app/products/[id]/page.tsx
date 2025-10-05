// app/product/[id]/page.tsx
// app/product/[id]/page.tsx
import React from "react";
import ProductDetail from "@/shared/components/templates/productDetail";
import { mongoDB } from "@/shared/lib/db/mongo";
import ProductModel from "@/shared/models/mongodb/products/products";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProductDetail as ProductDetailType } from "@/shared/interfaces/general";

export const metadata: Metadata = {
  title: "Product",
  description: "Product detail",
};

async function fetchProductById(id: string): Promise<ProductDetailType | null> {
  await mongoDB();

  // Use findById; allow either an ObjectId string or plain id field
  const doc = await ProductModel.findById(id).lean().exec();
  if (!doc) {
    // Try fallback: maybe stored as id field
    const doc2 = await ProductModel.findOne({ id }).lean().exec();
    if (!doc2) return null;
    return mapDocToProductDetail(doc2);
  }
  return mapDocToProductDetail(doc);
}

function mapDocToProductDetail(doc: any): ProductDetailType {
  return {
    id: String(doc._id ?? doc.id ?? ""),
    name: doc.name ?? "",
    image: doc.image ?? (Array.isArray(doc.images) && doc.images[0]) ?? "",
    price: typeof doc.price === "number" ? doc.price : Number(doc.price ?? 0),
    rating: typeof doc.rating === "number" ? doc.rating : Number(doc.rating ?? 0),
    reviewsCount: doc.reviewsCount ?? 0,
    sourceFrom: doc.sourceFrom ?? "",
    purchasedLast30Days: doc.purchasedLast30Days ?? 0,
    farmer: typeof doc.farmer === "string" ? { name: doc.farmer } : (doc.farmer ?? { name: "" }),
    swadeshiPercent: typeof doc.swadeshiPercent === "number" ? doc.swadeshiPercent : (doc.swadeshiPercent ? Number(doc.swadeshiPercent) : 0),
    healthBenefits: Array.isArray(doc.healthBenefits) ? doc.healthBenefits : (doc.healthBenefits ? String(doc.healthBenefits).split(",").map((s: string) => s.trim()) : []),
    timeToSupply: doc.timeToSupply ?? undefined,
    tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? String(doc.tags).split(",").map((s: string) => s.trim()) : []),
    fssai: doc.fssai ?? undefined,
    shelfLife: doc.shelfLife ?? undefined,
    description: doc.description ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) return notFound();

  const product = await fetchProductById(id);
  if (!product) return notFound();

  return <ProductDetail product={product} />;
}

