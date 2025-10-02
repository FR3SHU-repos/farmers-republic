// app/product/[id]/page.tsx
import React from "react";
import ProductDetail from "@/shared/components/templates/productDetail";
import { Metadata } from "next";

/**
 * SAMPLE DATA - replace this with real DB/API call
 */
const SAMPLE_PRODUCTS = [
  {
    id: "p1",
    name: "Cold-Pressed Sesame Oil (500ml)",
    image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=1200&auto=format&fit=crop",
    price: 499.0,
    rating: 4.6,
    reviewsCount: 128,
    sourceFrom: "Kurnool, Andhra Pradesh",
    purchasedLast30Days: 84,
    farmer: {
      name: "Ramu Reddy",
      location: "Kurnool, AP",
      phone: "+91-98xxxxxx",
      farmName: "Reddy Organic Farms",
      about: "Small family farm growing sesame using traditional methods and crop-rotation for soil health.",
    },
    swadeshiPercent: 92,
    healthBenefits: [
      "Rich in antioxidants",
      "Supports heart health",
      "Good source of vitamin E"
    ],
    timeToSupply: "2-5 days",
    tags: ["Oil", "Cold-pressed", "Heart-healthy"],
    fssai: "112233445566",
    shelfLife: "12 months",
    description: "Unrefined, cold-pressed sesame oil from smallhold farms. Perfect for cooking and skin care.",
  },
  // add more sample products if needed
];

export const metadata: Metadata = {
  title: "Product",
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  const product = SAMPLE_PRODUCTS.find((p) => p.id === id) || SAMPLE_PRODUCTS[0];

  return <ProductDetail product={product} />;
}
