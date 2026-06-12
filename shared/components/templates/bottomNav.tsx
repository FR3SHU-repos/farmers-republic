"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Home as HomeIcon,
  Grid,
  Search,
  ShoppingCart,
  User,
  MapPin,
  Box,
  X,
  ReceiptText,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext"; // ✅ use cart context

type BottomNavTab = "home" | "search" | "categories" | "cart" | "profile";

export default function BottomNav({
  active,
  onTab,
}: {
  active: BottomNavTab;
  onTab: (t: BottomNavTab) => void;
}) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { cartCount } = useCart(); // ✅ get cart count from context

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const categoriesButtonRef = useRef<HTMLButtonElement | null>(null);

  // 👇 new: measure nav height for spacer
  const navBarRef = useRef<HTMLDivElement | null>(null);
  const [navHeight, setNavHeight] = useState<number>(72); // sensible default

  const goProfile = () => {
    if (currentUser?.id) router.push("/profile");
    else router.push("/login");
  };

  // toggle categories popover
  const toggleCategories = () => {
    setMenuOpen((s) => {
      const next = !s;
      if (next) onTab("categories");
      return next;
    });
  };

  // close when clicking outside or pressing Escape
  useEffect(() => {
    function onDocPointer(e: PointerEvent | MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!menuOpen) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !categoriesButtonRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // 👇 new: update navHeight when mounted / resized
  useEffect(() => {
    const updateHeight = () => {
      if (navBarRef.current) {
        setNavHeight(navBarRef.current.offsetHeight || 72);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <>
      {/* invisible spacer so page content doesn't go under the fixed nav */}
      <div
        className="sm:hidden"
        aria-hidden="true"
        style={{ height: navHeight }}
      />

      <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-50">
        {/* ✅ Categories popover stays same */}
        {menuOpen && (
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            className="fixed left-4 right-4 bottom-[82px] z-[60] rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-emerald-950">Explore</div>
              <button
                aria-label="Close categories"
                onClick={() => setMenuOpen(false)}
                className="rounded-full p-1 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/farmers/adapted"
                onClick={() => setMenuOpen(false)}
                className="group"
              >
                <div className="flex flex-col items-center gap-2 rounded-xl bg-stone-50 p-3 hover:bg-lime-50">
                  <MapPin className="w-5 h-5 text-stone-700 group-hover:text-emerald-700" />
                  <div className="text-xs font-medium text-stone-700">Farmers</div>
                </div>
              </Link>

              <Link
                href="/shop"
                onClick={() => setMenuOpen(false)}
                className="group"
              >
                <div className="flex flex-col items-center gap-2 rounded-xl bg-stone-50 p-3 hover:bg-lime-50">
                  <Box className="w-5 h-5 text-stone-700 group-hover:text-emerald-700" />
                  <div className="text-xs font-medium text-stone-700">Products</div>
                </div>
              </Link>

            {currentUser?.type === "Buyer" && (
              <Link
                href={`/orders/${currentUser?.id}`}
                onClick={() => setMenuOpen(false)}
                className="group"
              >
                <div className="flex flex-col items-center gap-2 rounded-xl bg-stone-50 p-3 hover:bg-lime-50">
                  <ReceiptText className="w-5 h-5 text-stone-700 group-hover:text-emerald-700" />
                  <div className="text-xs font-medium text-stone-700">Orders</div>
                </div>
              </Link>
            )}
              
            </div>
          </div>
        )}

        {/* ✅ Bottom navigation */}
        <div
          ref={navBarRef}
          className="mx-3 mb-3 flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-white/95 px-2 py-2 shadow-[0_16px_40px_rgba(15,61,46,0.18)] backdrop-blur-xl safe-area-bottom"
        >
          {/* Home */}
          <button
            onClick={() => {
              onTab("home");
              router.push("/");
            }}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              active === "home" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-[11px]">Home</span>
          </button>

          {/* Search */}
          <button
            onClick={() => {
              onTab("search");
              router.push("/shop");
            }}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              active === "search" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
          >
            <Search className="w-6 h-6" />
            <span>Shop</span>
          </button>

          {/* Categories */}
          <button
            ref={categoriesButtonRef}
            onClick={toggleCategories}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              menuOpen || active === "categories"
                ? "bg-lime-50 text-emerald-800"
                : "text-stone-500",
            )}
          >
            <Grid className="w-6 h-6" />
            <span>More</span>
          </button>

          {/* ✅ Cart */}
          <button
            onClick={() => {
              router.push("/cart");
            }}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition relative",
              active === "cart" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
            aria-label="Cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 right-5 bg-rose-500 text-white text-[10px] rounded-full min-w-4 h-4 inline-flex items-center justify-center px-1 font-semibold">
                {cartCount}
              </span>
            )}
            <span>Cart</span>
          </button>

          {/* Profile */}
          <button
            onClick={goProfile}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              active === "profile" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
          >
            {currentUser?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.photo}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : currentUser?.name ? (
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[12px] font-semibold text-emerald-900">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-6 h-6" />
            )}
            <span>{currentUser?.name ? "Profile" : "Login"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
