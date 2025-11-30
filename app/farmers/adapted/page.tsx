// app/farmers/adapted/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/shared/context/UserContext";
import Link from "next/link"; // 👈 add this

type AdaptedWithFarmer = {
  id: string;
  buyerId: string;
  farmerId: string;
  farmer: {
    id: string;
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

export default function AdaptedFarmersPage() {
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<AdaptedWithFarmer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchAdapted = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/v1/farmers/adapted?buyerId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to fetch adapted farmers");
        }

        const data: AdaptedWithFarmer[] = await res.json();
        setItems(data);
      } catch (err: any) {
        console.error("Error fetching adapted farmers:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAdapted();
  }, [user, userLoading]);

  if (!user && !userLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">Adapted Farmers</h1>
        <p className="text-sm text-gray-600">
          Please log in to view your adapted farmers.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">
          Adapted Farmers
        </h1>
        {user && (
          <span className="text-xs md:text-sm text-gray-500">
            Buyer: {user.name ?? user.email}
          </span>
        )}
      </div>

      {loading && (
        <div className="text-sm text-gray-600">Loading adapted farmers...</div>
      )}

      {error && !loading && (
        <div className="text-sm text-red-500 mb-4">{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-gray-600">
          You have not adapted any farmers yet.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const f = item.farmer;
          if (!f) {
            return (
              <div
                key={item.id}
                className="border rounded-lg p-3 text-sm text-gray-500"
              >
                <div className="font-medium mb-1">
                  Farmer not found (ID: {item.farmerId})
                </div>
              </div>
            );
          }

          const initials =
            f.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "F";

          return (
            <article
              key={item.id}
              className="flex flex-col rounded-2xl border border-stone-200 bg-green-50 p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                {f.avatar ? (
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-green-100"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-semibold">
                    {f.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}

                <div>
                  <h2 className="text-base font-semibold text-stone-900 leading-tight">
                    {f.name}
                  </h2>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {f.farmName || "Farm name not available"}
                  </p>
                </div>
              </div>

              {/* Category */}
              {f.category && (
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    {f.category}
                  </span>
                </div>
              )}

              {/* Meta Info */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                {f.farmArea && (
                  <span className="flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1 text-xs">
                    🌾 Area: {f.farmArea}
                  </span>
                )}

                {f.phone && (
                  <span className="flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1 text-xs">
                    📞 {f.phone}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-5 flex items-center gap-3">
                <Link
                  href={`/farmers/${f.id}`}
                  className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-4 py-2 text-center text-sm font-medium text-stone-800 hover:bg-stone-100"
                >
                  View profile
                </Link>

                {f.phone && (
                  <a
                    href={`tel:${f.phone}`}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    Call farmer
                  </a>
                )}
              </div>
            </article>

          );
        })}
      </div>
    )}

    </main>
  );
}
