"use client";

import React, { useEffect, useState } from "react";
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
};

const FarmersHomePage = () => {
  const router = useRouter();
  
  const { user } = useUser();

  console.log("User in FarmersHomePage:", user);

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
          phone: f.phone,
          category: f.category, // 👈 important
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

  const handleFarmerClick = (id: string) => {
    router.push(`/farmers/${id}`);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <main>
        {/* Header */}
        <header className="bg-green-200 border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              Adopt A Farmer
            </h1>
            <p className="hidden sm:block text-xs text-stone-500">
              Choose farmers by category and support them directly
            </p>

            {/* ✅ Buyer: View Adopted */}
            {user?.type === "Buyer" && (
              <button
                type="button"
                onClick={() => router.push("/farmers/adapted")}
                className="px-3 py-2 rounded-lg bg-green-700 text-white text-xs sm:text-sm font-medium hover:bg-green-800 transition"
              >
                View Adopted
              </button>
            )}

            {/* ✅ Farmer: View Dashboard */}
            {user?.type === "Farmer" && (
              <button
                type="button"
                onClick={() => router.push("/farmers/dashboard")}
                className="px-3 py-2 rounded-lg bg-green-700 text-white text-xs sm:text-sm font-medium hover:bg-green-800 transition"
              >
                View Dashboard
              </button>
            )}
            
    
          </div>
        </header>

        {/* Top category strip */}
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

        {/* ✅ Reusable section component */}
        <FarmerSection
          loading={loading}
          error={error}
          farmers={farmers} // 👈 flat list
          activeCategory={activeCategory}
          onFarmerClick={handleFarmerClick}
        />
      </main>
    </div>
  );
};

export default FarmersHomePage;
