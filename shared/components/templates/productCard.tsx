"use client";
import React from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Product } from "@/shared/interfaces/general";
import { cx } from "@/shared/lib/utils";

export default function ProductCard({
  product,
  onAdd,
  onWishlist,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  onWishlist?: (p: Product) => void;
}) {
  return (
    <article className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative w-full h-56 sm:h-64 bg-stone-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            aria-label={`Add ${product.name} to wishlist`}
            className="bg-white p-2 rounded-full shadow-sm hover:bg-green-600 hover:text-white transition-colors"
            onClick={() => onWishlist?.(product)}
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-green-600 font-medium">{product.category}</p>
            <h3 className="text-md sm:text-lg font-semibold text-stone-800 mt-1">{product.name}</h3>
            <p className="text-sm text-stone-500 mt-2 line-clamp-2">{product.description}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-stone-800">${product.price.toFixed(2)}</div>
            {product.badge && (
              <div className="text-xs mt-2 inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {product.badge}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => onAdd(product)}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-full font-medium hover:bg-green-700 transition-colors text-sm"
          >
            Add to cart
          </button>
          <button
            onClick={() => onWishlist?.(product)}
            aria-label={`Quick view ${product.name}`}
            className="px-3 py-3 border rounded-full text-sm hover:border-green-600 transition-colors"
          >
            Quick
          </button>
        </div>
      </div>
    </article>
  );
}
