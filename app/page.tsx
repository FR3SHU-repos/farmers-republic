"use client";
import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "@/shared/components/templates/productCard";
import { CATEGORIES } from "../shared/data/category";
import { Product } from "@/shared/interfaces/mongodb/products/product";
import Image from "next/image";
import { cx } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";

function getAbsoluteOrigin() {
  if (process.env.NEXT_PUBLIC_APP_ORIGIN) return process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

const HomePage = () => {
  const router = useRouter();

  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🧠 Load cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pn_cart");
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  // 💾 Save cart
  useEffect(() => {
    try {
      localStorage.setItem("pn_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // 🌐 Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const origin = getAbsoluteOrigin();
        const res = await fetch(`${origin}/api/v1/products?page=1&limit=12&sort=createdAt_desc`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
        const json = await res.json();
        const items = json?.data?.products ?? json?.data?.items ?? [];
        setProducts(items);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // 🧮 Derived values
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (!q) return true;
      return `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q);
    });
  }, [query, activeCategory, products]);

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const subtotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find((x) => String(x.id) === id);
    return p ? s + Number(p.price) * qty : s;
  }, 0);

  // 🛒 Cart handlers
  const addToCart = (p: Product) =>
    setCart((c) => {
      const id = String(p.id ?? p.id);
      return { ...c, [id]: (c[id] || 0) + 1 };
    });

  // 🖱️ Navigate to product details
  function handleCardClick(e: React.MouseEvent, id: string | number) {
    const target = e.target as HTMLElement | null;
    if (target?.closest("button") || target?.closest("a")) return;
    router.push(`/product/${id}`);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <main>
        {/* Categories */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveCategory(c.name)}
                  className={cx(
                    "bg-white p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 transition-transform transform hover:-translate-y-1",
                    activeCategory === c.name ? "ring-2 ring-green-200" : ""
                  )}
                >
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="text-sm font-semibold">{c.name}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="shop" className="py-6 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Featured Products</h3>
              <select
                className="border px-3 py-2 rounded-md text-sm"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                <option>All</option>
                {Array.from(new Set(products.map((p) => p.category))).map((c) =>
                  c ? (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ) : null
                )}
              </select>
            </div>

            {loading && <div className="text-center text-stone-500 py-10">Loading products...</div>}
            {error && <div className="text-center text-red-500 py-10">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!loading &&
                !error &&
                filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={(e) => handleCardClick(e, String(p.id))}
                    className="cursor-pointer"
                  >
                    <ProductCard
                      key={p.id ?? p.id}
                      product={{
                        id: String(p.id ?? p.id),
                        name: p.name,
                        image: p.image ?? (Array.isArray(p.images) ? p.images[0] : ""),
                        price: Number(p.price),
                        description: p.description ?? "",
                        category: p.category ?? "",
                        badge: p.badge ?? "",
                      }}
                      onAdd={addToCart}
                      onWishlist={() => {}}
                    />
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
