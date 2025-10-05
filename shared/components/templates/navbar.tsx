"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Leaf,
  Heart,
  ShoppingCart,
  Search,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";

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
  const pathname = usePathname();
  const { user: currentUser } = useUser();

  const [showCategories, setShowCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const goProfileOrLogin = () => {
    if (currentUser?.id) router.push("/profile");
    else router.push("/login");
  };

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const showBackButton = pathname !== "/";

  // 👇 Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowCategories(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ✅ Mobile Header (with Back Button + Search) */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white shadow z-40 px-3 py-2 flex items-center gap-3">
        {showBackButton && (
          <button
            aria-label="Go back"
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-stone-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </button>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <Link href="/" className="text-sm font-semibold text-stone-700">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </Link>
        </div>

      </header>

      {/* ✅ Desktop / Tablet Nav */}
      <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-4xl">
        <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center justify-between border border-stone-200 relative">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <Link href="/">
              <span className="font-semibold text-stone-700">
                {process.env.NEXT_PUBLIC_APP_NAME}
              </span>
            </Link>
          </div>

          {/* ✅ Animated Categories Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowCategories((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium hover:text-green-600 transition-colors"
            >
              Categories <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showCategories && (
                <motion.div
                  key="dropdown"
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full mt-2 right-0 bg-white border border-stone-200 rounded-xl shadow-lg py-2 w-52 z-50 origin-top-right"
                >
                  {[
                    { name: "👩‍🌾 Farmers", href: "/farmers" },
                    { name: "🏢 FPOs", href: "/fpos" },
                    { name: "🛍️ Products", href: "/products" },
                    { name: "🏬 Markets", href: "/markets" },
                    { name: "📦 Warehouses", href: "/warehouses" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowCategories(false)}
                      className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
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

            <button
              aria-label="Wishlist"
              className="p-2 rounded-full hover:bg-stone-100"
            >
              <Heart className="w-5 h-5" />
            </button>

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
              <Link
                href="/login"
                className="ml-2 text-sm font-semibold bg-green-600 text-white px-3 py-1 rounded-full"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
