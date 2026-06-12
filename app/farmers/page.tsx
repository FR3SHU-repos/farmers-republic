// app/farmers/page.tsx  (server component - queries MongoDB directly)
import React from "react";
import FarmerCard from "@/shared/components/molecules/FarmerCard";
import Link from "next/link";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { FARMERS } from "@/shared/data/farmers";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Leaf,
  MapPin,
  Search,
  SlidersHorizontal,
  Sprout,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Farmers",
  description: "Meet the farmers behind our produce",
};

type SearchParamsValue = { [key: string]: string | string[] | undefined };
type SearchParams = { searchParams?: Promise<SearchParamsValue> | SearchParamsValue };

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

type FarmerPreview = {
  id: string;
  name?: string;
  farmName?: string | null;
  avatar?: string | null;
  about?: string | null;
  place?: string | null;
  fpo?: string | null;
  category?: string | null;
  farmArea?: string | null;
  last30daysSales?: number | null;
};

type PagedResult<T> = {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

async function fetchFarmersFromDb({
  page = 1,
  limit = DEFAULT_LIMIT,
  q = "",
  place = "",
  sort = "createdAt_desc",
}: any): Promise<PagedResult<FarmerPreview>> {
  await mongoDB();

  const pageNum = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), MAX_LIMIT) : DEFAULT_LIMIT;
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter: any = {};
  if (q && String(q).trim().length > 0) {
    const term = String(q).trim();
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { farmName: { $regex: term, $options: "i" } },
      { about: { $regex: term, $options: "i" } },
      { crops: { $in: [new RegExp(term, "i")] } },
    ];
  }
  if (place && String(place).trim().length > 0) {
    filter.place = { $regex: String(place).trim(), $options: "i" };
  }

  // Sort mapping
  const [sortField, sortDir] = String(sort).split("_");
  const dir = sortDir === "asc" ? 1 : -1;
  const sortObj: any = {};
  if (sortField === "last30daysSales") sortObj.last30daysSales = dir;
  else if (sortField === "name") sortObj.name = dir;
  else sortObj.createdAt = dir;

  // Count total
  const total = await FarmerModel.countDocuments(filter);

  // Query page (only fields needed for list)
  const docs = await FarmerModel.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select(
      "name farmName avatar about place fpo category farmArea village district state last30daysSales",
    )
    .lean()
    .exec();

  const items = docs.map((f: any) => ({
    id: String(f._id ?? f.id),
    name: f.name,
    farmName: f.farmName,
    avatar: f.avatar,
    about: f.about,
    place:
      f.place ||
      [f.village, f.district, f.state].filter(Boolean).join(", ") ||
      undefined,
    fpo: f.fpo,
    category: f.category,
    farmArea: f.farmArea,
    last30daysSales: f.last30daysSales ?? 0,
  }));

  const totalPages = Math.max(1, Math.ceil(total / limitNum));

  return {
    items,
    meta: { total, page: pageNum, limit: limitNum, totalPages },
  };
}

function getParam(params: SearchParamsValue, key: string, fallback = "") {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function fetchFallbackFarmers({
  page = 1,
  limit = DEFAULT_LIMIT,
  q = "",
  place = "",
}: any): PagedResult<FarmerPreview> {
  const pageNum =
    Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const limitNum =
    Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Math.min(Number(limit), MAX_LIMIT)
      : DEFAULT_LIMIT;
  const search = String(q).trim().toLowerCase();
  const placeSearch = String(place).trim().toLowerCase();

  const filtered = FARMERS.filter((farmer) => {
    const matchesSearch =
      !search ||
      farmer.name.toLowerCase().includes(search) ||
      farmer.farmName?.toLowerCase().includes(search) ||
      farmer.about?.toLowerCase().includes(search) ||
      farmer.crops.some((crop) => crop.toLowerCase().includes(search));

    const matchesPlace =
      !placeSearch || farmer.place?.toLowerCase().includes(placeSearch);

    return matchesSearch && matchesPlace;
  });

  const start = (pageNum - 1) * limitNum;
  const items = filtered.slice(start, start + limitNum).map((farmer) => ({
    id: farmer.id,
    name: farmer.name,
    farmName: farmer.farmName,
    avatar: farmer.avatar,
    about: farmer.about,
    place: farmer.place,
    fpo: farmer.fpo,
    category: farmer.crops[0] ?? null,
    farmArea: farmer.farmArea ?? null,
    last30daysSales: farmer.last30daysSales ?? 0,
  }));

  return {
    items,
    meta: {
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(filtered.length / limitNum)),
    },
  };
}

export default async function FarmersPage({ searchParams }: SearchParams) {
  const params = await Promise.resolve(searchParams ?? {});
  const page = Number(getParam(params, "page", "1"));
  const limit = Number(getParam(params, "limit", String(DEFAULT_LIMIT)));
  const q = getParam(params, "q");
  const place = getParam(params, "place");
  const sort = getParam(params, "sort", "createdAt_desc");

  let data: PagedResult<FarmerPreview> = {
    items: [],
    meta: { total: 0, page, limit, totalPages: 1 },
  };
  let usingFallback = false;

  try {
    data = await fetchFarmersFromDb({ page, limit, q, place, sort });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Using sample farmers because DB load failed:", message);
    data = fetchFallbackFarmers({ page, limit, q, place });
    usingFallback = true;
  }

  const { items, meta } = data;
  const currentPage = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;
  const resultLabel =
    meta.total === 1 ? "1 farmer" : `${meta.total ?? 0} farmers`;

  const buildLink = (p: number) => {
    const qs = new URLSearchParams();
    if (p) qs.set("page", String(p));
    if (limit) qs.set("limit", String(limit));
    if (q) qs.set("q", String(q));
    if (place) qs.set("place", String(place));
    if (sort) qs.set("sort", String(sort));
    return `/farmers?${qs.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f8faf5] pb-20">
      <section className="relative border-b border-emerald-900/10 bg-[#eff6e8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(132,204,22,0.24),transparent_30%),radial-gradient(circle_at_92%_15%,rgba(20,184,166,0.16),transparent_26%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900 shadow-sm backdrop-blur">
                <Sprout className="h-4 w-4 text-lime-600" />
                Farmer directory
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-emerald-950 sm:text-5xl">
                Meet the growers behind your food.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
                Search trusted farmers by name, crop, farm, or place and open a
                full profile with contact, farm details, delivery, crops, and
                products.
              </p>
            {usingFallback && (
                <div className="mt-5 inline-flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Showing sample farmers because the database connection is
                  unavailable.
                </div>
            )}
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
              <div>
                <Users className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-2xl font-semibold text-emerald-950">
                  {meta.total ?? 0}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Farmers
                </p>
              </div>
              <div>
                <Leaf className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-2xl font-semibold text-emerald-950">
                  {items.filter((item) => item.category).length}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Tagged
                </p>
              </div>
              <div>
                <MapPin className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-2xl font-semibold text-emerald-950">
                  {items.filter((item) => item.place).length}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Places
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-14 z-30 border-b border-emerald-900/10 bg-[#f8faf5]/95 backdrop-blur-xl md:top-24">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <form
            action="/farmers"
            method="get"
            className="grid gap-3 lg:grid-cols-[1fr_220px_190px_auto]"
          >
            <label className="relative">
              <span className="sr-only">Search farmers</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                name="q"
                defaultValue={String(q || "")}
                placeholder="Search farmers, crops, farm..."
                className="h-12 w-full rounded-full border border-stone-200 bg-white pl-11 pr-4 text-sm font-medium text-emerald-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Place</span>
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                name="place"
                defaultValue={String(place || "")}
                placeholder="Place"
                className="h-12 w-full rounded-full border border-stone-200 bg-white pl-11 pr-4 text-sm font-medium text-emerald-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Sort farmers</span>
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <select
                name="sort"
                defaultValue={sort}
                className="h-12 w-full appearance-none rounded-full border border-stone-200 bg-white pl-11 pr-4 text-sm font-semibold text-emerald-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="createdAt_desc">Newest</option>
                <option value="last30daysSales_desc">Top sales</option>
                <option value="name_asc">Name A-Z</option>
              </select>
            </label>
            <input type="hidden" name="limit" value={String(limit)} />
            <button className="h-12 rounded-full bg-emerald-800 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-950">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Search results
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950">
              {resultLabel} listed
            </h2>
          </div>
          <p className="text-sm text-stone-500">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-emerald-900/15 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-base font-semibold text-emerald-950">
                No farmers found
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Try a different crop, farmer name, or place.
              </p>
            </div>
          ) : (
            items.map((f: any) => (
              <FarmerCard
                key={f.id}
                farmer={{
                  id: String(f.id),
                  name: f.name,
                  farmName: f.farmName,
                  avatar: f.avatar,
                  about: f.about,
                  place: f.place,
                  fpo: f.fpo,
                  category: f.category,
                  farmArea: f.farmArea,
                  last30daysSales: f.last30daysSales,
                }}
              />
            ))
          )}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-emerald-900/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-stone-600">
            Showing page{" "}
            <span className="text-emerald-950">{currentPage}</span> of{" "}
            <span className="text-emerald-950">{totalPages}</span> with{" "}
            <span className="text-emerald-950">{meta?.total ?? 0}</span>{" "}
            farmers
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href={buildLink(Math.max(1, currentPage - 1))}
              className={`inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-lime-50 ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Link>

            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const half = Math.floor(Math.min(7, totalPages) / 2);
              let start = Math.max(1, currentPage - half);
              if (start + 6 > totalPages) start = Math.max(1, totalPages - 6);
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <Link
                  key={pageNum}
                  href={buildLink(pageNum)}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition ${
                    pageNum === currentPage
                      ? "border-emerald-800 bg-emerald-800 text-white"
                      : "border-stone-200 text-emerald-950 hover:bg-lime-50"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}

            <Link
              href={buildLink(Math.min(totalPages, currentPage + 1))}
              className={`inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-lime-50 ${currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
