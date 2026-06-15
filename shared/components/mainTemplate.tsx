// shared/components/Shell.tsx
"use client";

import React, { useEffect, useState } from "react";
import NavBar from "@/shared/components/templates/navbar";
import BottomNav from "@/shared/components/templates/bottomNav";
import { cx } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LifeBuoy, Mail, MapPin, ShieldCheck, Sprout } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#f8faf5] text-stone-900">
      {/* NavBar (client interactive) */}
      <NavBar
        onOpenCart={() => {
          setCartOpen(true);
          setActiveTab("cart");
        }}
        query={""}
        setQuery={() => {}}
      />

      {/* Page content */}
      <main className="flex-1 pt-14 md:pt-24">{children}</main>

      {/* Footer */}
      <footer className="hidden md:block mt-12 border-t border-emerald-900/10 bg-[#10241c] text-emerald-50">
        <div className="mx-auto grid max-w-6xl grid-cols-[1.2fr_0.7fr_0.8fr_0.9fr] gap-10 px-6 py-10 lg:px-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                <Image
                  src="/fr3sh.in_logo.svg"
                  alt="Fr3sh Logo"
                  width={26}
                  height={26}
                />
              </span>
              <span>
                <span className="block text-base font-semibold text-white">
                  {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
                </span>
                <span className="text-xs text-emerald-100/70">
                  Farmer-first food network
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/70">
              A fresher way to discover growers, adopt trusted farms, and shop
              produce with more transparency from field to table.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-lime-200"
            >
              Explore products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Explore</h4>
            <div className="mt-4 grid gap-3 text-sm text-emerald-50/70">
              <Link href="/farmers" className="hover:text-lime-200">
                Farmers
              </Link>
              <Link href="/fpos" className="hover:text-lime-200">
                FPOs
              </Link>
              <Link href="/shop" className="hover:text-lime-200">
                Shop
              </Link>
              <Link href="/products" className="hover:text-lime-200">
                Products
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Contact</h4>
            <div className="mt-4 grid gap-3 text-sm text-emerald-50/70">
              <a
                href="mailto:support@fr3sh.in"
                className="inline-flex items-center gap-2 hover:text-lime-200"
              >
                <Mail className="h-4 w-4" />
                support@fr3sh.in
              </a>
              <Link href="/support" className="inline-flex items-center gap-2 hover:text-lime-200">
                <LifeBuoy className="h-4 w-4" />
                Support center
              </Link>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local farms, local tables
              </span>
              <span className="inline-flex items-center gap-2">
                <Sprout className="h-4 w-4" />
                Fresh, seasonal, responsible
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <div className="mt-4 grid gap-3 text-sm text-emerald-50/70">
              <Link href="/privacy" className="inline-flex items-center gap-2 hover:text-lime-200">
                <ShieldCheck className="h-4 w-4" />
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-lime-200">
                Terms & Conditions
              </Link>
              <Link href="/data-deletion" className="hover:text-lime-200">
                Data Deletion
              </Link>
              <Link href="/content-rights" className="hover:text-lime-200">
                Content Rights
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-emerald-50/60">
          &copy; {new Date().getFullYear()} FR3SH / Farmers Republic. All rights reserved.
        </div>
      </footer>


      {/* Bottom nav (mobile) */}
      <BottomNav
        active={activeTab}
        onTab={(t) => {
          setActiveTab(t);
          if (t === "cart") setCartOpen(true);
        }}
        //cartCount={cartCount}
      />

      {/* Cart bottom sheet simplified */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 bg-emerald-950/35 backdrop-blur-[2px] z-40" onClick={() => setCartOpen(false)} />
          <aside className="fixed z-50 left-0 right-0 bottom-0 sm:left-auto sm:bottom-auto sm:right-6 sm:top-20 sm:w-96 sm:rounded-2xl bg-white rounded-t-2xl p-5 shadow-2xl ring-1 ring-emerald-950/10">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-emerald-950">Your cart</h5>
              <button onClick={() => setCartOpen(false)} className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium hover:bg-stone-50" aria-label="Close cart">Close</button>
            </div>

            <div className="max-h-60 overflow-auto">
              {Object.keys(cart).length === 0 && <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-5 text-center text-sm text-stone-500">Your cart is empty</div>}
              {Object.entries(cart).map(([id, qty]) => {
                // attempt to show an image placeholder when product details aren't available here
                return (
                  <div key={id} className="flex items-center gap-3 border-b border-stone-100 py-3">
                    <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-lime-50 flex items-center justify-center">
                      <span className="text-sm text-stone-500">Img</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Product #{id}</div>
                      <div className="text-xs text-stone-500">Quantity: {qty}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <button onClick={() => removeOne(Number(id))} className="h-7 w-7 rounded-full border border-stone-200 text-sm hover:bg-stone-50">-</button>
                      <button onClick={() => addToCart(Number(id))} className="h-7 w-7 rounded-full border border-stone-200 text-sm hover:bg-stone-50">+</button>
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
              <button className={cx("rounded-full px-5 py-2 text-sm font-semibold", cartCount === 0 ? "bg-stone-200 text-stone-400" : "bg-emerald-700 text-white hover:bg-emerald-800")} disabled={cartCount===0}>Checkout</button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
