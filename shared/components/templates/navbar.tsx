"use client";
import React from "react";
import { Leaf, Heart, ShoppingCart, Search } from "lucide-react";
import Link from "next/link";


export default function NavBar({
  cartCount = 0,
  onOpenCart,
  query,
  setQuery,
}: {
  cartCount?: number;
  onOpenCart: () => void;
  query: string;
  setQuery: (s: string) => void;
}) {
  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 mb-40 left-0 right-0 bg-white shadow z-40 px-4 py-2 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <Link href="/">
          <span className="font-semibold text-stone-700 text-sm">
            Farmers Republic
          </span>
          </Link>
          
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1 flex-1 ml-4">
          <Search className="w-4 h-4 text-stone-500" />
          <input
            aria-label="Search products"
            className="bg-transparent outline-none text-sm w-full"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="text-xs text-stone-500"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Desktop / Tablet Nav */}
      <header className="hidden md:block fixed top-4 mb-60 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-4xl">
        <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center justify-between border border-stone-200">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <Link href="/">
            <span className="font-semibold text-stone-700">
              Farmers Republic
            </span>
            </Link>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a className="hover:text-green-600 transition-colors" href="#shop">
              Shop
            </a>
            <a className="hover:text-green-600 transition-colors" href="#about">
              About
            </a>
            <a className="hover:text-green-600 transition-colors" href="#blog">
              Blog
            </a>
            <a className="hover:text-green-600 transition-colors" href="#contact">
              Contact
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="hidden lg:flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1">
              <Search className="w-4 h-4 text-stone-500" />
              <input
                aria-label="Search products"
                className="bg-transparent outline-none text-sm w-40"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="text-xs text-stone-500"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Wishlist */}
            <button
              aria-label="Wishlist"
              className="p-2 rounded-full hover:bg-stone-100"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* Cart */}
            <div className="relative">
              <button
                aria-label="Open cart"
                onClick={onOpenCart}
                className="p-2 rounded-full hover:bg-stone-100"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
