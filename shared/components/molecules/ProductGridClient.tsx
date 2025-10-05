// shared/components/ProductGridClient.tsx
"use client";

import React from "react";
import ProductCard from "../templates/productCard";
import toast from "react-hot-toast";

export type ProductGridItem = {
  id: string ;
  name: string;
  // allow null because server may return null
  image?: string | null | undefined;
  price: number | string;
  // allow null for description/category/badge too
  description?: string | null | undefined;
  category?: string | null | undefined;
  badge?: string | null | undefined;
};

export default function ProductGridClient({ products }: { products: ProductGridItem[] }) {
  function onAdd(product: ProductGridItem) {
    console.info("Add to cart (placeholder):", product);
    toast("Cart feature coming soon 🛒", { icon: "⏳" });
  }

  function onWishlist(product: ProductGridItem) {
    console.info("Wishlist toggle (placeholder):", product);
    toast("Wishlist coming soon 💚", { icon: "💡" });
  }

  console.log("Rendering ProductGridClient with products:", products.map(p => p.id));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.length === 0 ? (
        <div className="col-span-full text-center text-stone-500">No products found.</div>
      ) : (
        products.map((p) => (
          <ProductCard
            key={String(p.id)}
            product={{
              id: String(p.id),
              name: p.name,
              // ProductCard expects string for image — provide safe fallback
              image: (p.image ?? "") as string,
              // ensure price is a number for display; ProductCard uses price.toFixed so it should be a number
              price: typeof p.price === "number" ? p.price : Number(p.price ?? 0),
              description: (p.description ?? "") as string,
              category: (p.category ?? "") as string,
              badge: (p.badge ?? "") as string,
            }}
            onAdd={() => onAdd(p)}
            onWishlist={() => onWishlist(p)}
          />
        ))
      )}
    </div>
  );
}
