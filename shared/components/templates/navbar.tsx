"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  ArrowLeft,
  ChevronDown,
  Package,
  Leaf,
  Store,
  Users,
  CalendarClock,
  UsersRound,
  Gift,
  BarChart2,
  ClipboardList,
  ShieldCheck,
  Plus,
  TrendingUp,
  Wallet,
  User,
  LayoutGrid,
  Sprout,
  Star,
  MapPin,
  X,
  LayoutDashboard,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { useCart } from "@/shared/context/CartContext";
import Image from "next/image";

export default function NavBar({
  onOpenCart,
  query,
  setQuery,
}: {
  onOpenCart: () => void;
  query: string;
  setQuery: (s: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser } = useUser();
  const { cartCount } = useCart();

  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const goProfileOrLogin = () => {
    if (currentUser?.id) router.push("/profile");
    else router.push("/login");
  };

  const showBackButton = pathname !== "/";

  // All role checks guarded behind mounted to prevent hydration mismatch
  const isLoggedIn  = mounted && !!currentUser?.id;
  const isBuyer     = mounted && currentUser?.type === "Buyer";
  const isFarmer    = mounted && currentUser?.type === "Farmer";
  const isAdmin     = mounted && currentUser?.type === "Admin";

  const primaryLinks = [
    { label: "Farmers",   href: "/farmers",   icon: Users },
    { label: "Shop",      href: "/shop",       icon: Store },
    { label: "Harvests",  href: "/harvests",   icon: CalendarClock },
    { label: "Community", href: "/community",  icon: UsersRound },
  ];

  type MenuItem    = { label: string; href: string; icon: React.ElementType };
  type MenuSection = { title: string; items: MenuItem[] };

  const sections: MenuSection[] = [];

  // — Explore (always visible) —
  sections.push({
    title: "Explore",
    items: [
      { label: "Shop",            href: "/shop",              icon: Store },
      { label: "Farmers",         href: "/farmers",           icon: Users },
      { label: "FPOs",            href: "/fpos",              icon: Leaf },
      { label: "Harvests",        href: "/harvests",          icon: CalendarClock },
      { label: "Community",       href: "/community",         icon: UsersRound },
      { label: "Adopted Farmers", href: "/farmers/adapted",   icon: MapPin },
      { label: "FR3SH Plus",      href: "/frsh-plus",         icon: Star },
    ],
  });

  // — My Account (logged-in users) —
  if (isLoggedIn) {
    const accountItems: MenuItem[] = [
      { label: "Profile",       href: "/profile",              icon: User },
      { label: "Wallet",        href: "/wallet",               icon: Wallet },
      { label: "Pre-bookings",  href: "/profile/prebookings",  icon: ClipboardList },
      { label: "Referral",      href: "/referral",             icon: Gift },
      { label: "Badges",        href: "/profile/badges",       icon: BadgeCheck },
    ];
    if (isBuyer) {
      accountItems.splice(2, 0, {
        label: "My Orders",
        href: `/orders/${currentUser?.id}`,
        icon: Package,
      });
    }
    sections.push({ title: "My Account", items: accountItems });
  }

  // — Farmer Tools —
  if (isFarmer) {
    sections.push({
      title: "Farmer Tools",
      items: [
        { label: "Dashboard",        href: "/farmers/dashboard",    icon: LayoutDashboard },
        { label: "My Harvests",      href: "/farmers/harvests",     icon: CalendarClock },
        { label: "Announce Harvest", href: "/farmers/harvests/new", icon: Plus },
        { label: "Add Product",      href: "/products/create",      icon: Plus },
        { label: "My Orders",        href: "/farmers/orders",       icon: Package },
        { label: "Analytics",        href: "/farmers/analytics",    icon: TrendingUp },
        { label: "KYC Status",       href: "/farmers/kyc",          icon: ShieldCheck },
      ],
    });
  }

  // — Admin —
  if (isAdmin) {
    sections.push({
      title: "Admin",
      items: [
        { label: "Admin Panel", href: "/admin",            icon: ShieldCheck },
        { label: "Users",       href: "/admin/users",      icon: Users },
        { label: "Farmers",     href: "/admin/farmers",    icon: Sprout },
        { label: "Orders",      href: "/admin/orders",     icon: Package },
        { label: "Products",    href: "/admin/products",   icon: Store },
        { label: "Analytics",   href: "/admin/analytics",  icon: BarChart2 },
      ],
    });
  }

  return (
    <>
      {/* ── Mobile header ────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-emerald-900/10 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              aria-label="Go back"
              onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }}
              className="rounded-full border border-stone-200 p-2 transition hover:bg-stone-50"
            >
              <ArrowLeft className="w-5 h-5 text-stone-700" />
            </button>
          )}

          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-950 shadow-sm">
              <Image src="/fr3sh_logo.svg" alt="Fr3sh" width={20} height={20} />
            </span>
            <span className="truncate text-base font-semibold text-emerald-950">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </span>
          </Link>

          <button
            aria-label="Cart"
            onClick={() => router.push("/cart")}
            className="relative rounded-full border border-stone-200 p-2 text-emerald-950"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Desktop nav ──────────────────────────────────────────────── */}
      <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-6xl">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/90 px-5 py-3 shadow-[0_18px_60px_rgba(15,61,46,0.16)] backdrop-blur-xl">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 shadow-sm">
              <Image src="/fr3sh_logo.svg" alt="Fr3sh" width={22} height={22} />
            </span>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold leading-tight text-emerald-950">
                {process.env.NEXT_PUBLIC_APP_NAME}
              </p>
              <p className="text-[11px] text-stone-400">Pick fresh. Eat fresh.</p>
            </div>
          </Link>

          {/* Primary nav — 4 links only */}
          <nav className="flex items-center gap-0.5 rounded-full bg-stone-100/80 p-1">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition",
                    active
                      ? "bg-white text-emerald-900 shadow-sm"
                      : "text-stone-600 hover:text-emerald-900",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-2">

            {/* Search */}
            <form
              className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 lg:flex"
              onSubmit={(e) => { e.preventDefault(); router.push("/shop"); }}
            >
              <Search className="h-4 w-4 text-stone-400" />
              <input
                aria-label="Search"
                className="w-28 bg-transparent text-sm outline-none placeholder:text-stone-400"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear">
                  <X className="h-3.5 w-3.5 text-stone-400 hover:text-stone-700" />
                </button>
              )}
            </form>

            {/* Cart */}
            <button
              aria-label="Cart"
              onClick={() => router.push("/cart")}
              className="relative rounded-full border border-stone-200 p-2.5 text-stone-600 transition hover:bg-lime-50 hover:text-emerald-800"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Browse mega-menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                aria-expanded={showMenu}
                aria-label="Browse all features"
                className={[
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-sm font-semibold transition",
                  showMenu
                    ? "border-emerald-900 bg-emerald-950 text-white"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-900/30 hover:bg-lime-50 hover:text-emerald-900",
                ].join(" ")}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Browse</span>
                <ChevronDown className={["h-3.5 w-3.5 transition-transform duration-200", showMenu ? "rotate-180" : ""].join(" ")} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    key="browse-menu"
                    initial={{ opacity: 0, scale: 0.97, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full z-50 mt-3 w-[500px] origin-top-right overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
                  >
                    {/* Panel header */}
                    <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
                      <p className="text-sm font-semibold text-stone-800">All Features</p>
                      <button
                        onClick={() => setShowMenu(false)}
                        className="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Scrollable sections */}
                    <div className="max-h-[70vh] overflow-y-auto px-4 py-4 space-y-5">
                      {sections.map((section, si) => (
                        <div key={si}>
                          <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                            {section.title}
                          </p>
                          <div className="grid grid-cols-3 gap-1">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setShowMenu(false)}
                                  className={[
                                    "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition",
                                    isActive
                                      ? "bg-lime-50 text-emerald-900"
                                      : "text-stone-600 hover:bg-stone-50 hover:text-emerald-900",
                                  ].join(" ")}
                                >
                                  <span className={[
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition",
                                    isActive
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-stone-100 text-stone-500 group-hover:bg-emerald-100 group-hover:text-emerald-700",
                                  ].join(" ")}>
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="text-sm font-medium leading-tight">{item.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer — user identity + go to profile */}
                    {isLoggedIn && (
                      <div className="border-t border-stone-100 px-4 py-3">
                        <button
                          onClick={() => { setShowMenu(false); router.push("/profile"); }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-stone-50"
                        >
                          {currentUser?.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentUser.photo} alt={currentUser?.name} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900">
                              {currentUser?.name?.charAt(0) ?? "U"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-stone-800">{currentUser?.name}</p>
                            <p className="text-[11px] text-stone-400">
                              {currentUser?.type} · View profile →
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile / Login — always render Login during SSR, swap after mount */}
            {!mounted ? (
              <Link
                href="/login"
                className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950"
              >
                Login
              </Link>
            ) : currentUser?.id ? (
              <button
                onClick={goProfileOrLogin}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1 pr-3 transition hover:bg-stone-50"
              >
                {currentUser.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.photo} alt={currentUser.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900">
                    {currentUser.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="hidden max-w-[80px] truncate text-sm font-medium text-stone-700 sm:inline">
                  {currentUser.name || "Profile"}
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950"
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
