// shared/components/templates/bottomNav.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Home as HomeIcon,
  Grid,
  Search,
  ShoppingCart,
  User,
  MapPin,
  Users,
  Box,
  Tag,
  Gift,
  X,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import Link from "next/link";

type BottomNavTab = "home" | "search" | "categories" | "cart" | "profile";

export default function BottomNav({
  active,
  onTab,
  cartCount = 0,
}: {
  active: BottomNavTab;
  onTab: (t: BottomNavTab) => void;
  cartCount?: number;
}) {
  const router = useRouter();
  const { user: currentUser } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const categoriesButtonRef = useRef<HTMLButtonElement | null>(null);

  const goProfile = () => {
    if (currentUser?.id) router.push("/profile");
    else router.push("/login");
  };

  // toggle categories popover
  const toggleCategories = () => {
    setMenuOpen((s) => {
      const next = !s;
      if (next) onTab("categories"); // keep parent state in sync (optional)
      return next;
    });
  };

  // close when clicking outside or pressing Escape
  useEffect(() => {
    function onDocPointer(e: PointerEvent | MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(target) && !categoriesButtonRef.current?.contains(target)) {
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

  // small helper to close menu when navigating
  const handleNavLink = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-50">
      {/* Categories popover */}
      {menuOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          className="fixed left-4 right-4 bottom-[72px] z-[60] bg-white rounded-2xl shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Explore</div>
            <button
              aria-label="Close categories"
              onClick={() => setMenuOpen(false)}
              className="p-1 rounded-md hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link href="/farmers" onClick={() => setMenuOpen(false)} className="group">
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                <MapPin className="w-5 h-5 text-stone-700 group-hover:text-green-600" />
                <div className="text-xs text-stone-700">Farmers</div>
              </div>
            </Link>

            <Link href="/fpos" onClick={() => setMenuOpen(false)} className="group">
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                <Users className="w-5 h-5 text-stone-700 group-hover:text-green-600" />
                <div className="text-xs text-stone-700">FPOs</div>
              </div>
            </Link>

            <Link href="/products" onClick={() => setMenuOpen(false)} className="group">
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                <Box className="w-5 h-5 text-stone-700 group-hover:text-green-600" />
                <div className="text-xs text-stone-700">Products</div>
              </div>
            </Link>

            <Link href="/categories" onClick={() => setMenuOpen(false)} className="group">
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                <Tag className="w-5 h-5 text-stone-700 group-hover:text-green-600" />
                <div className="text-xs text-stone-700">Categories</div>
              </div>
            </Link>

            <Link href="/offers" onClick={() => setMenuOpen(false)} className="group">
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                <Gift className="w-5 h-5 text-stone-700 group-hover:text-green-600" />
                <div className="text-xs text-stone-700">Offers</div>
              </div>
            </Link>

            <Link href="/nearby" onClick={() => setMenuOpen(false)} className="group">
              <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                <Grid className="w-5 h-5 text-stone-700 group-hover:text-green-600" />
                <div className="text-xs text-stone-700">Nearby</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* bottom bar */}
      <div className="bg-white border-t border-stone-200 flex items-center justify-between px-2 py-2 safe-area-bottom">
        <button
          onClick={() => onTab("home")}
          className={cx(
            "flex-1 flex flex-col items-center gap-0.5 py-2",
            active === "home" ? "text-green-600" : "text-stone-500"
          )}
          aria-label="Home"
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[11px]">Home</span>
        </button>

        <button
          onClick={() => onTab("search")}
          className={cx(
            "flex-1 flex flex-col items-center gap-0.5 py-2",
            active === "search" ? "text-green-600" : "text-stone-500"
          )}
          aria-label="Search"
        >
          <Search className="w-6 h-6" />
          <span className="text-[11px]">Search</span>
        </button>

        <button
          ref={categoriesButtonRef}
          onClick={toggleCategories}
          className={cx(
            "flex-1 flex flex-col items-center gap-0.5 py-2",
            menuOpen || active === "categories" ? "text-green-600" : "text-stone-500"
          )}
          aria-label="Categories"
        >
          <Grid className="w-6 h-6" />
          <span className="text-[11px]">Categories</span>
        </button>

        <button
          onClick={() => onTab("cart")}
          className={cx(
            "flex-1 flex flex-col items-center gap-0.5 py-2 relative",
            active === "cart" ? "text-green-600" : "text-stone-500"
          )}
          aria-label="Cart"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 right-6 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 inline-flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[11px]">Cart</span>
        </button>

        <button
          onClick={goProfile}
          className={cx(
            "flex-1 flex flex-col items-center gap-0.5 py-2",
            active === "profile" ? "text-green-600" : "text-stone-500"
          )}
          aria-label="Profile"
        >
          {/* show avatar/initial when logged in, otherwise a generic icon */}
          {currentUser?.photo ? (
            <img src={currentUser.photo} alt={currentUser.name} className="w-6 h-6 rounded-full" />
          ) : currentUser?.name ? (
            <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-[12px] font-semibold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <User className="w-6 h-6" />
          )}

          <span className="text-[11px]">{currentUser?.name ? "Profile" : "Login"}</span>
        </button>
      </div>
    </nav>
  );
}
