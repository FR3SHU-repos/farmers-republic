"use client";
import React from "react";
import { Leaf, Heart, ShoppingCart, Search, Menu, X } from "lucide-react";
import { cx } from "@/shared/lib/utils";

export default function NavBar({
  cartCount = 0,
  onOpenCart,
  onToggleMenu,
  menuOpen,
  query,
  setQuery,
}: {
  cartCount?: number;
  onOpenCart: () => void;
  onToggleMenu: () => void;
  menuOpen: boolean;
  query: string;
  setQuery: (s: string) => void;
}) {
  return (
    <header className="bg-white shadow sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">PureNature</div>
              <div className="text-xs text-stone-400">organic & natural</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a className="hover:text-green-600 transition-colors" href="#shop">Shop</a>
            <a className="hover:text-green-600 transition-colors" href="#about">About</a>
            <a className="hover:text-green-600 transition-colors" href="#blog">Blog</a>
            <a className="hover:text-green-600 transition-colors" href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1">
              <Search className="w-4 h-4 text-stone-500" />
              <input
                aria-label="Search products"
                className="bg-transparent outline-none text-sm w-40"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")} className="text-xs text-stone-500">
                  Clear
                </button>
              )}
            </div>

            <button aria-label="Wishlist" className="p-2 rounded-full hover:bg-stone-100">
              <Heart className="w-5 h-5" />
            </button>

            <div className="relative">
              <button aria-label="Open cart" onClick={onOpenCart} className="p-2 rounded-full hover:bg-stone-100">
                <ShoppingCart className="w-5 h-5" />
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>

            <div className="md:hidden">
              <button aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={onToggleMenu} className="p-2 rounded-full hover:bg-stone-100">
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
