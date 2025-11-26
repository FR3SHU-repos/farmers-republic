// app/farmers/adapted/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/shared/context/UserContext";

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

            return (
              <div
                key={item.id}
                className="border rounded-lg p-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  {f.avatar && (
                    // use next/image if you want
                    <img
                      src={f.avatar}
                      alt={f.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-sm md:text-base">
                      {f.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {f.farmName || "—"} • {f.place || "Location NA"}
                    </div>
                  </div>
                </div>

                {f.about && (
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {f.about}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 mt-1">
                  {f.category && (
                    <span className="px-2 py-0.5 rounded-full border">
                      {f.category}
                    </span>
                  )}
                  {f.farmArea && (
                    <span className="px-2 py-0.5 rounded-full border">
                      Area: {f.farmArea}
                    </span>
                  )}
                  {f.phone && (
                    <span className="px-2 py-0.5 rounded-full border">
                      📞 {f.phone}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
