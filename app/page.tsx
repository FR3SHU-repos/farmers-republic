"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/shared/data/category";
import { cx } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import FarmerSection from "@/shared/components/templates/farmerSection";
import { useUser } from "@/shared/context/UserContext";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Leaf,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";

type Farmer = {
  id: string;
  name: string;
  farmName?: string;
  avatar?: string;
  about?: string;
  place?: string;
  phone?: string;
  category?: string;
  last30daysSales?: number;
  createdAt?: string; // if your API has it, it’ll be used for “Recently joined”
};

type SortOption = "top" | "recent" | "name";

const FarmersHomePage = () => {
  const router = useRouter();
  const { user } = useUser();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("top");

  // 🌐 Fetch farmers
  useEffect(() => {
    async function fetchFarmers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/farmers?page=1&limit=100&sort=last30daysSales_desc`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`Failed to fetch farmers: ${res.status}`);
        const json = await res.json();
        const itemsRaw = json?.data?.items ?? [];

        const items: Farmer[] = itemsRaw.map((f: any) => ({
          id: String(f.id ?? f._id ?? ""),
          name: f.name,
          farmName: f.farmName,
          avatar: f.avatar,
          about: f.about,
          place: f.place,
          phone: f.phone,
          category: f.category,
          last30daysSales: f.last30daysSales,
          createdAt: f.createdAt,
        }));

        setFarmers(items);
      } catch (err: any) {
        console.error("Error fetching farmers:", err);
        setError(err.message || "Failed to load farmers");
      } finally {
        setLoading(false);
      }
    }
    fetchFarmers();
  }, []);

  const totalFarmers = farmers.length;

  const sortedFarmers = useMemo(() => {
    const list = [...farmers];

    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "recent") {
      list.sort((a, b) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
      });
    } else if (sortBy === "top") {
      list.sort(
        (a, b) => (b.last30daysSales ?? 0) - (a.last30daysSales ?? 0)
      );
    }

    return list;
  }, [farmers, sortBy]);

  const filteredCount =
    activeCategory === "All"
      ? sortedFarmers.length
      : sortedFarmers.filter(
          (f) =>
            (f.category || "").toLowerCase() === activeCategory.toLowerCase()
        ).length;

  const userCtaLabel =
    user?.type === "Buyer"
      ? "View adopted farmers"
      : user?.type === "Farmer"
      ? "Go to your dashboard"
      : null;

  const userCtaRoute =
    user?.type === "Buyer"
      ? "/farmers/adapted"
      : user?.type === "Farmer"
      ? "/farmers/dashboard"
      : null;

  const handleFarmerClick = (id: string) => {
    router.push(`/farmers/${id}`);
  };

  const categories = CATEGORIES.filter((c) => c.name !== "All");
  const heroStats = [
    {
      label: "Farmers",
      value: loading ? "--" : String(totalFarmers || 0),
      icon: Users,
    },
    {
      label: activeCategory === "All" ? "Categories" : activeCategory,
      value: loading
        ? "--"
        : activeCategory === "All"
        ? String(categories.length)
        : String(filteredCount),
      icon: Leaf,
    },
    {
      label: "Model",
      value: "Direct",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8faf5] pb-24 text-stone-900">
      <main>
        <header className="relative border-b border-emerald-900/10 bg-[#eff6e8]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(132,204,22,0.24),transparent_28%),radial-gradient(circle_at_88%_5%,rgba(20,184,166,0.18),transparent_24%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900 shadow-sm backdrop-blur">
                <Sprout className="h-4 w-4 text-lime-600" />
                Adopt a farmer
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-emerald-950 sm:text-5xl lg:text-6xl">
                Food that feels closer to the farm.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
                Discover farmers by what they grow, build trust before you buy,
                and keep your kitchen connected to fresh seasonal produce.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/shop")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-950"
                >
                  Shop fresh produce
                  <ShoppingBag className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/farmers")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-900/15 bg-white/80 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-white"
                >
                  Meet farmers
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {userCtaLabel && userCtaRoute && (
                <button
                  type="button"
                  onClick={() => router.push(userCtaRoute)}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-lime-200 px-4 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-lime-300"
                >
                  <BadgeCheck className="h-4 w-4" />
                  {userCtaLabel}
                </button>
              )}

              <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-xl">
                {heroStats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm backdrop-blur"
                    >
                      <Icon className="h-4 w-4 text-emerald-700" />
                      <p className="mt-3 text-xl font-semibold text-emerald-950">
                        {stat.value}
                      </p>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative min-h-[340px] overflow-hidden rounded-[2rem] border border-white/80 bg-emerald-950 shadow-2xl shadow-emerald-950/20">
              <img
                src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80"
                alt="Fresh market vegetables"
                className="absolute inset-0 h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-950 backdrop-blur">
                  Seasonal picks
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1.5 text-xs font-semibold text-emerald-950">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Farmer direct
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/15 p-4 text-white shadow-xl backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Today&apos;s promise</p>
                    <p className="mt-1 text-sm leading-6 text-white/80">
                      Better discovery for buyers, more predictable demand for
                      farmers.
                    </p>
                  </div>
                  <Leaf className="h-8 w-8 flex-shrink-0 text-lime-200" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="sticky top-14 z-30 border-b border-emerald-900/10 bg-[#f8faf5]/95 backdrop-blur-xl md:top-24">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  Browse by category
                </p>
                <p className="mt-1 text-sm text-stone-600">
              {loading
                ? "Loading farmers…"
                : filteredCount
                ? `Showing ${filteredCount} farmer${
                    filteredCount === 1 ? "" : "s"
                  }${
                    activeCategory !== "All" ? ` in “${activeCategory}”` : ""
                  }`
                : activeCategory === "All"
                ? "No farmers found yet."
                : `No farmers listed under “${activeCategory}” yet.`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("All")}
                    className={cx(
                      "flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition whitespace-nowrap",
                      activeCategory === "All"
                        ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                        : "border-stone-200 bg-white text-stone-700 hover:border-emerald-200 hover:bg-lime-50"
                    )}
                  >
                    All farmers
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setActiveCategory(c.name)}
                      className={cx(
                        "flex-shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap",
                        activeCategory === c.name
                          ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-700 hover:border-emerald-200 hover:bg-lime-50"
                      )}
                    >
                      <span className="mr-1.5">{c.emoji}</span>
                      {c.name}
                    </button>
                  ))}
                </div>

                <label className="relative flex-shrink-0">
                  <span className="sr-only">Sort farmers</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-10 appearance-none rounded-full border border-stone-200 bg-white pl-4 pr-10 text-sm font-semibold text-emerald-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="top">Top farmers</option>
                    <option value="recent">Recently joined</option>
                    <option value="name">Name A-Z</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                </label>
              </div>
            </div>
          </div>
        </section>

        <FarmerSection
          loading={loading}
          error={error}
          farmers={sortedFarmers}
          activeCategory={activeCategory}
          onFarmerClick={handleFarmerClick}
        />
      </main>
    </div>
  );
};

export default FarmersHomePage;
