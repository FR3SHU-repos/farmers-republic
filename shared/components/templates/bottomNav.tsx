// shared/components/templates/bottomNav.tsx
// This is the bottom navigation bar for mobile devices

"use client";
import React from "react";
import { Home as HomeIcon, Grid, Search, ShoppingCart, User } from "lucide-react";
import { cx } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";

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

  const goProfile = () => {
    if (currentUser?.id) router.push("/dashboard");
    else router.push("/auth/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-50">
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
          onClick={() => onTab("categories")}
          className={cx(
            "flex-1 flex flex-col items-center gap-0.5 py-2",
            active === "categories" ? "text-green-600" : "text-stone-500"
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
