// This is the section for displaying farmers by category in the main page
// app/shared/components/templates/farmerSection.tsx

import React from "react";

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

type FarmersByCategory = Record<string, Farmer[]>;

type FarmerSectionProps = {
  loading: boolean;
  error: string | null;
  farmersByCategory: FarmersByCategory;
  activeCategory: string;
  onFarmerClick: (id: string) => void;
};

const FarmerSection: React.FC<FarmerSectionProps> = ({
  loading,
  error,
  farmersByCategory,
  activeCategory,
  onFarmerClick,
}) => {
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
  );
};

export default FarmerSection;
