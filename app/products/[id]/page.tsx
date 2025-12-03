// app/products/[id]/page.tsx

import React from "react";
import ProductDetail from "@/shared/components/templates/productDetail";
import { mongoDB } from "@/shared/lib/db/mongo";
import ProductModel from "@/shared/models/mongodb/products/products";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product as ProductType } from "@/shared/interfaces/mongodb/products/product";

export const metadata: Metadata = {
  title: "Product",
  description: "Product detail",
};

async function fetchProductById(id: string): Promise<ProductType | null> {
  await mongoDB();

  // Try by _id
  const doc = await ProductModel.findById(id).lean().exec();
  if (!doc) {
    // Fallback: maybe stored as id field
    const doc2 = await ProductModel.findOne({ id }).lean().exec();
    if (!doc2) return null;
    return mapDocToProduct(doc2);
  }
  return mapDocToProduct(doc);
}

function mapDocToProduct(doc: any): ProductType {
  const mainImage =
    doc.image ?? (Array.isArray(doc.images) && doc.images[0]) ?? "";

  return {
    // Identity
    id: String(doc._id ?? doc.id ?? ""),
    name: doc.name ?? "",
    slug: doc.slug ?? undefined,
    sku: doc.sku ?? undefined,

    // Media
    image: mainImage || undefined,
    images: Array.isArray(doc.images)
      ? doc.images
      : mainImage
      ? [mainImage]
      : undefined,
    videoUrl: doc.videoUrl ?? undefined,

    // Pricing
    price: Number(doc.price ?? 0),
    mrp: doc.mrp != null ? Number(doc.mrp) : undefined,
    currency: doc.currency ?? "INR",

    unit: doc.unit ?? undefined,
    unitQuantity:
      doc.unitQuantity != null ? Number(doc.unitQuantity) : undefined,

    // Qty / rules
    minOrderQty:
      doc.minOrderQty != null ? Number(doc.minOrderQty) : undefined,
    maxOrderQty:
      doc.maxOrderQty != null ? Number(doc.maxOrderQty) : undefined,
    stepQty: doc.stepQty != null ? Number(doc.stepQty) : undefined,

    // Inventory
    stockQty: doc.stockQty != null ? Number(doc.stockQty) : undefined,
    inStock: doc.inStock ?? true,
    allowBackorder: doc.allowBackorder ?? false,

    // Ratings
    rating: doc.rating != null ? Number(doc.rating) : undefined,
    reviewsCount: doc.reviewsCount != null ? Number(doc.reviewsCount) : undefined,

    // Farmer / source
    sourceFrom: doc.sourceFrom ?? undefined,
    purchasedLast30Days:
      doc.purchasedLast30Days != null
        ? Number(doc.purchasedLast30Days)
        : undefined,
    farmer: doc.farmer ?? undefined, // string as per interface
    farmerId: doc.farmerId ? String(doc.farmerId) : undefined,

    // Category / merch
    category: doc.category ?? undefined,
    subCategory: doc.subCategory ?? undefined,
    tags: Array.isArray(doc.tags) ? doc.tags : undefined,
    badge: doc.badge ?? undefined,
    label: doc.label ?? undefined,
    status: doc.status ?? undefined,
    isFeatured: doc.isFeatured ?? undefined,
    sortPriority:
      doc.sortPriority != null ? Number(doc.sortPriority) : undefined,

    // Health / quality
    swadeshiPercent:
      doc.swadeshiPercent != null ? Number(doc.swadeshiPercent) : undefined,
    healthBenefits: Array.isArray(doc.healthBenefits)
      ? doc.healthBenefits
      : undefined,
    timeToSupply: doc.timeToSupply ?? undefined,
    shelfLife: doc.shelfLife ?? undefined,
    storageInstructions: doc.storageInstructions ?? undefined,
    ingredients: Array.isArray(doc.ingredients)
      ? doc.ingredients
      : undefined,
    originCountry: doc.originCountry ?? "India",
    isOrganic: doc.isOrganic ?? undefined,
    certifications: Array.isArray(doc.certifications)
      ? doc.certifications
      : undefined,

    // Description
    description: doc.description ?? undefined,
    shortDescription: doc.shortDescription ?? undefined,

    // Tax
    hsnCode: doc.hsnCode ?? undefined,
    gstRate: doc.gstRate != null ? Number(doc.gstRate) : undefined,
    gstIncludedInPrice: doc.gstIncludedInPrice ?? undefined,

    // Logistics
    productType: doc.productType ?? "physical",
    weightGrams:
      doc.weightGrams != null ? Number(doc.weightGrams) : undefined,
    dimensionsCm: doc.dimensionsCm ?? undefined,
    fragile: doc.fragile ?? undefined,
    perishable: doc.perishable ?? undefined,
    codAvailable: doc.codAvailable ?? undefined,

    // SEO
    seoTitle: doc.seoTitle ?? undefined,
    seoDescription: doc.seoDescription ?? undefined,
    searchKeywords: Array.isArray(doc.searchKeywords)
      ? doc.searchKeywords
      : undefined,

    // Attributes
    attributes: doc.attributes ?? undefined,

    // Timestamps (optional)
    createdAt: doc.createdAt ?? undefined,
    updatedAt: doc.updatedAt ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id;
  if (!id) return notFound();

  const product = await fetchProductById(id);
  if (!product) return notFound();

  return <ProductDetail product={product} />;
}
