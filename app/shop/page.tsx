// app/farmers/adapted/products/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/shared/context/UserContext";
import ProductGridClient, {
  ProductGridItem,
} from "@/shared/components/molecules/ProductGridClient";

type AdaptedWithFarmer = {
  id: string;
  buyerId: string;
  farmerId: string;
  farmer: {
    id: string; // Farmer document _id
    name: string;
    farmName: string;
    farmArea: string;
    category: string;
    avatar: string;
    about: string;
    place: string;
    phone: string;
    last30daysSales: number;
  } | null;
};

export default function AdoptedFarmersProductsPage() {
  const { user, loading: userLoading } = useUser();

  const [adapted, setAdapted] = useState<AdaptedWithFarmer[]>([]);
  const [adaptedLoading, setAdaptedLoading] = useState(true);
  const [adaptedError, setAdaptedError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductGridItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // search bar state (similar behaviour to /products page)
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // 1️⃣ Load adopted farmers for this buyer
  useEffect(() => {
    if (userLoading) return;

    if (!user?.id) {
      setAdaptedLoading(false);
      setAdapted([]);
      return;
    }

    const fetchAdapted = async () => {
      try {
        setAdaptedLoading(true);
        setAdaptedError(null);

        const res = await fetch(
          `/api/v1/farmers/adapted?buyerId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to fetch adopted farmers");
        }

        const data: AdaptedWithFarmer[] = await res.json();
        setAdapted(data);
      } catch (err: any) {
        console.error("Error fetching adapted farmers:", err);
        setAdaptedError(err.message || "Something went wrong");
      } finally {
        setAdaptedLoading(false);
      }
    };

    fetchAdapted();
  }, [user, userLoading]);

  // 2️⃣ For all adopted farmers, load their products
  useEffect(() => {
    if (!adapted.length) {
      setProducts([]);
      return;
    }

    const farmerIds = adapted
      .map((a) => a.farmer?.id || a.farmerId)
      .filter(Boolean) as string[];

    if (!farmerIds.length) {
      setProducts([]);
      return;
    }

    const fetchAllProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);

        // Map farmerId -> farmer info (for future use if you want to show farmer name)
        const farmerMap = new Map<string, AdaptedWithFarmer["farmer"]>();
        adapted.forEach((a) => {
          if (a.farmer) {
            farmerMap.set(a.farmer.id, a.farmer);
          }
        });

        const all: ProductGridItem[] = [];

        await Promise.all(
          farmerIds.map(async (farmerId) => {
            try {
              const res = await fetch(
                `/api/v1/products/by-farmer/${farmerId}`,
              );
              const json = await res.json();

              const items: any[] =
                json?.data?.items ??
                (Array.isArray(json) ? json : []);

              const farmerInfo = farmerMap.get(farmerId);

              items.forEach((p: any) => {
                const id = String(p._id ?? p.id ?? "");
                const image =
                  (p.image ??
                    (Array.isArray(p.images) && p.images[0]) ??
                    "") || undefined;

                const gridItem: ProductGridItem = {
                  id,
                  name: p.name,
                  image,
                  price:
                    typeof p.price === "number"
                      ? p.price
                      : Number(p.price || 0),
                  category: p.category || "",
                  badge: p.badge || "",
                  description: p.description || "",
                  // (Note: farmer info not used by ProductCard, but you could
                  // extend ProductGridItem later if you want to show it.)
                };

                all.push(gridItem);
              });
            } catch (e) {
              console.error(
                "Error fetching products for farmer",
                farmerId,
                e,
              );
            }
          }),
        );

        setProducts(all);
      } catch (err: any) {
        console.error("Error fetching products for adopted farmers:", err);
        setProductsError(err.message || "Failed to load products");
      } finally {
        setProductsLoading(false);
      }
    };

    fetchAllProducts();
  }, [adapted]);

  // 3️⃣ Category list from products
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => (p.category ?? "").toString().trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  // 4️⃣ Apply search + category filter
  const filteredProducts = useMemo(() => {
    const search = q.trim().toLowerCase();
    const cat = categoryFilter.trim().toLowerCase();

    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search) ||
        (p.description ?? "").toString().toLowerCase().includes(search) ||
        (p.category ?? "").toString().toLowerCase().includes(search);

      const matchesCategory =
        !cat ||
        (p.category ?? "").toString().toLowerCase() === cat;

      return matchesSearch && matchesCategory;
    });
  }, [products, q, categoryFilter]);

  // 5️⃣ Auth guard
  if (!user && !userLoading) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <h1 className="text-2xl font-semibold mb-4">
            Shop from your adopted farmers
          </h1>
          <p className="text-sm text-gray-600">
            Please log in to view products from your adopted farmers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-800">
              Shop from your adopted farmers
            </h1>
            <p className="mt-2 text-stone-600">
              All products shown here are listed by the farmers you&apos;ve
              adopted. 💚
            </p>
          </div>

          {user && (
            <span className="text-xs md:text-sm text-gray-500">
              Buyer: {user.name ?? user.email}
            </span>
          )}
        </header>

        {/* Info row */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs md:text-sm text-stone-500">
          {adaptedLoading ? (
            <span>Loading adopted farmers…</span>
          ) : adaptedError ? (
            <span className="text-red-500">{adaptedError}</span>
          ) : (
            <span>
              Adopted farmers:{" "}
              <span className="font-semibold text-stone-700">
                {adapted.length}
              </span>
            </span>
          )}

          {adapted.length > 0 && (
            <Link
              href="/farmers/adapted"
              className="inline-flex items-center rounded-full border border-stone-200 px-3 py-1 text-xs hover:bg-stone-50"
            >
              View adopted farmers
            </Link>
          )}
        </div>

        {/* If no adopted farmers */}
        {!adaptedLoading && !adaptedError && adapted.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600 mb-8">
            <p>You haven&apos;t adopted any farmers yet.</p>
            <p className="mt-2">
              Explore farmers, adopt the ones you love, and then shop directly
              from their products here.
            </p>
            <Link
              href="/farmers"
              className="mt-3 inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
            >
              Browse farmers
            </Link>
          </div>
        )}

        {/* Search bar (same style as /products) */}
        {adapted.length > 0 && (
          <form
            className="mb-6 w-full sm:w-auto flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              // filtering is live based on state already, so nothing extra here
            }}
          >
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, tags..."
              className="px-3 py-2 border rounded-md w-full sm:w-56"
            />
            <input
              name="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Category"
              list="adopted-product-categories"
              className="px-3 py-2 border rounded-md w-full sm:w-40"
            />
            <datalist id="adopted-product-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <button
              type="submit"
              className="px-3 py-2 bg-green-600 text-white rounded-md w-full sm:w-auto"
            >
              Search
            </button>
          </form>
        )}

        {/* Loading / error for products */}
        {productsLoading && (
          <div className="text-sm text-gray-600 mb-4">
            Loading products from your adopted farmers…
          </div>
        )}

        {productsError && !productsLoading && (
          <div className="text-sm text-red-500 mb-4">{productsError}</div>
        )}

        {/* No products, but has adopted farmers */}
        {!productsLoading &&
          !productsError &&
          adapted.length > 0 &&
          products.length === 0 && (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600 mb-8">
              <p>Your adopted farmers haven&apos;t listed any products yet.</p>
              <p className="mt-1">
                You can still call them directly from the adopted farmers page.
              </p>
            </div>
          )}

        {/* Product grid (reusing existing ProductGridClient = same cards & cart) */}
        <div className="w-full overflow-hidden">
          <ProductGridClient products={filteredProducts} />
        </div>
      </div>
    </div>
  );
}
