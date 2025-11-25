"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/shared/data/category";
import { cx } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";

type Farmer = {
  id: string;
  name: string;
  farmName?: string;
  avatar?: string;
  about?: string;
  place?: string;
  fpo?: string;
  last30daysSales?: number;
  crops?: string[];
};

const FarmersHomePage = () => {
  const router = useRouter();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

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
          fpo: f.fpo,
          last30daysSales: f.last30daysSales ?? 0,
          crops: Array.isArray(f.crops) ? f.crops : [],
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

  // 🧠 Group farmers by category name
  const farmersByCategory = useMemo(() => {
    const map: Record<string, Farmer[]> = {};

    // init keys for each category
    CATEGORIES.forEach((cat) => {
      map[cat.name] = [];
    });

    farmers.forEach((f) => {
      const cropsLower = (f.crops ?? []).map((c) => c.toLowerCase());
      let matched = false;

      CATEGORIES.forEach((cat) => {
        const catName = cat.name.toLowerCase();
        if (cropsLower.some((c) => c.includes(catName))) {
          map[cat.name].push(f);
          matched = true;
        }
      });

      // if no match you can optionally push to an "Others" bucket
      if (!matched) {
        if (!map["Others"]) map["Others"] = [];
        map["Others"].push(f);
      }
    });

    return map;
  }, [farmers]);

  const handleFarmerClick = (id: string) => {
    router.push(`/farmers/${id}`);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <main>
        {/* Header */}
        <header className="bg-white border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              Adapt A Farmer 🌾
            </h1>
            <p className="hidden sm:block text-xs text-stone-500">
              Choose farmers by category and support them directly
            </p>
          </div>
        </header>

        {/* Top category strip (like your “v v v v”) */}
        <section className="bg-stone-100 border-b border-stone-200 py-3">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className={cx(
                  "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border",
                  activeCategory === "All"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-stone-700 border-stone-200"
                )}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setActiveCategory(c.name)}
                  className={cx(
                    "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border flex items-center gap-1",
                    activeCategory === c.name
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-stone-700 border-stone-200"
                  )}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Farmers grouped by category */}
        <section className="py-6 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {loading && (
              <div className="text-center text-stone-500 py-10">
                Loading farmers...
              </div>
            )}
            {error && (
              <div className="text-center text-red-500 py-10">{error}</div>
            )}

            {!loading &&
              !error &&
              Object.entries(farmersByCategory)
                .filter(([catName]) =>
                  activeCategory === "All" ? true : catName === activeCategory
                )
                .map(([catName, list]) =>
                  list.length === 0 ? null : (
                    <div key={catName} className="space-y-3">
                      {/* Category Title (Fruits, Grains, etc.) */}
                      <h2 className="text-lg font-semibold text-stone-900">
                        {catName}
                      </h2>

                      {/* Farmer cards grid (similar to product cards) */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {list.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleFarmerClick(f.id)}
                            className="text-left bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
                          >
                            {/* Image area like product card */}
                            <div className="h-24 bg-stone-100 flex items-center justify-center">
                              {f.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={f.avatar}
                                  alt={f.name}
                                  className="w-full h-24 object-cover"
                                />
                              ) : (
                                <div className="text-2xl">
                                  {f.name?.charAt(0)?.toUpperCase() ?? "👨‍🌾"}
                                </div>
                              )}
                            </div>

                            {/* Content area */}
                            <div className="p-3 space-y-1">
                              <div className="text-sm font-semibold text-stone-900 line-clamp-1">
                                {f.name}
                              </div>
                              {f.farmName && (
                                <div className="text-[11px] text-stone-500 line-clamp-1">
                                  {f.farmName}
                                </div>
                              )}
                              {f.place && (
                                <div className="text-[11px] text-stone-500">
                                  📍 {f.place}
                                </div>
                              )}

                              {/* Crops chips */}
                              {f.crops && f.crops.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {f.crops.slice(0, 3).map((crop) => (
                                    <span
                                      key={crop}
                                      className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-[10px] text-green-700 border border-green-100"
                                    >
                                      {crop}
                                    </span>
                                  ))}
                                  {f.crops.length > 3 && (
                                    <span className="text-[10px] text-stone-400">
                                      +{f.crops.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Bottom strip like product CTA */}
                              <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                                <span className="text-[11px] text-stone-500">
                                  Last 30 days:{" "}
                                  <span className="font-semibold text-stone-700">
                                    {f.last30daysSales ?? 0}
                                  </span>
                                </span>
                                <span className="text-[11px] font-semibold text-green-700">
                                  View
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FarmersHomePage;
