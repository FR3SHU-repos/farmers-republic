import React from "react";
import { CATEGORIES } from "@/shared/data/category";
import { ArrowUpRight, BadgeCheck, MapPin, Sprout } from "lucide-react";

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
      ? CATEGORIES.filter((c) => c.name !== "All").map((c) => c.name)
      : [activeCategory];

  return (
    <section className="bg-transparent py-7 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="space-y-5">
            <div className="h-5 w-44 animate-pulse rounded-full bg-emerald-100" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-3xl border border-emerald-100 bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-10 text-center">
            <p className="mb-1 text-sm font-semibold text-red-700">
              Couldn&apos;t load farmers
            </p>
            <p className="text-sm text-red-700/70">{error}</p>
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
              <div key={catName} className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Farmer category
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950">
                      {catName}
                    </h2>
                  </div>
                  <p className="rounded-full border border-emerald-900/10 bg-white px-3 py-1 text-xs font-semibold text-emerald-900 shadow-sm">
                    {list.length} farmer{list.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div
                  className="
                    flex lg:grid lg:grid-cols-3 lg:auto-rows-fr
                    gap-4 pb-3 lg:pb-0
                    overflow-x-auto md:overflow-visible
                    scrollbar-hide
                    snap-x snap-mandatory lg:snap-none
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
                          group snap-start lg:snap-none flex-shrink-0 lg:flex-shrink
                          w-[82vw] sm:w-[22rem] lg:w-full
                          text-left bg-white border border-emerald-900/10 rounded-3xl
                          shadow-[0_18px_50px_rgba(15,61,46,0.08)]
                          hover:shadow-[0_24px_70px_rgba(15,61,46,0.14)]
                          hover:-translate-y-1
                          transition
                          overflow-hidden
                          flex flex-col
                        "
                      >
                        <div className="relative h-44 overflow-hidden bg-emerald-50">
                          {f.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={f.avatar}
                              alt={f.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(190,242,100,0.42),transparent_32%),linear-gradient(135deg,#ecfccb,#ccfbf1)]">
                              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/78 text-3xl font-semibold text-emerald-900 shadow-sm">
                                {f.name?.charAt(0)?.toUpperCase() ?? "F"}
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-emerald-950/55 to-transparent" />
                          {f.category && (
                            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-sm backdrop-blur">
                              {f.category}
                            </span>
                          )}
                          <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-900 shadow-lg transition group-hover:bg-lime-300">
                            <ArrowUpRight className="h-5 w-5" />
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-semibold text-emerald-950">
                                {f.name}
                              </p>
                              {f.farmName && (
                                <p className="mt-0.5 truncate text-sm font-medium text-stone-500">
                                  {f.farmName}
                                </p>
                              )}
                            </div>
                            <BadgeCheck className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600" />
                          </div>

                          {f.place && (
                            <p className="mt-3 flex items-center gap-1.5 text-sm text-stone-600">
                              <MapPin className="h-4 w-4 flex-shrink-0 text-emerald-700" />
                              <span className="truncate">{f.place}</span>
                            </p>
                          )}

                          {f.about && (
                            <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">
                              {f.about}
                            </p>
                          )}

                          <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
                            <span className="text-stone-600">
                              {isNewFarmer ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Sprout className="h-4 w-4 text-lime-600" />
                                  New on platform
                                </span>
                              ) : (
                                <>
                                  Last 30 days{" "}
                                  <span className="font-semibold text-emerald-900">
                                    {f.last30daysSales}
                                  </span>
                                </>
                              )}
                            </span>
                            <span className="font-semibold text-emerald-800">
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
          <div className="rounded-3xl border border-dashed border-emerald-900/15 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-semibold text-emerald-950">
              No farmers found yet
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Try changing the category or check back when more farmers join.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FarmerSection;
