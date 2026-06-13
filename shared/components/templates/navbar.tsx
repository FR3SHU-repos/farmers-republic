"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
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

  const [showMore, setShowMore] = useState(false);
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

  const primaryLinks = [
    { label: "Farmers", href: "/farmers", icon: Users },
    { label: "FPOs", href: "/fpos", icon: Leaf },
    { label: "Shop", href: "/shop", icon: Store },
    { label: "Harvests", href: "/harvests", icon: CalendarClock },
    { label: "Community", href: "/community", icon: UsersRound },
  ];

  const isBuyer = currentUser?.type === "Buyer";
  const isFarmer = currentUser?.type === "Farmer";
  const isAdmin = currentUser?.type === "Admin";
  const isLoggedIn = !!currentUser?.id;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoToOrders = () => {
    if (!currentUser?.id) { router.push("/login"); return; }
    router.push(`/orders/${currentUser.id}`);
  };

  type DropdownItem = { name: string; href: string; icon: React.ElementType; desc: string };
  type DropdownSection = { title: string; items: DropdownItem[] };

  const dropdownSections: DropdownSection[] = [];

  if (isBuyer || !isLoggedIn) {
    dropdownSections.push({
      title: "For Buyers",
      items: [
        { name: "My Pre-bookings", href: "/profile/prebookings", icon: ClipboardList, desc: "Track your harvest pre-orders" },
        { name: "Referral", href: "/referral", icon: Gift, desc: "Invite friends, earn ₹100" },
      ],
    });
  }

  if (isFarmer) {
    dropdownSections.push({
      title: "Farmer Tools",
      items: [
        { name: "My Harvests", href: "/farmers/harvests", icon: CalendarClock, desc: "Manage harvest announcements" },
        { name: "Analytics", href: "/analytics/farmer", icon: TrendingUp, desc: "Your sales & performance" },
        { name: "Referral", href: "/referral", icon: Gift, desc: "Invite friends, earn rewards" },
      ],
    });
    dropdownSections.push({
      title: "Create",
      items: [
        { name: "Announce Harvest", href: "/farmers/harvests/new", icon: Plus, desc: "Tell buyers what's coming" },
        { name: "Add Product", href: "/products/create", icon: Plus, desc: "List a product for sale" },
      ],
    });
  }

  if (isAdmin) {
    dropdownSections.push({
      title: "Administration",
      items: [
        { name: "Admin Panel", href: "/admin", icon: ShieldCheck, desc: "Platform overview & KYC" },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart2, desc: "Business intelligence" },
      ],
    });
  }

  if (!isFarmer && !isAdmin) {
    dropdownSections.push({
      title: "Explore",
      items: [
        { name: "Adopted Farmers", href: "/farmers/adapted", icon: Users, desc: "Find and support a farmer" },
        { name: "Create Farmer Profile", href: "/farmers/create", icon: Plus, desc: "Register as a farmer" },
      ],
    });
  }

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-emerald-900/10 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              aria-label="Go back"
              onClick={handleBack}
              className="rounded-full border border-stone-200 p-2 transition hover:bg-stone-50"
            >
              <ArrowLeft className="w-5 h-5 text-stone-700" />
            </button>
          )}

          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-950 shadow-sm">
              <Image src="/fr3sh_logo.svg" alt="Fr3sh Logo" width={20} height={20} />
            </span>
            <span className="truncate text-base font-semibold text-emerald-950">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </span>
          </Link>

          <button
            aria-label="Open cart"
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

      {/* Desktop / tablet nav */}
      <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-6xl">
        <div className="relative flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_60px_rgba(15,61,46,0.16)] backdrop-blur-xl">
          {/* Logo */}
          <Link href="/" className="flex min-w-[190px] items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 shadow-sm">
              <Image src="/fr3sh_logo.svg" alt="Fr3sh Logo" width={24} height={24} />
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight text-emerald-950">
                {process.env.NEXT_PUBLIC_APP_NAME}
              </span>
              <span className="text-[11px] font-medium text-stone-500">Pick fresh. Eat fresh.</span>
            </span>
          </Link>

          {/* Primary nav */}
          <nav className="flex items-center gap-1 rounded-full bg-stone-100/80 p-1">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-white text-emerald-900 shadow-sm"
                      : "text-stone-600 hover:text-emerald-900",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* More dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-emerald-900"
            >
              More <ChevronDown className={["w-4 h-4 transition-transform", showMore ? "rotate-180" : ""].join(" ")} />
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  key="dropdown"
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full z-50 mt-3 w-72 origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
                >
                  {dropdownSections.map((section, si) => (
                    <div key={si} className={si > 0 ? "border-t border-stone-100" : ""}>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                        {section.title}
                      </p>
                      <div className="px-2 pb-2">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setShowMore(false)}
                              className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-lime-50 group"
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 group-hover:text-emerald-700" />
                              <div>
                                <p className="text-sm font-medium text-stone-800 group-hover:text-emerald-900">{item.name}</p>
                                <p className="text-xs text-stone-400">{item.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Static bottom links */}
                  <div className="border-t border-stone-100 px-2 py-2">
                    <Link
                      href="/farmers/adapted"
                      onClick={() => setShowMore(false)}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-lime-50 group"
                    >
                      <Users className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 group-hover:text-emerald-700" />
                      <div>
                        <p className="text-sm font-medium text-stone-800 group-hover:text-emerald-900">Adopted Farmers</p>
                        <p className="text-xs text-stone-400">Find and support local farmers</p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <form
              className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 shadow-sm lg:flex"
              onSubmit={(e) => { e.preventDefault(); router.push("/shop"); }}
            >
              <Search className="w-4 h-4 text-stone-500" />
              <input
                aria-label="Search products"
                className="w-36 bg-transparent text-sm outline-none placeholder:text-stone-400"
                placeholder="Search produce"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")} className="text-xs text-stone-500 hover:text-stone-900">
                  Clear
                </button>
              )}
            </form>

            {/* Wishlist */}
            <button
              aria-label="Wishlist"
              className="rounded-full border border-stone-200 p-2 text-stone-700 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* Cart */}
            <div className="relative">
              <button
                aria-label="Open cart"
                onClick={() => router.push("/cart")}
                className="relative rounded-full border border-stone-200 p-2 text-stone-700 transition hover:bg-lime-50 hover:text-emerald-800"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-semibold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* My Orders — buyer only */}
            {isBuyer && (
              <button
                type="button"
                onClick={handleGoToOrders}
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-emerald-800 sm:inline-flex"
              >
                <Package className="w-4 h-4" />
                My Orders
              </button>
            )}

            {/* Profile / Login */}
            {currentUser?.id ? (
              <button
                onClick={goProfileOrLogin}
                className="ml-1 flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1 pr-3 transition hover:bg-stone-50"
              >
                {currentUser.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.photo} alt={currentUser.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900">
                    {currentUser.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="hidden max-w-24 truncate text-sm font-medium text-stone-700 sm:inline">
                  {currentUser.name || "Profile"}
                </span>
              </button>
            ) : (
              <Link href="/login" className="ml-1 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
