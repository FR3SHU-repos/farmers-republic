// app/farmers/page.tsx  (server component - queries MongoDB directly)
import React from "react";
import FarmerCard from "@/shared/components/molecules/FarmerCard";
import Link from "next/link";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";

export const metadata = {
  title: "Farmers",
  description: "Meet the farmers behind our produce",
};

type SearchParams = { searchParams?: { [key: string]: string | string[] | undefined } };

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

async function fetchFarmersFromDb({ page = 1, limit = DEFAULT_LIMIT, q = "", place = "", sort = "createdAt_desc"}: any): Promise<PagedResult<FarmerPreview>> {
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
    .select("name farmName avatar about place fpo last30daysSales")
    .lean()
    .exec();

  const items = docs.map((f: any) => ({
    id: String(f._id ?? f.id),
    name: f.name,
    farmName: f.farmName,
    avatar: f.avatar,
    about: f.about,
    place: f.place,
    fpo: f.fpo,
    last30daysSales: f.last30daysSales ?? 0,
  }));

  const totalPages = Math.max(1, Math.ceil(total / limitNum));

  return {
    items,
    meta: { total, page: pageNum, limit: limitNum, totalPages },
  };
}

export default async function FarmersPage({ searchParams }: SearchParams) {
  const page = Number(searchParams?.page ?? 1);
  const limit = Number(searchParams?.limit ?? DEFAULT_LIMIT);
  const q = typeof searchParams?.q === "string" ? searchParams.q : (Array.isArray(searchParams?.q) ? searchParams.q[0] : "");
  const place = typeof searchParams?.place === "string" ? searchParams.place : (Array.isArray(searchParams?.place) ? searchParams.place[0] : "");
  const sort = typeof searchParams?.sort === "string" ? searchParams.sort : "createdAt_desc";

let data: PagedResult<FarmerPreview> = {
  items: [],
  meta: { total: 0, page, limit, totalPages: 1 },
};

  try {
    data = await fetchFarmersFromDb({ page, limit, q, place, sort });
  } catch (err) {
    console.error("Error loading farmers from DB:", err);
  }

  const { items, meta } = data;
  const currentPage = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

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
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-800">Meet our farmers</h1>
            <p className="mt-2 text-stone-600">Transparent sourcing from trusted smallholders and family farms.</p>
          </div>

          <form action="/farmers" method="get" className="flex gap-2 items-center">
            <input
              name="q"
              defaultValue={String(q || "")}
              placeholder="Search farmers, crops, place..."
              className="px-3 py-2 border rounded-md"
            />
            <input
              name="place"
              defaultValue={String(place || "")}
              placeholder="Place"
              className="px-3 py-2 border rounded-md"
            />
            <input type="hidden" name="limit" value={String(limit)} />
            <button className="px-3 py-2 bg-green-600 text-white rounded-md">Search</button>
          </form>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full text-center text-stone-500">No farmers found.</div>
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
                  last30daysSales: f.last30daysSales,
                }}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-stone-600">
            Showing page {currentPage} of {totalPages} — {meta?.total ?? 0} farmers
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href={buildLink(Math.max(1, currentPage - 1))}
              className={`px-3 py-1 rounded-md border ${currentPage <= 1 ? "opacity-50 pointer-events-none" : ""}`}
            >
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
                  className={`px-3 py-1 rounded-md border ${pageNum === currentPage ? "bg-green-600 text-white" : ""}`}
                >
                  {pageNum}
                </Link>
              );
            })}

            <Link
              href={buildLink(Math.min(totalPages, currentPage + 1))}
              className={`px-3 py-1 rounded-md border ${currentPage >= totalPages ? "opacity-50 pointer-events-none" : ""}`}
            >
              Next
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
