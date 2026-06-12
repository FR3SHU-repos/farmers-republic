// shared/components/templates/productCard.tsx
"use client";
import React from "react";
import Image from "next/image";
import { Heart, Plus, ShoppingBasket, Sprout } from "lucide-react";
import { Product } from "@/shared/interfaces/mongodb/products/product";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";
import toast from "react-hot-toast";

export default function ProductCard({
  product,
  onAdd,
  onWishlist,
  farmerName,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  onWishlist?: (p: Product) => void;
  farmerName?: string;
}) {
  const { addToCart } = useCart();

  const effectiveFarmerName = farmerName || (product as any).farmer || "";
  const imageSrc = product.image?.trim();
  const price =
    typeof product.price === "number" ? product.price : Number(product.price || 0);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-[0_18px_50px_rgba(15,61,46,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,61,46,0.14)]">
      <div className="relative h-56 w-full overflow-hidden bg-lime-50 sm:h-64">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(190,242,100,0.42),transparent_32%),linear-gradient(135deg,#f7fee7,#ccfbf1)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/78 text-emerald-900 shadow-sm">
              <Sprout className="h-9 w-9" />
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950/50 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.category && (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-sm backdrop-blur">
              {product.category}
            </span>
          )}
          {product.badge && (
            <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-sm">
              {product.badge}
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            aria-label={`Add ${product.name} to wishlist`}
            className="rounded-full bg-white/90 p-2 text-stone-700 shadow-sm backdrop-blur transition-colors hover:bg-rose-50 hover:text-rose-600"
            onClick={() => onWishlist?.(product)}
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {effectiveFarmerName && (
              <p className="mb-1 text-xs font-medium text-stone-500">
                Farmer:{" "}
                <span className="text-stone-700">
                  {effectiveFarmerName}
                </span>
              </p>
            )}

            <Link href={`/products/${product.id}`}>
              <h3 className="line-clamp-2 text-lg font-semibold leading-6 text-emerald-950 transition hover:text-emerald-700">
                {product.name}
              </h3>
            </Link>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-stone-500">
              {product.description}
            </p>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="text-xl font-semibold text-emerald-950">
              ₹{price.toFixed(2)}
            </div>
            <div className="text-xs font-medium text-stone-500">
              /{product.unit ? ` ${product.unit}` : "unit"}
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-3 pt-5">
          <Link
            href={`/products/${product.id}`}
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-stone-200 text-emerald-900 transition hover:bg-lime-50"
            aria-label={`View ${product.name}`}
          >
            <ShoppingBasket className="h-5 w-5" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart({
                id: String(product.id),
                name: product.name,
                price,
                image: imageSrc,
                qty: 1,
                farmerId: (product as any).farmerId || undefined,
              });

              toast.success(`${product.name} added to cart 🛒`);
              onAdd(product);
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
          >
            <Plus className="h-4 w-4" />
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
