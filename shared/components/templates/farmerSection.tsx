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
  category?: string;
  last30daysSales?: number;
};

type FarmerSectionProps = {
  loading: boolean;
  error: string | null;
  farmers: Farmer[];
  activeCategory: string; // "All" or a category name
  onFarmerClick: (id: string) => void;
};

const FarmerSection: React.FC<FarmerSectionProps> = ({
  loading,
  error,
  farmers,
  activeCategory,
  onFarmerClick,
}) => {
  const categoryNamesToShow =
    activeCategory === "All"
      ? categoriesList.map((c) => c.name)
      : [activeCategory];

  return (
    <section className="py-6 sm:py-8 bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Loading */}
        {loading && (
          <div className="space-y-5">
            <div className="h-4 w-40 bg-emerald-100 rounded-full animate-pulse" />
            <div className="flex gap-4 overflow-x-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[72vw] max-w-xs sm:w-56 md:w-60 lg:w-64 h-56 bg-white border border-emerald-100 rounded-2xl shadow-sm animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-sm font-medium text-red-600 mb-1">
              Couldn&apos;t load farmers
            </p>
            <p className="text-xs text-stone-500">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading &&
          !error &&
          categoryNamesToShow.map((catName) => {
            const list = farmers.filter(
              (f) =>
                (f.category || "").toLowerCase() === catName.toLowerCase()
            );

            if (!list.length) return null;

            return (
              <div key={catName} className="space-y-3">
                {/* Category header */}
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-emerald-900">
                    {catName}
                  </h2>
                  <p className="text-[11px] text-emerald-800/70">
                    {list.length} farmer{list.length === 1 ? "" : "s"}
                  </p>
                </div>

                {/* Cards – horizontal on mobile, grid on md+ */}
                <div
                  className="
                    flex md:grid md:grid-cols-3 md:auto-rows-fr
                    gap-4 pb-3
                    overflow-x-auto md:overflow-visible
                    scrollbar-hide
                    snap-x md:snap-none snap-mandatory md:snap-none
                  "
                >
                  {list.map((f) => {
                    const isNewFarmer =
                      typeof f.last30daysSales !== "number" ||
                      f.last30daysSales === 0;

                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onFarmerClick(f.id)}
                        className="
                          snap-start md:snap-none flex-shrink-0 md:flex-shrink
                          w-[72vw] sm:w-56 md:w-full
                          text-left bg-white border border-emerald-100 rounded-2xl
                          shadow-[0_10px_30px_rgba(16,185,129,0.12)]
                          hover:shadow-[0_18px_45px_rgba(16,185,129,0.22)]
                          hover:-translate-y-0.5
                          transition-transform transition-shadow
                          overflow-hidden
                          flex flex-col
                        "
                      >
                        {/* Image */}
                        <div className="h-36 sm:h-40 bg-emerald-50 flex items-center justify-center border-b border-emerald-100">
                          {f.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={f.avatar}
                              alt={f.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-3xl text-emerald-400">
                              {f.name?.charAt(0)?.toUpperCase() ?? "👨‍🌾"}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3.5 space-y-1.5 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-emerald-900 truncate">
                                {f.name}
                              </p>
                              {f.farmName && (
                                <p className="text-[11px] text-emerald-800/80 truncate">
                                  {f.farmName}
                                </p>
                              )}
                            </div>
                            {f.category && (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-800 border border-emerald-100 shrink-0">
                                {f.category}
                              </span>
                            )}
                          </div>

                          {f.place && (
                            <p className="text-[11px] text-emerald-800/80 mt-1 flex items-center gap-1">
                              <span aria-hidden>📍</span>
                              <span className="truncate">{f.place}</span>
                            </p>
                          )}

                          {f.about && (
                            <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                              {f.about}
                            </p>
                          )}

                          <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-900/80">
                              {isNewFarmer ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  New on platform
                                </span>
                              ) : (
                                <>
                                  Last 30 days:{" "}
                                  <span className="font-medium">
                                    {f.last30daysSales}
                                  </span>
                                </>
                              )}
                            </span>
                            <span className="font-semibold text-green-700">
                              View
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {!loading && !error && farmers.length === 0 && (
          <div className="text-center py-10 text-sm text-stone-500">
            No farmers found yet. Try changing the category.
          </div>
        )}
      </div>
    </section>
  );
};

export default FarmerSection;
