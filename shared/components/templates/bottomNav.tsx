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
  CalendarClock,
  UsersRound,
  Gift,
  BarChart2,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  Plus,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";

type BottomNavTab = "home" | "search" | "categories" | "cart" | "profile";

type QuickLink = { href: string; icon: React.ElementType; label: string };

export default function BottomNav({
  active,
  onTab,
}: {
  active: BottomNavTab;
  onTab: (t: BottomNavTab) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser } = useUser();
  const { cartCount } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const categoriesButtonRef = useRef<HTMLButtonElement | null>(null);
  const navBarRef = useRef<HTMLDivElement | null>(null);
  const [navHeight, setNavHeight] = useState<number>(72);

  const goProfile = () => {
    if (currentUser?.id) router.push("/profile");
    else router.push("/login");
  };

  const toggleCategories = () => {
    setMenuOpen((s) => {
      const next = !s;
      if (next) onTab("categories");
      return next;
    });
  };

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

  useEffect(() => {
    const updateHeight = () => {
      if (navBarRef.current) setNavHeight(navBarRef.current.offsetHeight || 72);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const isBuyer = currentUser?.type === "Buyer";
  const isFarmer = currentUser?.type === "Farmer";
  const isAdmin = currentUser?.type === "Admin";

  // Build sections for the popover
  type Section = { title: string; links: QuickLink[] };
  const sections: Section[] = [];

  // Always visible
  sections.push({
    title: "Discover",
    links: [
      { href: "/harvests", icon: CalendarClock, label: "Harvests" },
      { href: "/community", icon: UsersRound, label: "Community" },
      { href: "/farmers", icon: MapPin, label: "Farmers" },
      { href: "/shop", icon: Box, label: "Products" },
    ],
  });

  if (isBuyer) {
    sections.push({
      title: "My Account",
      links: [
        { href: `/orders/${currentUser?.id}`, icon: ReceiptText, label: "My Orders" },
        { href: "/profile/prebookings", icon: ClipboardList, label: "Pre-bookings" },
        { href: "/referral", icon: Gift, label: "Referral" },
      ],
    });
  }

  if (isFarmer) {
    sections.push({
      title: "Farmer Tools",
      links: [
        { href: "/farmers/harvests", icon: CalendarClock, label: "My Harvests" },
        { href: "/analytics/farmer", icon: TrendingUp, label: "Analytics" },
        { href: "/farmers/harvests/new", icon: Plus, label: "New Harvest" },
        { href: "/referral", icon: Gift, label: "Referral" },
      ],
    });
  }

  if (isAdmin) {
    sections.push({
      title: "Admin",
      links: [
        { href: "/admin", icon: ShieldCheck, label: "Admin Panel" },
        { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
      ],
    });
  }

  return (
    <>
      <div className="sm:hidden" aria-hidden="true" style={{ height: navHeight }} />

      <nav className="fixed bottom-0 left-0 right-0 sm:hidden z-50">
        {/* More popover */}
        {menuOpen && (
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            className="fixed left-3 right-3 bottom-[82px] z-[60] rounded-2xl border border-emerald-900/10 bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <p className="text-sm font-semibold text-emerald-950">Explore</p>
              <button
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
                className="rounded-full p-1 hover:bg-stone-100"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-3 space-y-4">
              {sections.map((section, si) => (
                <div key={si}>
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {section.links.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMenuOpen(false)}
                          className="group flex flex-col items-center gap-1.5 rounded-xl bg-stone-50 p-3 hover:bg-lime-50 active:scale-95 transition"
                        >
                          <Icon className="w-5 h-5 text-stone-600 group-hover:text-emerald-700" />
                          <span className="text-[10px] font-medium text-stone-600 group-hover:text-emerald-800 text-center leading-tight">
                            {link.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div
          ref={navBarRef}
          className="mx-3 mb-3 flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-white/95 px-2 py-2 shadow-[0_16px_40px_rgba(15,61,46,0.18)] backdrop-blur-xl safe-area-bottom"
        >
          {/* Home */}
          <button
            onClick={() => { onTab("home"); router.push("/"); }}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              active === "home" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
          >
            <HomeIcon className="w-6 h-6" />
            <span>Home</span>
          </button>

          {/* Shop */}
          <button
            onClick={() => { onTab("search"); router.push("/shop"); }}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              active === "search" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
          >
            <Search className="w-6 h-6" />
            <span>Shop</span>
          </button>

          {/* Harvests — prominent quick link */}
          <button
            onClick={() => { onTab("categories"); router.push("/harvests"); }}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              pathname?.startsWith("/harvests") ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
          >
            <CalendarClock className="w-6 h-6" />
            <span>Harvests</span>
          </button>

          {/* More */}
          <button
            ref={categoriesButtonRef}
            onClick={toggleCategories}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              menuOpen || active === "categories" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
          >
            <Grid className="w-6 h-6" />
            <span>More</span>
          </button>

          {/* Cart */}
          <button
            onClick={() => router.push("/cart")}
            className={cx(
              "flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition relative",
              active === "cart" ? "bg-lime-50 text-emerald-800" : "text-stone-500",
            )}
            aria-label="Cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 right-4 bg-rose-500 text-white text-[10px] rounded-full min-w-4 h-4 inline-flex items-center justify-center px-1 font-semibold">
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
              <img src={currentUser.photo} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover" />
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
