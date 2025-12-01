// app/buyers/profile/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, User as UserIcon } from "lucide-react";

type BuyerAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
};

type Buyer = {
  _id: string;
  profileId?: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  photoPath?: string;
  about?: string;
  address?: BuyerAddress;
};

export default function BuyerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params; // profileId / buyerId from orders

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/buyers?profileId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("Buyer profile error:", res.status, text);
          throw new Error("Failed to load buyer profile");
        }

        const json = await res.json();
        if (!json.success || !json.data?.buyer) {
          throw new Error(json.message || "Buyer not found");
        }

        setBuyer(json.data.buyer as Buyer);
      } catch (err: any) {
        setError(err?.message || "Failed to load buyer profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // -------- Loading state --------
  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white border border-stone-200 rounded-2xl px-6 py-5 shadow-sm flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-stone-200 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-stone-700">
              Loading buyer profile…
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Please wait a moment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // -------- Error / not found --------
  if (error || !buyer) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-100 rounded-2xl px-6 py-5 shadow-sm max-w-md w-full">
          <p className="text-sm font-semibold text-red-600 mb-1">
            {error || "Buyer not found"}
          </p>
          <p className="text-xs text-stone-500 mb-4">
            The buyer profile could not be loaded. The link may be invalid, or
            the profile might have been removed.
          </p>
          <Link
            href="/farmers/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 hover:text-stone-900"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to orders dashboard
          </Link>
        </div>
      </main>
    );
  }

  const addr = buyer.address;

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-stone-50 to-white text-stone-800">
      {/* Top bar / breadcrumb-ish */}
      <div className="border-b border-stone-100 bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <Link
            href="/farmers/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium text-stone-600">
            <UserIcon className="w-3 h-3" />
            Buyer Profile
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Header block */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Avatar */}
          {buyer.avatar || buyer.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={buyer.avatar || buyer.photoPath || ""}
              alt={buyer.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-stone-200"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-xl sm:text-2xl font-semibold shadow-sm">
              {buyer.name?.[0]?.toUpperCase() || "B"}
            </div>
          )}

          {/* Name / meta */}
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                {buyer.name}
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-[11px] font-medium">
                Active buyer
              </span>
            </div>

            <p className="text-xs text-stone-500">
              Buyer ID:{" "}
              <span className="font-mono text-[11px] bg-stone-100/80 px-1.5 py-0.5 rounded">
                {buyer.profileId || buyer._id}
              </span>
            </p>

            {buyer.about && (
              <p className="text-xs sm:text-sm text-stone-600 mt-1 line-clamp-2">
                {buyer.about}
              </p>
            )}
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4 sm:gap-6">
          {/* Left column: contact + address + about */}
          <div className="space-y-4 sm:space-y-5">
            {/* Contact card */}
            <section className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-50 border border-green-100">
                    <Phone className="w-3.5 h-3.5 text-green-700" />
                  </span>
                  Contact Details
                </h2>
                <span className="text-[11px] text-stone-400">
                  Shared with you via orders
                </span>
              </div>

              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-stone-700">
                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-wide text-stone-400">
                    Phone
                  </p>
                  <p className="font-medium">
                    {buyer.phone || "Not provided"}
                  </p>
                  {buyer.phone && (
                    <a
                      href={`tel:${buyer.phone}`}
                      className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-wide text-stone-400">
                    Email
                  </p>
                  <p className="font-medium break-all">
                    {buyer.email || "Not provided"}
                  </p>
                  {buyer.email && (
                    <a
                      href={`mailto:${buyer.email}`}
                      className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800"
                    >
                      <Mail className="w-3 h-3" />
                      Send email
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Address card */}
            <section className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
                  <MapPin className="w-3.5 h-3.5 text-blue-700" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-stone-800">
                    Address
                  </h2>
                  <p className="text-xs text-stone-500">
                    Used for deliveries and communication
                  </p>
                </div>
              </div>

              {addr ? (
                <div className="mt-2 text-sm text-stone-700 space-y-0.5">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>
                    {addr.city}
                    {addr.state ? `, ${addr.state}` : ""} – {addr.pincode}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-stone-500 mt-2">
                  Address not available for this buyer.
                </p>
              )}
            </section>

            {/* About card */}
            <section className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-stone-800 mb-1.5">
                Notes / About
              </h2>
              {buyer.about ? (
                <p className="text-sm text-stone-700 whitespace-pre-line">
                  {buyer.about}
                </p>
              ) : (
                <p className="text-sm text-stone-500">
                  No additional information has been provided about this buyer.
                </p>
              )}
            </section>
          </div>

          {/* Right column: small meta card */}
          <aside className="space-y-4 sm:space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-semibold text-stone-800 mb-1">
                Quick Info
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-xs">
                    Profile type
                  </span>
                  <span className="text-xs font-medium text-stone-800">
                    Buyer
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-xs">
                    Profile reference
                  </span>
                  <span className="text-[11px] font-mono bg-stone-100/80 px-1.5 py-0.5 rounded">
                    {buyer.profileId || buyer._id}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                <p className="text-[11px] text-stone-500">
                  Use this page to quickly view contact and address details for
                  buyers who placed orders with you.
                </p>
                <Link
                  href="/farmers/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 transition"
                >
                  Back to Orders
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
