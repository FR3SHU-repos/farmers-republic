// app/products/page.tsx  (server component - fetches /api/v1/products and renders client grid)
import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
// import the client wrapper directly (it's a "use client" file)
import ProductGridClient from "@/shared/components/molecules/ProductGridClient";

export const metadata = {
  title: "Products",
  description: "Browse products sourced from smallholder farms",
};

type SearchParams = { searchParams?: { [key: string]: string | string[] | undefined } };

const DEFAULT_LIMIT = 12;

type ProductPreview = {
  id: string;
  name: string;
  image?: string | null;
  price: number;
  category?: string | null;
  badge?: string | null;
  description?: string | null;
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

function getAbsoluteOrigin() {
  // ✅ 1. Explicit origin if set
  if (process.env.NEXT_PUBLIC_APP_ORIGIN) return process.env.NEXT_PUBLIC_APP_ORIGIN;

  // ✅ 2. Vercel auto variable
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // ✅ 3. Netlify provides `URL` automatically (e.g. https://farmers-republic.netlify.app)
  if (process.env.URL) return process.env.URL;

  // ✅ 4. Fallback for local dev
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}


async function fetchProductsFromApi({
  page = 1,
  limit = DEFAULT_LIMIT,
  q = "",
  category = "",
  sort = "createdAt_desc",
}: any): Promise<PagedResult<ProductPreview>> {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (q) params.set("q", String(q));
  if (category) params.set("category", String(category));
  if (sort) params.set("sort", String(sort));

  const origin = getAbsoluteOrigin();
  const url = `${origin}/api/v1/products?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    let body = null;
    try { body = await res.text(); } catch (_) {}
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText} ${String(body)}`);
  }

  const json = await res.json();
  const data = json?.data ?? json;

  const pageNum = Number(data?.page ?? page ?? 1);
  const limitNum = Number(data?.limit ?? limit ?? DEFAULT_LIMIT);
  const total = Number(data?.total ?? (Array.isArray(data?.products) ? data.products.length : 0));
  const totalPages = Number(data?.totalPages ?? Math.max(1, Math.ceil(total / (limitNum || DEFAULT_LIMIT))));
  const productsRaw: any[] = data?.products ?? [];

  const items = (productsRaw || []).map((p: any) => ({
    id: String(p._id ?? p.id ?? ""),
    name: p.name,
    image: (p.image ?? (Array.isArray(p.images) && p.images[0]) ?? "") || undefined,
    price: typeof p.price === "number" ? p.price : Number(p.price || 0),
    category: p.category || "",
    badge: p.badge || "",
    description: p.description || "",
  }));

  return {
    items,
    meta: { total, page: pageNum, limit: limitNum, totalPages },
  };
}

export default async function ProductsPage({ searchParams }: SearchParams) {
  // Await searchParams per Next.js requirements
  const sp = await (searchParams ?? {});

  const page = Number(sp?.page ?? 1);
  const limit = Number(sp?.limit ?? DEFAULT_LIMIT);
  const q = typeof sp?.q === "string" ? sp.q : (Array.isArray(sp?.q) ? sp?.q[0] : "");
  const category = typeof sp?.category === "string" ? sp.category : (Array.isArray(sp?.category) ? sp?.category[0] : "");
  const sort = typeof sp?.sort === "string" ? sp.sort : "createdAt_desc";

  let data: PagedResult<ProductPreview> = {
    items: [],
    meta: { total: 0, page, limit, totalPages: 1 },
  };

  try {
    data = await fetchProductsFromApi({ page, limit, q, category, sort });
  } catch (err) {
    console.error("Error loading products from API:", err);
  }

  const { items, meta } = data;
  const currentPage = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  const buildLink = (p: number) => {
    const qs = new URLSearchParams();
    if (p) qs.set("page", String(p));
    if (limit) qs.set("limit", String(limit));
    if (q) qs.set("q", String(q));
    if (category) qs.set("category", String(category));
    if (sort) qs.set("sort", String(sort));
    return `/products?${qs.toString()}`;
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-800">Browse products</h1>
            <p className="mt-2 text-stone-600">Locally sourced products from trusted growers</p>
          </div>

          <form
  action="/products"
  method="get"
  className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
>
  <input
    name="q"
    defaultValue={String(q || "")}
    placeholder="Search products, tags..."
    className="px-3 py-2 border rounded-md w-full sm:w-56"
  />
  <input
    name="category"
    defaultValue={String(category || "")}
    placeholder="Category"
    className="px-3 py-2 border rounded-md w-full sm:w-40"
  />
  <input type="hidden" name="limit" value={String(limit)} />
  <button className="px-3 py-2 bg-green-600 text-white rounded-md w-full sm:w-auto">
    Search
  </button>
</form>
        </header>

        {/* Product grid: client wrapper handles interactivity (no server -> client function props) */}
       <div className="w-full overflow-hidden">
  <ProductGridClient products={items} />
</div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-stone-600">
            Showing page {currentPage} of {totalPages} — {meta?.total ?? 0} products
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
