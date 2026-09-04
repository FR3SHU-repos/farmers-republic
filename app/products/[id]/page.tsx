// app/products/[id]/page.tsx

import React from "react";
import ProductDetail from "@/shared/components/templates/productDetail";
import { CatalogueAPIError, catalogueAPI } from "@/shared/lib/api/catalogue";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product as ProductType } from "@/shared/interfaces/mongodb/products/product";

export const metadata: Metadata = {
  title: "Product",
  description: "Product detail",
};

async function fetchProductById(id: string): Promise<ProductType | null> {
  try { return await catalogueAPI.get(id); }
  catch (error) { if (error instanceof CatalogueAPIError && error.status === 404) return null; throw error; }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();

  const product = await fetchProductById(id);
  if (!product) return notFound();

  return <ProductDetail product={product} />;
}
