// shared/components/Shell.tsx
"use client";

import React, { useEffect, useState } from "react";
import NavBar from "@/shared/components/templates/navbar";
import BottomNav from "@/shared/components/templates/bottomNav";
import { cx } from "@/shared/lib/utils";

/**
 * Shell: client wrapper used inside app/layout.tsx
 * - Provides header, footer, bottom nav for all pages
 * - Manages simple cart state and mobile menu state
 * - Persists cart to localStorage
 */

export default function Shell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = useState<
    "home" | "search" | "categories" | "cart" | "profile"
  >("home");

  useEffect(() => {
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

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const subtotal = Object.entries(cart).reduce((s, [id, qty]) => {
    // NOTE: We don't have product list here; subtotal is left basic (could be computed in pages)
    return s + 0;
  }, 0);

  // simple cart helpers - pages/components can also update via window events or context (future)
  const addToCart = (id: number) =>
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));

  const removeOne = (id: number) =>
    setCart((c) => {
      if (!c[id]) return c;
      const copy = { ...c, [id]: c[id] - 1 };
      if (copy[id] <= 0) delete copy[id];
      return copy;
    });

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      {/* NavBar (client interactive) */}
      <NavBar
        cartCount={cartCount}
        onOpenCart={() => {
          setCartOpen(true);
          setActiveTab("cart");
        }}
        query={""}
        setQuery={() => {}}
      />

      {/* Page content */}
      <main className="flex-1 pt-16 md:pt-28">{children}</main>

      {/* Footer */}
      {/* Footer - hidden on mobile, visible on md+ */}
<footer className="hidden md:block bg-stone-800 text-stone-300 py-8 mt-8">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {/* Small logo */}
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                P
              </div>
              <span className="text-white font-semibold">Farmers Republic</span>
            </div>
            <p className="text-sm">Small-batch, transparent sourcing — curated for conscious living.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-green-500">All Products</a></li>
              <li><a className="hover:text-green-500">New Arrivals</a></li>
              <li><a className="hover:text-green-500">Best Sellers</a></li>
              <li><a className="hover:text-green-500">Sale</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-green-500">Contact</a></li>
              <li><a className="hover:text-green-500">FAQs</a></li>
              <li><a className="hover:text-green-500">Shipping</a></li>
              <li><a className="hover:text-green-500">Returns</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-green-500">About</a></li>
              <li><a className="hover:text-green-500">Our Story</a></li>
              <li><a className="hover:text-green-500">Sustainability</a></li>
              <li><a className="hover:text-green-500">Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-700 mt-6 pt-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} PureNature. All rights reserved.</p>
        </div>
      </footer>

      {/* Bottom nav (mobile) */}
      <BottomNav
        active={activeTab}
        onTab={(t) => {
          setActiveTab(t);
          if (t === "cart") setCartOpen(true);
        }}
        cartCount={cartCount}
      />

      {/* Cart bottom sheet simplified */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setCartOpen(false)} />
          <aside className="fixed z-50 left-0 right-0 bottom-0 sm:bottom-auto sm:right-6 sm:top-16 sm:w-96 sm:rounded-2xl bg-white rounded-t-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold">Your cart</h5>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-stone-100" aria-label="Close cart">Close</button>
            </div>

            <div className="max-h-60 overflow-auto">
              {Object.keys(cart).length === 0 && <div className="text-sm text-stone-500">Your cart is empty</div>}
              {Object.entries(cart).map(([id, qty]) => {
                // attempt to show an image placeholder when product details aren't available here
                return (
                  <div key={id} className="flex items-center gap-3 py-2 border-b">
                    <div className="w-12 h-12 relative rounded-md overflow-hidden bg-stone-100 flex items-center justify-center">
                      <span className="text-sm text-stone-500">Img</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Product #{id}</div>
                      <div className="text-xs text-stone-500">Quantity: {qty}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <button onClick={() => removeOne(Number(id))} className="px-2 py-1 border rounded">-</button>
                      <button onClick={() => addToCart(Number(id))} className="px-2 py-1 border rounded">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-stone-500">Items</div>
                <div className="font-bold">{cartCount}</div>
              </div>
              <button className={cx("px-4 py-2 rounded-lg font-semibold", cartCount === 0 ? "bg-stone-200 text-stone-400" : "bg-green-600 text-white")} disabled={cartCount===0}>Checkout</button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
