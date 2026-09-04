// shared/components/FarmerProfile.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { Farmer as BaseFarmer } from "@/shared/interfaces/mongodb/farmer";
import {
  Award,
  BadgeCheck,
  Calendar,
  Droplets,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Truck,
  Users2,
  Youtube,
} from "lucide-react";
import ProductFarmerCard from "@/shared/components/molecules/FarmerProductCard";
import { AdaptButton } from "@/shared/components/molecules/AdaptButton";
import { farmerAPI } from "@/shared/lib/api/farmers";
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

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,61,46,0.08)]">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-950">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-50 text-emerald-800">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-emerald-950">{value}</div>
    </div>
  );
}

function Chip({
  children,
  tone = "emerald",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "lime" | "amber" | "stone" | "pink" | "red" | "blue";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    lime: "border-lime-200 bg-lime-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    stone: "border-stone-200 bg-stone-50 text-stone-700",
    pink: "border-pink-100 bg-pink-50 text-pink-700",
    red: "border-red-100 bg-red-50 text-red-600",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
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
        const items = await farmerAPI.products(farmerId);
        setProducts(items.map((product) => ({
          _id: String(product.id ?? product._id ?? ""),
          name: product.name,
          price: product.price,
          image: product.image ?? product.images?.[0],
        })));
      } catch (e) {
        console.error("Error loading products for farmer:", farmerId, e);
      }
    }

    loadProducts();
  }, [farmerId]);

  const farmAreaText =
    farmer.farmArea ||
    (farmer.totalLandArea != null ? `${farmer.totalLandArea} acres` : null);

  return (
    <div className="min-h-screen bg-[#f8faf5] pb-20">
      <section className="relative overflow-hidden border-b border-emerald-900/10 bg-[#eff6e8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(132,204,22,0.24),transparent_30%),radial-gradient(circle_at_90%_12%,rgba(20,184,166,0.16),transparent_26%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[390px_1fr] lg:px-8 lg:py-12">
          <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/80 bg-emerald-950 shadow-2xl shadow-emerald-950/20">
            {farmer.avatar ? (
              <Image
                src={farmer.avatar}
                alt={farmer.name}
                fill
                priority
                className="object-cover"
                sizes="(min-width:1024px) 390px, 100vw"
              />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(190,242,100,0.42),transparent_32%),linear-gradient(135deg,#ecfccb,#ccfbf1)]">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/80 text-4xl font-semibold text-emerald-950 shadow-sm">
                  {farmer.name?.[0] ?? "F"}
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-emerald-950/75 to-transparent" />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              {farmer.category && (
                <Chip tone="lime">
                  <Leaf className="h-3.5 w-3.5" />
                  {farmer.category}
                </Chip>
              )}
              {farmer.organicCertified && (
                <Chip>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Organic
                </Chip>
              )}
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/15 p-4 text-white shadow-xl backdrop-blur-md">
              <p className="text-sm font-semibold">Farm profile</p>
              <p className="mt-1 text-sm text-white/80">
                {farmAreaText || "Farm area pending"} ·{" "}
                {fullLocation || "Location pending"}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900 shadow-sm backdrop-blur">
              <Sprout className="h-4 w-4 text-lime-600" />
              Farmer profile
            </div>
            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight text-emerald-950 sm:text-5xl">
                  {farmer.name}
                </h1>
                {farmer.farmName && (
                  <p className="mt-2 text-lg font-medium text-stone-600">
                    {farmer.farmName}
                  </p>
                )}
                {farmer.fatherName && (
                  <p className="mt-1 text-sm text-stone-500">
                    S/o {farmer.fatherName}
                  </p>
                )}
              </div>

              {user?.type === "Buyer" && buyerId && (
                <div className="rounded-2xl border border-emerald-900/10 bg-white/80 p-2 shadow-sm backdrop-blur">
                  <AdaptButton buyerId={buyerId} farmerId={farmerId} />
                </div>
              )}
            </div>

            {farmer.about && (
              <p className="mt-5 max-w-3xl text-base leading-7 text-stone-700">
                {farmer.about}
              </p>
            )}

            {farmer.experienceDescription && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
                {farmer.experienceDescription}
              </p>
            )}

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                <Ruler className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-lg font-semibold text-emerald-950">
                  {farmAreaText || "-"}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Farm area
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                <Leaf className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-lg font-semibold text-emerald-950">
                  {farmer.category || "-"}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Category
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                <Calendar className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-lg font-semibold text-emerald-950">
                  {farmer.farmingExperienceYears != null
                    ? `${farmer.farmingExperienceYears} yrs`
                    : "-"}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Experience
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                <ShoppingBasket className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-lg font-semibold text-emerald-950">
                  {products.length}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Products
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[340px_1fr] lg:px-8">
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <InfoCard title="Contact" icon={<Phone className="h-4 w-4" />}>
            <div className="space-y-3">
              {farmer.phone && (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Phone
                    </p>
                    <p className="truncate text-sm font-semibold text-emerald-950">
                      {farmer.phone}
                    </p>
                  </div>
                  <a
                    href={`tel:${farmer.phone}`}
                    className="rounded-full bg-emerald-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950"
                  >
                    Call
                  </a>
                </div>
              )}

              {farmer.whatsappNumber && (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-lime-50 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      WhatsApp
                    </p>
                    <p className="truncate text-sm font-semibold text-emerald-950">
                      {farmer.whatsappNumber || farmer.phone}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${farmer.whatsappNumber?.replace(
                      /\D/g,
                      "",
                    )}`}
                    target="_blank"
                    className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    Chat
                  </a>
                </div>
              )}

              {farmer.email && (
                <a
                  className="flex items-center gap-2 rounded-2xl bg-stone-50 p-3 text-sm font-semibold text-emerald-900 transition hover:bg-lime-50"
                  href={`mailto:${farmer.email}`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{farmer.email}</span>
                </a>
              )}

              <div className="flex items-start gap-2 rounded-2xl bg-stone-50 p-3 text-sm text-stone-600">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                <span>{fullLocation || "Location not added yet."}</span>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Delivery" icon={<Truck className="h-4 w-4" />}>
            <p className="text-sm leading-6 text-stone-600">
              {farmer.delivery
                ? "Farmer can deliver directly to buyers."
                : "Pickup or courier via platform."}
            </p>
            <div className="mt-4 grid gap-3">
              <DetailRow
                label="Radius"
                value={
                  farmer.deliveryRadiusKm != null
                    ? `${farmer.deliveryRadiusKm} km`
                    : undefined
                }
              />
              <DetailRow
                label="Pincodes"
                value={
                  deliveryPinCodes.length > 0
                    ? deliveryPinCodes.join(", ")
                    : undefined
                }
              />
              <DetailRow
                label="Pickup"
                value={farmer.pickupLocation?.address}
              />
            </div>
          </InfoCard>

          {createdAtText && (
            <InfoCard title="Profile status" icon={<BadgeCheck className="h-4 w-4" />}>
              <DetailRow label="Onboarded" value={createdAtText} />
            </InfoCard>
          )}
        </aside>

        <main className="space-y-6">
          <InfoCard title="Farm details" icon={<Ruler className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow
                label="Total land"
                value={
                  farmer.totalLandArea != null
                    ? `${farmer.totalLandArea} acres`
                    : undefined
                }
              />
              <DetailRow
                label="Owned land"
                value={
                  farmer.ownedLandArea != null
                    ? `${farmer.ownedLandArea} acres`
                    : undefined
                }
              />
              <DetailRow
                label="Leased land"
                value={
                  farmer.leasedLandArea != null
                    ? `${farmer.leasedLandArea} acres`
                    : undefined
                }
              />
              <DetailRow label="Irrigation" value={farmer.irrigationType} />
              <DetailRow label="Soil" value={farmer.soilType} />
              <DetailRow label="Water source" value={farmer.waterSource} />
              <DetailRow
                label="Organic certification"
                value={
                  farmer.organicCertified
                    ? farmer.organicCertificationDetails || "Certified"
                    : undefined
                }
              />
              <DetailRow
                label="Age"
                value={age !== undefined ? `${age} years` : undefined}
              />
            </div>

            {!farmer.totalLandArea &&
              !farmer.irrigationType &&
              !farmer.soilType &&
              !farmer.waterSource && (
                <p className="text-sm text-stone-500">
                  No detailed farm data added yet.
                </p>
              )}
          </InfoCard>

          {(seasonalCrops.length > 0 ||
            perennialCrops.length > 0 ||
            subCategories.length > 0) && (
            <InfoCard title="Crops and produce" icon={<Leaf className="h-4 w-4" />}>
              <div className="space-y-5">
                {subCategories.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subCategories.map((c) => (
                        <Chip key={c} tone="stone">
                          {c}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {seasonalCrops.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Seasonal crops
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {seasonalCrops.map((c) => (
                        <Chip key={c} tone="lime">
                          {c}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {perennialCrops.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Perennial crops
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {perennialCrops.map((c) => (
                        <Chip key={c} tone="amber">
                          {c}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>
          )}

          {awards.length > 0 && (
            <InfoCard title="Awards and recognitions" icon={<Award className="h-4 w-4" />}>
              <div className="grid gap-2">
                {awards.map((award) => (
                  <div
                    key={award}
                    className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-900"
                  >
                    <Award className="h-4 w-4 flex-shrink-0" />
                    {award}
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {(instagram || youtube || facebook || website) && (
            <InfoCard title="Online presence" icon={<Globe className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {instagram && (
                  <a href={instagram} target="_blank">
                    <Chip tone="pink">
                      <Instagram className="h-3.5 w-3.5" />
                      Instagram
                      <ExternalLink className="h-3 w-3" />
                    </Chip>
                  </a>
                )}
                {youtube && (
                  <a href={youtube} target="_blank">
                    <Chip tone="red">
                      <Youtube className="h-3.5 w-3.5" />
                      YouTube
                      <ExternalLink className="h-3 w-3" />
                    </Chip>
                  </a>
                )}
                {facebook && (
                  <a href={facebook} target="_blank">
                    <Chip tone="blue">
                      <Facebook className="h-3.5 w-3.5" />
                      Facebook
                      <ExternalLink className="h-3 w-3" />
                    </Chip>
                  </a>
                )}
                {website && (
                  <a href={website} target="_blank">
                    <Chip tone="stone">
                      <Globe className="h-3.5 w-3.5" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </Chip>
                  </a>
                )}
              </div>
            </InfoCard>
          )}

          <ProductFarmerCard products={products} />
        </main>
      </div>
    </div>
  );
}
