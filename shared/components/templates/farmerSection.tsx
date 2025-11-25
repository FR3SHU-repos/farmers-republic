// app/shared/components/templates/farmerSection.tsx

import React from "react";
import { categoriesList } from "@/shared/data/category";

type Farmer = {
  id: string;
  name: string;
  farmName?: string;
  avatar?: string;
  about?: string;
  place?: string;
  phone?: string;
  category?: string;      // 👈 new
  last30daysSales?: number;
};

type FarmerSectionProps = {
  loading: boolean;
  error: string | null;
  farmers: Farmer[];          // 👈 raw list, not grouped
  activeCategory: string;     // "All" or a category name
  onFarmerClick: (id: string) => void;
};

const FarmerSection: React.FC<FarmerSectionProps> = ({
  loading,
  error,
  farmers,
  activeCategory,
  onFarmerClick,
}) => {
  // Decide which category blocks to show
  const categoryNamesToShow =
    activeCategory === "All"
      ? categoriesList.map((c) => c.name)
      : [activeCategory];

  return (
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
          categoryNamesToShow.map((catName) => {
            const list = farmers.filter(
              (f) => (f.category || "").toLowerCase() === catName.toLowerCase()
            );

            if (!list.length) return null;

            return (
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
                      onClick={() => onFarmerClick(f.id)}
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

                        {/* Category pill (optional) */}
                        {f.category && (
                          <div className="mt-1">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-[10px] text-green-700 border border-green-100">
                              {f.category}
                            </span>
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
            );
          })}
      </div>
    </section>
  );
};

export default FarmerSection;
