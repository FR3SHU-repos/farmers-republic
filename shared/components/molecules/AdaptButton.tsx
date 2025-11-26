// This is for adapting a farmer to a buyer
// shared/components/molecules/AdaptButton.tsx

"use client";

import { useState } from "react";

interface AdaptButtonProps {
  buyerId: string;      // current logged-in buyer/user
  farmerId: string;     // the farmer being shown
  initialAdapted?: boolean; // optional: if you already know it's adapted
}

export function AdaptButton({ buyerId, farmerId, initialAdapted = false }: AdaptButtonProps) {
  const [loading, setLoading] = useState(false);
  const [adapted, setAdapted] = useState(initialAdapted);
  const [error, setError] = useState<string | null>(null);

  const handleAdapt = async () => {
    if (!buyerId) {
      setError("No buyer selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/farmers/adapted", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buyerId, farmerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to adapt farmer");
        return;
      }

      // If API returns 200 (duplicate) or 201 (created), mark as adapted
      setAdapted(true);
    } catch (err) {
      console.error("Error adapting farmer:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleAdapt}
        disabled={loading || adapted}
        className="px-3 py-1 rounded-md border text-xs md:text-sm hover:bg-gray-100 disabled:opacity-60"
      >
        {adapted ? "Adapted ✓" : loading ? "Adapting..." : "Adapt"}
      </button>
      {error && (
        <span className="text-[10px] text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}
