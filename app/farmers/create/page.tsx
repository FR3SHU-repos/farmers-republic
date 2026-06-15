// app/farmers/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { useRouter } from "next/navigation";
import { categoriesList } from "@/shared/data/category";
import { useUser } from "@/shared/context/UserContext";

type FormState = {
  id?: string;
  profileId?: string;

  // Basic identity
  name: string;
  fatherName?: string;
  gender: "" | "male" | "female" | "other";
  dateOfBirth?: string; // YYYY-MM-DD

  // Contact
  phone?: string;
  alternatePhone?: string;
  email?: string;
  whatsappNumber?: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  village?: string;   // we previously used "place"
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;

  // Farm details
  farmName?: string;
  farmArea?: string;       // "2 acres" (display)
  totalLandArea?: string;  // number-like, we keep as string for form
  ownedLandArea?: string;
  leasedLandArea?: string;
  irrigationType?: "" | "rainfed" | "borewell" | "canal" | "other";
  soilType?: string;
  waterSource?: string;
  organicCertified: boolean;
  organicCertificationDetails?: string;
  farmingExperienceYears?: string;

  // Categories / crops
  category: string;          // primary category
  subCategories?: string;    // comma separated
  seasonalCrops?: string;    // comma separated
  perennialCrops?: string;   // comma separated

  // KYC / documents (only numbers/ids here; file uploads can be later)
  aadhaarNumber?: string;
  panNumber?: string;
  fssaiLicense?: string;
  gstNumber?: string;

  // Bank details
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  bankBranch?: string;
  upiId?: string;

  // Logistics / delivery
  delivery: boolean;
  deliveryRadiusKm?: string;
  deliveryPinCodes?: string; // comma separated
  pickupAddress?: string;    // maps to pickupLocation.address

  // Story & social
  about?: string;
  experienceDescription?: string;
  awards?: string; // comma separated
  instagram?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
};

type TabKey =
  | "basic"
  | "contact"
  | "address"
  | "farm"
  | "compliance"
  | "banking"
  | "delivery"
  | "story";

export default function FarmerProfilePage() {
  const router = useRouter();
  const { user } = useUser();

  const [form, setForm] = useState<FormState>({
    id: undefined,
    profileId: "",
    name: "",
    fatherName: "",
    gender: "",
    dateOfBirth: "",

    phone: "",
    alternatePhone: "",
    email: "",
    whatsappNumber: "",

    addressLine1: "",
    addressLine2: "",
    village: "",
    mandal: "",
    district: "",
    state: "",
    pincode: "",

    farmName: "",
    farmArea: "",
    totalLandArea: "",
    ownedLandArea: "",
    leasedLandArea: "",
    irrigationType: "",
    soilType: "",
    waterSource: "",
    organicCertified: false,
    organicCertificationDetails: "",
    farmingExperienceYears: "",

    category: "",
    subCategories: "",
    seasonalCrops: "",
    perennialCrops: "",

    aadhaarNumber: "",
    panNumber: "",
    fssaiLicense: "",
    gstNumber: "",

    bankAccountHolderName: "",
    bankAccountNumber: "",
    bankIFSC: "",
    bankName: "",
    bankBranch: "",
    upiId: "",

    delivery: false,
    deliveryRadiusKm: "",
    deliveryPinCodes: "",
    pickupAddress: "",

    about: "",
    experienceDescription: "",
    awards: "",
    instagram: "",
    youtube: "",
    facebook: "",
    website: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  // set profileId from user?.id
  useEffect(() => {
    if (user?.id) {
      setForm((prev) => ({ ...prev, profileId: user.id }));
    }
  }, [user?.id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type, checked } = e.target as any;

    // booleans
    if (name === "delivery") {
      setForm((s) => ({ ...s, delivery: value === "yes" }));
      return;
    }
    if (name === "organicCertified" && type === "checkbox") {
      setForm((s) => ({ ...s, organicCertified: checked }));
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 6 * 1024 * 1024) {
      toast.error("File too large (max 6MB)");
      return;
    }
    setFile(f);
  };

  // Upload file to Supabase and return { publicUrl, path }
  const uploadToSupabase = async (userIdForPath = "anon") => {
    if (!file) return null;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeName = `${userIdForPath}/${Date.now()}.${ext}`;
      const filePath = `avatars/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          metadata: { uploaded_at: new Date().toISOString() },
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      return { publicUrl: publicData.publicUrl, filePath };
    } catch (err: any) {
      console.error("Supabase upload error:", err);
      toast.error(err?.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const basePayload = async () => {
    let photoPayload: { avatar?: string; photoPath?: string } = {};
    if (file) {
      const res = await uploadToSupabase(form.profileId || form.id || "new");
      if (!res) throw new Error("Image upload failed");
      photoPayload.avatar = res.publicUrl;
      photoPayload.photoPath = res.filePath;
    }

    return {
      profileId: form.profileId,

      // Identity
      name: form.name,
      fatherName: form.fatherName || undefined,
      gender: form.gender || undefined,
      dateOfBirth: form.dateOfBirth || undefined,

      // Contact
      phone: form.phone || undefined,
      alternatePhone: form.alternatePhone || undefined,
      email: form.email || undefined,
      whatsappNumber: form.whatsappNumber || undefined,

      // Address
      addressLine1: form.addressLine1 || undefined,
      addressLine2: form.addressLine2 || undefined,
      village: form.village || undefined,
      mandal: form.mandal || undefined,
      district: form.district || undefined,
      state: form.state || undefined,
      pincode: form.pincode || undefined,

      // Farm details
      farmName: form.farmName || undefined,
      farmArea: form.farmArea || undefined,
      totalLandArea: form.totalLandArea || undefined,
      ownedLandArea: form.ownedLandArea || undefined,
      leasedLandArea: form.leasedLandArea || undefined,
      irrigationType: form.irrigationType || undefined,
      soilType: form.soilType || undefined,
      waterSource: form.waterSource || undefined,
      organicCertified: form.organicCertified,
      organicCertificationDetails:
        form.organicCertificationDetails || undefined,
      farmingExperienceYears: form.farmingExperienceYears || undefined,

      // Categories
      category: form.category || "",
      subCategories: form.subCategories || undefined, // API will split if string
      seasonalCrops: form.seasonalCrops || undefined,
      perennialCrops: form.perennialCrops || undefined,

      // KYC / docs
      aadhaarNumber: form.aadhaarNumber || undefined,
      panNumber: form.panNumber || undefined,
      fssaiLicense: form.fssaiLicense || undefined,
      gstNumber: form.gstNumber || undefined,

      // Bank
      bankAccountHolderName: form.bankAccountHolderName || undefined,
      bankAccountNumber: form.bankAccountNumber || undefined,
      bankIFSC: form.bankIFSC || undefined,
      bankName: form.bankName || undefined,
      bankBranch: form.bankBranch || undefined,
      upiId: form.upiId || undefined,

      // Delivery / logistics
      delivery: form.delivery,
      deliveryRadiusKm: form.deliveryRadiusKm || undefined,
      deliveryPinCodes: form.deliveryPinCodes || undefined, // API will split
      pickupLocation: form.pickupAddress
        ? {
            address: form.pickupAddress,
            // If you add map selection later, you can also send lat/lng
          }
        : undefined,

      // Story & social
      about: form.about || undefined,
      experienceDescription: form.experienceDescription || undefined,
      awards: form.awards || undefined,
      socialMedia: {
        instagram: form.instagram || undefined,
        youtube: form.youtube || undefined,
        facebook: form.facebook || undefined,
        website: form.website || undefined,
      },

      ...photoPayload,
    };
  };

  const handleCreate = async () => {
    if (!form.name) {
      toast.error("Please enter your name");
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    try {
      const payload = await basePayload();

      const res = await fetch("/api/v1/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create farmer");
      }

      toast.success("Farmer profile created");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.id) return handleCreate();
    setSaving(true);
    try {
      const payload = await basePayload();

      const res = await fetch(`/api/v1/farmers/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update farmer");

      toast.success("Farmer profile updated");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...prev,
      id: undefined,
      name: "",
      fatherName: "",
      gender: "",
      dateOfBirth: "",
      phone: "",
      alternatePhone: "",
      email: "",
      whatsappNumber: "",
      addressLine1: "",
      addressLine2: "",
      village: "",
      mandal: "",
      district: "",
      state: "",
      pincode: "",
      farmName: "",
      farmArea: "",
      totalLandArea: "",
      ownedLandArea: "",
      leasedLandArea: "",
      irrigationType: "",
      soilType: "",
      waterSource: "",
      organicCertified: false,
      organicCertificationDetails: "",
      farmingExperienceYears: "",
      category: "",
      subCategories: "",
      seasonalCrops: "",
      perennialCrops: "",
      aadhaarNumber: "",
      panNumber: "",
      fssaiLicense: "",
      gstNumber: "",
      bankAccountHolderName: "",
      bankAccountNumber: "",
      bankIFSC: "",
      bankName: "",
      bankBranch: "",
      upiId: "",
      delivery: false,
      deliveryRadiusKm: "",
      deliveryPinCodes: "",
      pickupAddress: "",
      about: "",
      experienceDescription: "",
      awards: "",
      instagram: "",
      youtube: "",
      facebook: "",
      website: "",
    }));
    setFile(null);
    setActiveTab("basic");
  };

  const tabButtonClasses = (tab: TabKey) =>
    [
      "px-3 py-1.5 text-xs md:text-sm rounded-full border transition-all",
      activeTab === tab
        ? "bg-green-600 text-white border-green-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
    ].join(" ");

  return (
    <div className="min-h-screen bg-surface px-4 py-6 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
        {/* Header + Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold text-green-700">
            Farmer Profile
          </h1>

          <div className="flex flex-wrap gap-2">
            <button
              className={tabButtonClasses("basic")}
              onClick={() => setActiveTab("basic")}
            >
              Basic
            </button>
            <button
              className={tabButtonClasses("contact")}
              onClick={() => setActiveTab("contact")}
            >
              Contact
            </button>
            <button
              className={tabButtonClasses("address")}
              onClick={() => setActiveTab("address")}
            >
              Address
            </button>
            <button
              className={tabButtonClasses("farm")}
              onClick={() => setActiveTab("farm")}
            >
              Farm
            </button>
            <button
              className={tabButtonClasses("compliance")}
              onClick={() => setActiveTab("compliance")}
            >
              Compliance
            </button>
            <button
              className={tabButtonClasses("banking")}
              onClick={() => setActiveTab("banking")}
            >
              Banking
            </button>
            <button
              className={tabButtonClasses("delivery")}
              onClick={() => setActiveTab("delivery")}
            >
              Delivery
            </button>
            <button
              className={tabButtonClasses("story")}
              onClick={() => setActiveTab("story")}
            >
              Story & Social
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: Avatar */}
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-600">Avatar</label>
            <div className="mt-2">
              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-36 h-36 rounded-full object-cover"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-stone-100 flex items-center justify-center text-xs text-stone-500 text-center px-2">
                  No image selected
                </div>
              )}
            </div>
            <input
              className="mt-3 text-sm"
              type="file"
              accept="image/*"
              onChange={handleFile}
            />
            {uploading && (
              <p className="text-sm text-gray-500 mt-2">Uploading...</p>
            )}
          </div>

          {/* RIGHT: Tabbed content */}
          <div className="md:col-span-2">
            {/* BASIC TAB */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Full name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Farmer's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Father's name
                  </label>
                  <input
                    name="fatherName"
                    value={form.fatherName}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Main category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                    required
                  >
                    <option value="">Select category</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Other categories / crops (comma separated)
                  </label>
                  <input
                    name="subCategories"
                    value={form.subCategories}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: mangoes, leafy greens, millets"
                  />
                </div>
              </div>
            )}

            {/* CONTACT TAB */}
            {activeTab === "contact" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Phone number
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Farmer's main phone"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Alternate phone
                  </label>
                  <input
                    name="alternatePhone"
                    value={form.alternatePhone}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    WhatsApp number
                  </label>
                  <input
                    name="whatsappNumber"
                    value={form.whatsappNumber}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* ADDRESS TAB */}
            {activeTab === "address" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Address line 1
                  </label>
                  <input
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Address line 2
                  </label>
                  <input
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Village</label>
                  <input
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Village / area"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Mandal</label>
                  <input
                    name="mandal"
                    value={form.mandal}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    District
                  </label>
                  <input
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">State</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Pincode
                  </label>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* FARM TAB */}
            {activeTab === "farm" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Farm name
                  </label>
                  <input
                    name="farmName"
                    value={form.farmName}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: Sri Lakshmi Organic Farm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Farm area (text)
                  </label>
                  <input
                    name="farmArea"
                    value={form.farmArea}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: 2 acres"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Total land area (acres)
                  </label>
                  <input
                    name="totalLandArea"
                    value={form.totalLandArea}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Owned land (acres)
                  </label>
                  <input
                    name="ownedLandArea"
                    value={form.ownedLandArea}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Leased land (acres)
                  </label>
                  <input
                    name="leasedLandArea"
                    value={form.leasedLandArea}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Irrigation type
                  </label>
                  <select
                    name="irrigationType"
                    value={form.irrigationType}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="rainfed">Rainfed</option>
                    <option value="borewell">Borewell</option>
                    <option value="canal">Canal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Soil type
                  </label>
                  <input
                    name="soilType"
                    value={form.soilType}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Red soil, black soil, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Water source
                  </label>
                  <input
                    name="waterSource"
                    value={form.waterSource}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Borewell, canal, tank, etc."
                  />
                </div>
                <div className="flex items-center gap-2 mt-3 md:mt-6">
                  <input
                    id="organicCertified"
                    type="checkbox"
                    name="organicCertified"
                    checked={form.organicCertified}
                    onChange={handleChange}
                  />
                  <label
                    htmlFor="organicCertified"
                    className="text-sm text-gray-600"
                  >
                    Organic certified
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Organic certification details
                  </label>
                  <input
                    name="organicCertificationDetails"
                    value={form.organicCertificationDetails}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="NPOP, PGS, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Farming experience (years)
                  </label>
                  <input
                    name="farmingExperienceYears"
                    value={form.farmingExperienceYears}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Seasonal crops (comma separated)
                  </label>
                  <input
                    name="seasonalCrops"
                    value={form.seasonalCrops}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: paddy, groundnut"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Perennial crops (comma separated)
                  </label>
                  <input
                    name="perennialCrops"
                    value={form.perennialCrops}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: mango, coconut"
                  />
                </div>
              </div>
            )}

            {/* COMPLIANCE TAB */}
            {activeTab === "compliance" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Aadhaar number
                  </label>
                  <input
                    name="aadhaarNumber"
                    value={form.aadhaarNumber}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    PAN number
                  </label>
                  <input
                    name="panNumber"
                    value={form.panNumber}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    FSSAI license
                  </label>
                  <input
                    name="fssaiLicense"
                    value={form.fssaiLicense}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    GST number
                  </label>
                  <input
                    name="gstNumber"
                    value={form.gstNumber}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* BANKING TAB */}
            {activeTab === "banking" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Account holder name
                  </label>
                  <input
                    name="bankAccountHolderName"
                    value={form.bankAccountHolderName}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Account number
                  </label>
                  <input
                    name="bankAccountNumber"
                    value={form.bankAccountNumber}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    IFSC code
                  </label>
                  <input
                    name="bankIFSC"
                    value={form.bankIFSC}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Bank name
                  </label>
                  <input
                    name="bankName"
                    value={form.bankName}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Branch
                  </label>
                  <input
                    name="bankBranch"
                    value={form.bankBranch}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    UPI ID
                  </label>
                  <input
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="eg: farmer@upi"
                  />
                </div>
              </div>
            )}

            {/* DELIVERY TAB */}
            {activeTab === "delivery" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Do you deliver directly to buyers?
                  </label>
                  <select
                    name="delivery"
                    value={form.delivery ? "yes" : "no"}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="no">No, pickup / courier only</option>
                    <option value="yes">Yes, I can deliver directly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Delivery radius (km)
                  </label>
                  <input
                    name="deliveryRadiusKm"
                    value={form.deliveryRadiusKm}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: 10"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Delivery pincodes (comma separated)
                  </label>
                  <input
                    name="deliveryPinCodes"
                    value={form.deliveryPinCodes}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: 530012, 530013"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Pickup address (for courier / collection)
                  </label>
                  <input
                    name="pickupAddress"
                    value={form.pickupAddress}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* STORY & SOCIAL TAB */}
            {activeTab === "story" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    About your farm
                  </label>
                  <textarea
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    rows={4}
                    placeholder="Tell your story, practices, mission..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Farming journey / experience
                  </label>
                  <textarea
                    name="experienceDescription"
                    value={form.experienceDescription}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="How you started, your journey so far..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Awards / recognitions (comma separated)
                  </label>
                  <input
                    name="awards"
                    value={form.awards}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Eg: Best Organic Farmer 2023"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Instagram
                  </label>
                  <input
                    name="instagram"
                    value={form.instagram}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    YouTube
                  </label>
                  <input
                    name="youtube"
                    value={form.youtube}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Facebook
                  </label>
                  <input
                    name="facebook"
                    value={form.facebook}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Website
                  </label>
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={form.id ? handleUpdate : handleCreate}
                disabled={saving || uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : form.id
                    ? "Update profile"
                    : "Create profile"}
              </button>

              <button
                onClick={resetForm}
                className="px-4 py-2 border rounded-md text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
