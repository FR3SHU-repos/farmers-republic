// shared/components/FarmerProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { Farmer as BaseFarmer } from "@/shared/interfaces/mongodb/farmer";
import {
  Phone,
  MapPin,
  Calendar,
  Leaf,
  Award,
  Truck,
  MessageCircle,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  Users2,
} from "lucide-react";
import ProductFarmerCard from "@/shared/components/molecules/FarmerProductCard";
import { AdaptButton } from "@/shared/components/molecules/AdaptButton";
import { useUser } from "@/shared/context/UserContext";

/**
 * Local extended Farmer type with all optional fields we want to use in UI.
 * This won’t affect your DB model – it’s only for this component.
 */
type Farmer = BaseFarmer & {
  fatherName?: string;
  gender?: string;
  dateOfBirth?: string | Date;

  // Contact
  alternatePhone?: string;
  email?: string;
  whatsappNumber?: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;

  // Farm details
  totalLandArea?: number;
  ownedLandArea?: number;
  leasedLandArea?: number;
  irrigationType?: string;
  soilType?: string;
  waterSource?: string;
  organicCertified?: boolean;
  organicCertificationDetails?: string;
  farmingExperienceYears?: number;

  // Crops
  subCategories?: string[] | string;
  seasonalCrops?: string[] | string;
  perennialCrops?: string[] | string;

  // Delivery
  delivery?: boolean;
  deliveryRadiusKm?: number;
  deliveryPinCodes?: string[] | string;
  pickupLocation?: {
    address?: string;
    lat?: number;
    lng?: number;
  };

  // Story & social
  experienceDescription?: string;
  awards?: string[] | string;
  socialMedia?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    website?: string;
  };

  // also support top-level in case older data is like that
  instagram?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
};

type Product = {
  _id: string;
  name: string;
  price?: number;
  image?: string;
};

/** Safely convert any value to Date or null */
function safeDate(input: any): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/** Compute age in years from a Date, or undefined */
function computeAge(d: Date | null): number | undefined {
  if (!d) return undefined;
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return years >= 0 ? years : undefined;
}

/** Normalize comma separated string or string[] to string[] */
function toArray(val?: string[] | string): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function FarmerProfile({
  farmer,
  farmerId,
}: {
  farmer: Farmer;
  farmerId: string;
}) {
  const { user } = useUser();
  const buyerId = user?.id;

  const [products, setProducts] = useState<Product[]>([]);

  // Dates
  const createdAtDate = safeDate((farmer as any).createdAt);
  const createdAtText = createdAtDate
    ? createdAtDate.toLocaleDateString()
    : null;

  const dobDate = safeDate(farmer.dateOfBirth as any);
  const age = computeAge(dobDate);

  // Normalize arrays
  const seasonalCrops = toArray(farmer.seasonalCrops);
  const perennialCrops = toArray(farmer.perennialCrops);
  const subCategories = toArray(farmer.subCategories);
  const awards = toArray(farmer.awards as any);
  const deliveryPinCodes = toArray(farmer.deliveryPinCodes as any);

  // Social links (support nested + top-level)
  const instagram =
    farmer.socialMedia?.instagram || (farmer as any).instagram || "";
  const youtube =
    farmer.socialMedia?.youtube || (farmer as any).youtube || "";
  const facebook =
    farmer.socialMedia?.facebook || (farmer as any).facebook || "";
  const website =
    farmer.socialMedia?.website || (farmer as any).website || "";

  const fullLocation = [
    farmer.village,
    farmer.mandal,
    farmer.district,
    farmer.state,
    farmer.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  // Load products for this farmer
  useEffect(() => {
    async function loadProducts() {
      if (!farmerId) return;
      try {
        const res = await fetch(`/api/v1/products/by-farmer/${farmerId}`);
        const json = await res.json();
        setProducts((json.data?.items as Product[]) || []);
      } catch (e) {
        console.error("Error loading products for farmer:", farmerId, e);
      }
    }

    loadProducts();
  }, [farmerId]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Avatar + meta + contact + delivery */}
        <div className="md:col-span-1 space-y-4">
          {/* Avatar */}
          <div className="rounded-2xl overflow-hidden bg-stone-50 shadow">
            <div className="relative w-full h-72">
              {farmer.avatar ? (
                <Image
                  src={farmer.avatar}
                  alt={farmer.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Basic stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs text-stone-500">Farm area</div>
                <div className="text-sm font-medium">
                  {farmer.farmArea || farmer.totalLandArea
                    ? farmer.farmArea || `${farmer.totalLandArea} acres`
                    : "-"}
                </div>
              </div>

            <div className="flex-1 text-right">
                <div className="text-xs text-stone-500">Category</div>
                <div className="text-sm font-medium">
                  {farmer.category || "-"}
                </div>
              </div>
            </div>

            {farmer.farmingExperienceYears != null && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Calendar className="w-4 h-4" />
                <span>
                  Experience:{" "}
                  <span className="font-medium text-stone-700">
                    {farmer.farmingExperienceYears} years
                  </span>
                </span>
              </div>
            )}

            {farmer.organicCertified && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                <Leaf className="w-3 h-3 mr-1" />
                Organic / Natural practices
              </div>
            )}

            {createdAtText && (
              <div className="pt-2 border-t border-stone-100 text-xs text-stone-500">
                Onboarded:{" "}
                <span className="font-medium text-stone-700">
                  {createdAtText}
                </span>
              </div>
            )}
          </div>

          {/* Contact + AdaptButton */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-stone-700">
                Contact
              </div>
              {user?.type === "Buyer" && buyerId && (
                <AdaptButton buyerId={buyerId} farmerId={farmerId} />
              )}
            </div>

            {(farmer.phone || farmer.whatsappNumber) && (
              <div className="space-y-2">
                {farmer.phone && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-stone-500" />
                      <div className="text-sm">{farmer.phone}</div>
                    </div>
                    <a
                      href={`tel:${farmer.phone}`}
                      className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium"
                    >
                      Call
                    </a>
                  </div>
                )}

                {farmer.whatsappNumber && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <div className="text-sm">
                        {farmer.whatsappNumber || farmer.phone}
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${farmer.whatsappNumber?.replace(
                        /\D/g,
                        "",
                      )}`}
                      target="_blank"
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Location */}
            <div className="mt-2 flex items-start gap-2 text-sm text-stone-500">
              <MapPin className="w-4 h-4 mt-0.5" />
              <div>{fullLocation || "-"}</div>
            </div>

            {/* Email */}
            {farmer.email && (
              <div className="text-xs text-stone-500 mt-1">
                Email:{" "}
                <a
                  className="text-green-700 font-medium"
                  href={`mailto:${farmer.email}`}
                >
                  {farmer.email}
                </a>
              </div>
            )}
          </div>

          {/* Delivery info */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <Truck className="w-4 h-4" />
              Delivery
            </div>

            <div className="text-sm text-stone-600">
              {farmer.delivery
                ? "Farmer can deliver directly to buyers."
                : "Pickup / courier via platform."}
            </div>

            {farmer.delivery && (
              <div className="text-xs text-stone-500 space-y-1">
                {farmer.deliveryRadiusKm != null && (
                  <div>
                    Radius:{" "}
                    <span className="font-medium text-stone-700">
                      {farmer.deliveryRadiusKm} km
                    </span>
                  </div>
                )}

                {deliveryPinCodes.length > 0 && (
                  <div>
                    Pincodes:{" "}
                    <span className="font-medium text-stone-700">
                      {deliveryPinCodes.join(", ")}
                    </span>
                  </div>
                )}
                {farmer.pickupLocation?.address && (
                  <div>
                    Pickup:{" "}
                    <span className="font-medium text-stone-700">
                      {farmer.pickupLocation.address}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Header card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-extrabold text-stone-900">
                    {farmer.name}
                  </h1>
                  {farmer.farmName && (
                    <div className="text-sm text-stone-500 mt-1">
                      {farmer.farmName}
                    </div>
                  )}
                  {farmer.fatherName && (
                    <div className="text-xs text-stone-500 mt-0.5">
                      S/o {farmer.fatherName}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  {farmer.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-[11px] font-semibold text-green-700 border border-green-100">
                      <Leaf className="w-3 h-3 mr-1" />
                      {farmer.category}
                    </span>
                  )}

                  {age && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-stone-50 text-[11px] font-semibold text-stone-700 border border-stone-100">
                      <Users2 className="w-3 h-3 mr-1" />
                      Age {age}
                    </span>
                  )}
                </div>
              </div>

              {farmer.about && (
                <p className="mt-3 text-sm text-stone-700 leading-relaxed">
                  {farmer.about}
                </p>
              )}

              {farmer.experienceDescription && (
                <p className="mt-2 text-xs text-stone-500 leading-relaxed">
                  {farmer.experienceDescription}
                </p>
              )}
            </div>
          </div>

          {/* Farm details */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <h3 className="font-semibold text-stone-800 mb-1 text-sm">
              Farm details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
              {farmer.totalLandArea != null && (
                <div>
                  <span className="text-stone-500">Total land: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.totalLandArea} acres
                  </span>
                </div>
              )}
              {farmer.ownedLandArea != null && (
                <div>
                  <span className="text-stone-500">Owned: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.ownedLandArea} acres
                  </span>
                </div>
              )}
              {farmer.leasedLandArea != null && (
                <div>
                  <span className="text-stone-500">Leased: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.leasedLandArea} acres
                  </span>
                </div>
              )}
              {farmer.irrigationType && (
                <div>
                  <span className="text-stone-500">Irrigation: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.irrigationType}
                  </span>
                </div>
              )}
              {farmer.soilType && (
                <div>
                  <span className="text-stone-500">Soil: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.soilType}
                  </span>
                </div>
              )}
              {farmer.waterSource && (
                <div>
                  <span className="text-stone-500">Water source: </span>
                  <span className="font-medium text-stone-800">
                    {farmer.waterSource}
                  </span>
                </div>
              )}
            </div>

            {!farmer.totalLandArea &&
              !farmer.irrigationType &&
              !farmer.soilType &&
              !farmer.waterSource && (
                <div className="text-xs text-stone-400">
                  No detailed farm data added yet.
                </div>
              )}
          </div>

          {/* Crops / categories */}
          {(seasonalCrops.length > 0 ||
            perennialCrops.length > 0 ||
            subCategories.length > 0) && (
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
              <h3 className="font-semibold text-stone-800 mb-1 text-sm">
                Crops & produce
              </h3>

              {subCategories.length > 0 && (
                <div className="text-xs text-stone-500 mb-1">
                  Categories:
                  <div className="mt-1 flex flex-wrap gap-1">
                    {subCategories.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-stone-50 border border-stone-100 text-[11px] text-stone-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {seasonalCrops.length > 0 && (
                <div className="text-xs text-stone-500 mb-2">
                  Seasonal crops:
                  <div className="mt-1 flex flex-wrap gap-1">
                    {seasonalCrops.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-[11px] text-green-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {perennialCrops.length > 0 && (
                <div className="text-xs text-stone-500">
                  Perennial crops:
                  <div className="mt-1 flex flex-wrap gap-1">
                    {perennialCrops.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[11px] text-amber-800"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Awards */}
          {awards.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                <Award className="w-4 h-4 text-amber-500" />
                Awards & recognitions
              </div>
              <ul className="list-disc list-inside text-sm text-stone-700 space-y-1">
                {awards.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Social links */}
          {(instagram || youtube || facebook || website) && (
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                <Globe className="w-4 h-4" />
                Online presence
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
                  >
                    <Instagram className="w-3 h-3" />
                    Instagram
                  </a>
                )}
                {youtube && (
                  <a
                    href={youtube}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100"
                  >
                    <Youtube className="w-3 h-3" />
                    YouTube
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    <Facebook className="w-3 h-3" />
                    Facebook
                  </a>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-50 text-stone-700 border border-stone-100"
                  >
                    <Globe className="w-3 h-3" />
                    Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Products list (existing card) */}
          <ProductFarmerCard products={products} />
        </div>
      </div>
    </div>
  );
}
