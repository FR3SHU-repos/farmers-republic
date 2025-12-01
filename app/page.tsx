"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/shared/data/category";
import { cx } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import FarmerSection from "@/shared/components/templates/farmerSection";
import { useUser } from "@/shared/context/UserContext";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 text-stone-900">
      <main>
        {/* Hero / header */}
        <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-100/80 via-emerald-50 to-green-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 sm:space-y-3 max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-700/70">
                  Adopt a Farmer
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-900">
                  Support real farmers. Get real food.
                </h1>
                <p className="text-sm sm:text-[15px] text-emerald-900/80">
                  Browse farmers by what they grow and adopt the ones you trust.
                  Build a long-term, predictable relationship instead of
                  one-time orders.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold text-emerald-900">
                      {loading ? "—" : totalFarmers || 0}
                    </span>
                    <span className="text-[11px] text-emerald-900/70 uppercase tracking-[0.16em]">
                      farmers
                    </span>
                  </div>
                  {activeCategory !== "All" && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-semibold text-emerald-900">
                        {loading ? "—" : filteredCount}
                      </span>
                      <span className="text-[11px] text-emerald-900/70 uppercase tracking-[0.16em]">
                        in {activeCategory}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {userCtaLabel && userCtaRoute && (
                <div className="flex sm:flex-col gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={() => router.push(userCtaRoute)}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-green-600 text-white text-xs sm:text-sm font-medium shadow-sm hover:bg-green-700 transition"
                  >
                    {userCtaLabel}
                  </button>
                  <p className="text-[11px] text-emerald-900/70 max-w-[220px] text-right">
                    {user?.type === "Buyer"
                      ? "See farmers you’ve already committed to support."
                      : user?.type === "Farmer"
                      ? "Manage your orders, products, and visibility."
                      : null}
                  </p>
                </div>
              )}
            </div>

            {/* Category strip inside hero */}
            <div className="mt-5 border border-emerald-100 rounded-2xl bg-white/80 backdrop-blur px-3 py-3 sm:px-4 sm:py-3.5 shadow-[0_8px_30px_rgba(16,185,129,0.08)]">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-800/80">
                  Browse by category
                </p>
                <p className="text-[11px] text-emerald-800/70">
                  Tap to filter farmers
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("All")}
                  className={cx(
                    "flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap",
                    activeCategory === "All"
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100"
                  )}
                >
                  All farmers
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setActiveCategory(c.name)}
                    className={cx(
                      "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition whitespace-nowrap",
                      activeCategory === c.name
                        ? "bg-green-600 text-white border-green-600 shadow-sm"
                        : "bg-white text-emerald-900 border-emerald-100 hover:bg-emerald-50"
                    )}
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar under hero: sort + counts */}
        <section className="border-b border-emerald-100 bg-white/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-xs text-emerald-900/80">
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

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-900/70">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border border-emerald-100 bg-emerald-50/70 text-emerald-900 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
              >
                <option value="top">Top farmers (last 30 days)</option>
                <option value="recent">Recently joined</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
        </section>

        {/* Farmer listing */}
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
