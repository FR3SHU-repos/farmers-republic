"use client";
import React, { useEffect, useMemo, useState } from "react";
import NavBar from "@/shared/components/templates/navbar";
import BottomNav from "@/shared/components/templates/bottomNav";
import ProductCard from "@/shared/components/templates/productCard";
import { PRODUCTS } from "../shared/data/product";
import { CATEGORIES } from "../shared/data/category";
import { Product } from "../shared/interfaces/general";
import Image from "next/image";
import { cx } from "@/shared/lib/utils";

const HomePage = () =>{
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = useState<"home" | "search" | "categories" | "cart" | "profile">("home");

  useEffect(() => {
    // example: restore cart from localStorage (optional)
    try {
      const raw = localStorage.getItem("pn_cart");
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("pn_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (!q) return true;
      return `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q);
    });
  }, [query, activeCategory]);

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const subtotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === Number(id));
    return p ? s + p.price * qty : s;
  }, 0);

  const addToCart = (p: Product) => setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }));
  const removeOne = (id: number) =>
    setCart((c) => {
      if (!c[id]) return c;
      const copy = { ...c, [id]: c[id] - 1 };
      if (copy[id] <= 0) delete copy[id];
      return copy;
    });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <NavBar
        cartCount={cartCount}
        onOpenCart={() => { setCartOpen(true); setActiveTab("cart"); }}
        onToggleMenu={() => setMenuOpen((s) => !s)}
        menuOpen={menuOpen}
        query={query}
        setQuery={setQuery}
      />

      <main>
        {/* Hero */}
        <section className="relative bg-gradient-to-r from-green-50 to-emerald-50 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                Natural Living, <span className="text-green-600">Naturally Pure</span>
              </h1>
              <p className="mt-3 text-stone-600 max-w-lg">
                Curated organic & natural goods — transparent sourcing, sustainable packaging, and small-batch producers.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <a href="#shop" className="w-full sm:w-auto inline-block bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors text-center">Shop Now</a>
                <a href="#about" className="w-full sm:w-auto inline-block border border-stone-200 px-6 py-3 rounded-full hover:border-green-600 hover:text-green-600 transition-colors text-center">Learn More</a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
              <div className="relative w-full h-64 sm:h-80 md:h-96">
                <Image src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=1400&q=80&auto=format&fit=crop"
                  alt="Assortment of natural products" fill className="object-cover" sizes="(min-width:1024px) 50vw, 100vw"/>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setActiveCategory(c.name); setActiveTab("categories"); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
                  className={cx("bg-white p-4 rounded-xl shadow-sm flex flex-col items-center gap-2 transition-transform transform hover:-translate-y-1", activeCategory === c.name ? "ring-2 ring-green-200" : "")}
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
              <div className="flex items-center gap-2">
                <select className="border px-3 py-2 rounded-md" value={activeCategory} onChange={(e)=> setActiveCategory(e.target.value)}>
                  <option>All</option>
                  {Array.from(new Set(PRODUCTS.map(p=>p.category))).sort().map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} onWishlist={(p)=> alert(`Wishlist ${p.name}`)} />
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center py-12 text-stone-500">No products match your search.</div>}
            </div>
          </div>
        </section>

      </main>

      {/* Cart drawer / bottom sheet simplified (inline) */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={()=> setCartOpen(false)} />
          <aside className="fixed z-50 left-0 right-0 bottom-0 sm:bottom-auto sm:right-6 sm:top-16 sm:w-96 sm:rounded-2xl bg-white rounded-t-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold">Your cart</h5>
              <button onClick={()=> setCartOpen(false)} className="p-2 rounded-full hover:bg-stone-100" aria-label="Close cart">Close</button>
            </div>

            <div className="max-h-60 overflow-auto">
              {Object.keys(cart).length === 0 && <div className="text-sm text-stone-500">Your cart is empty</div>}
              {Object.entries(cart).map(([id, qty]) => {
                const p = PRODUCTS.find(x=> x.id === Number(id))!;
                return (
                  <div key={id} className="flex items-center gap-3 py-2 border-b">
                    <div className="w-12 h-12 relative rounded-md overflow-hidden bg-stone-100">
                      <Image src={p.image} alt={p.name} fill className="object-cover"/>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-stone-500">${p.price.toFixed(2)} × {qty}</div>
                    </div>
                    <div className="text-sm font-bold">${(p.price * qty).toFixed(2)}</div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <button onClick={()=> {
                        const copy = {...cart};
                        copy[p.id] = (copy[p.id] || 0) - 1;
                        if (copy[p.id] <= 0) delete copy[p.id];
                        setCart(copy);
                      }} className="px-2 py-1 border rounded">-</button>
                      <button onClick={()=> setCart((c)=> ({...c, [p.id]: (c[p.id]||0)+1}))} className="px-2 py-1 border rounded">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-stone-500">Subtotal</div>
                <div className="font-bold">${subtotal.toFixed(2)}</div>
              </div>
              <button className={cx("px-4 py-2 rounded-lg font-semibold", cartCount === 0 ? "bg-stone-200 text-stone-400" : "bg-green-600 text-white")} disabled={cartCount===0}>Checkout</button>
            </div>
          </aside>
        </>
      )}

      {/* Bottom nav (mobile) */}
      <BottomNav active={activeTab} onTab={(t)=> { setActiveTab(t); if (t === "cart") setCartOpen(true); }} cartCount={cartCount} />

    </div>
  );
}

export default HomePage;
