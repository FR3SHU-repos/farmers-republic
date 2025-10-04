"use client";
import React from "react";
import { Leaf, Heart, ShoppingCart, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";

type UserPreview = {
  id?: string;
  name?: string;
  photo?: string;
};

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
  const router = useRouter();

  // ✅ Rename context value to currentUser
  const { user: currentUser, logout } = useUser();

  const goProfileOrLogin = () => {
    if (currentUser?.id) router.push("/profile"); // or /profile
    else router.push("/login");
  };

  return (
    <>
    {/* ✅ Mobile Header (only logo + search) */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white shadow z-40 px-4 py-2 flex items-center gap-3">
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
        <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1 flex-1">
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
      <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-4xl">
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
            <Link className="hover:text-green-600 transition-colors" href="/farmers">
              Farmers
            </Link>
            <Link className="hover:text-green-600 transition-colors" href="/fpos">
              FPOs
            </Link>
            
            
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

            {/* Auth area */}
            {currentUser?.id ? (
              <button
                onClick={goProfileOrLogin}
                className="ml-2 flex items-center gap-2 p-1 rounded-full hover:bg-stone-100"
              >
                {currentUser.photo ? (
                  <img
                    src={currentUser.photo}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-sm">
                    {currentUser.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="hidden sm:inline text-sm text-stone-700">
                  {currentUser.name || "Profile"}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                
                <Link
                  href="/login"
                  className="ml-2 text-sm font-semibold bg-green-600 text-white px-3 py-1 rounded-full"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
