// app/farmers/edit/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { categoriesList } from "@/shared/data/category";
import { cx } from "@/shared/lib/utils";
import { ArrowLeft, Camera, User, Phone, MapPin, Leaf, ShieldCheck, CreditCard, Truck, BookOpen } from "lucide-react";

type FormState = {
  id?: string;
  profileId?: string;
  name: string;
  fatherName?: string;
  gender: "" | "male" | "female" | "other";
  dateOfBirth?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  whatsappNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;
  farmName?: string;
  farmArea?: string;
  totalLandArea?: string;
  ownedLandArea?: string;
  leasedLandArea?: string;
  irrigationType?: "" | "rainfed" | "borewell" | "canal" | "other";
  soilType?: string;
  waterSource?: string;
  organicCertified: boolean;
  organicCertificationDetails?: string;
  farmingExperienceYears?: string;
  category: string;
  subCategories?: string;
  seasonalCrops?: string;
  perennialCrops?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  fssaiLicense?: string;
  gstNumber?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  bankBranch?: string;
  upiId?: string;
  delivery: boolean;
  deliveryRadiusKm?: string;
  deliveryPinCodes?: string;
  pickupAddress?: string;
  about?: string;
  experienceDescription?: string;
  awards?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
};

type TabKey = "basic" | "contact" | "address" | "farm" | "compliance" | "banking" | "delivery" | "story";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "basic", label: "Basic", icon: <User className="h-3.5 w-3.5" /> },
  { key: "contact", label: "Contact", icon: <Phone className="h-3.5 w-3.5" /> },
  { key: "address", label: "Address", icon: <MapPin className="h-3.5 w-3.5" /> },
  { key: "farm", label: "Farm", icon: <Leaf className="h-3.5 w-3.5" /> },
  { key: "compliance", label: "Compliance", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { key: "banking", label: "Banking", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { key: "delivery", label: "Delivery", icon: <Truck className="h-3.5 w-3.5" /> },
  { key: "story", label: "Story & Social", icon: <BookOpen className="h-3.5 w-3.5" /> },
];

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition";

const selectCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading focus:outline-none focus:ring-2 focus:ring-primary/30 transition";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-foreground-muted">{label}</label>
      {children}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-card p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function EditFarmerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const farmerId = params?.id;

  const [form, setForm] = useState<FormState>({
    id: undefined, profileId: "", name: "", fatherName: "", gender: "", dateOfBirth: "",
    phone: "", alternatePhone: "", email: "", whatsappNumber: "",
    addressLine1: "", addressLine2: "", village: "", mandal: "", district: "", state: "", pincode: "",
    farmName: "", farmArea: "", totalLandArea: "", ownedLandArea: "", leasedLandArea: "",
    irrigationType: "", soilType: "", waterSource: "", organicCertified: false, organicCertificationDetails: "",
    farmingExperienceYears: "", category: "", subCategories: "", seasonalCrops: "", perennialCrops: "",
    aadhaarNumber: "", panNumber: "", fssaiLicense: "", gstNumber: "",
    bankAccountHolderName: "", bankAccountNumber: "", bankIFSC: "", bankName: "", bankBranch: "", upiId: "",
    delivery: false, deliveryRadiusKm: "", deliveryPinCodes: "", pickupAddress: "",
    about: "", experienceDescription: "", awards: "", instagram: "", youtube: "", facebook: "", website: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [existingAvatar, setExistingAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  useEffect(() => {
    if (!farmerId) return;
    const loadFarmer = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/farmers?id=${encodeURIComponent(farmerId)}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json?.success || !json.data?.farmer) {
          toast.error(json?.message || "Failed to load farmer profile");
          router.push("/profile");
          return;
        }
        const f = json.data.farmer;
        const toCSV = (val: any) => Array.isArray(val) ? val.join(", ") : (val || "");
        setForm({
          id: String(json.data.farmerId || f._id || farmerId),
          profileId: f.profileId || "",
          name: f.name || "", fatherName: f.fatherName || "",
          gender: (f.gender as any) || "", dateOfBirth: f.dateOfBirth ? String(f.dateOfBirth).slice(0, 10) : "",
          phone: f.phone || "", alternatePhone: f.alternatePhone || "", email: f.email || "", whatsappNumber: f.whatsappNumber || "",
          addressLine1: f.addressLine1 || "", addressLine2: f.addressLine2 || "",
          village: f.village || "", mandal: f.mandal || "", district: f.district || "", state: f.state || "", pincode: f.pincode || "",
          farmName: f.farmName || "", farmArea: f.farmArea || "",
          totalLandArea: f.totalLandArea ? String(f.totalLandArea) : "",
          ownedLandArea: f.ownedLandArea ? String(f.ownedLandArea) : "",
          leasedLandArea: f.leasedLandArea ? String(f.leasedLandArea) : "",
          irrigationType: (f.irrigationType as any) || "", soilType: f.soilType || "", waterSource: f.waterSource || "",
          organicCertified: !!f.organicCertified, organicCertificationDetails: f.organicCertificationDetails || "",
          farmingExperienceYears: f.farmingExperienceYears ? String(f.farmingExperienceYears) : "",
          category: f.category || "", subCategories: toCSV(f.subCategories),
          seasonalCrops: toCSV(f.seasonalCrops), perennialCrops: toCSV(f.perennialCrops),
          aadhaarNumber: f.aadhaarNumber || "", panNumber: f.panNumber || "", fssaiLicense: f.fssaiLicense || "", gstNumber: f.gstNumber || "",
          bankAccountHolderName: f.bankAccountHolderName || "", bankAccountNumber: f.bankAccountNumber || "",
          bankIFSC: f.bankIFSC || "", bankName: f.bankName || "", bankBranch: f.bankBranch || "", upiId: f.upiId || "",
          delivery: !!f.delivery, deliveryRadiusKm: f.deliveryRadiusKm ? String(f.deliveryRadiusKm) : "",
          deliveryPinCodes: toCSV(f.deliveryPinCodes), pickupAddress: f.pickupLocation?.address || "",
          about: f.about || "", experienceDescription: f.experienceDescription || "",
          awards: toCSV(f.awards), instagram: f.socialMedia?.instagram || "",
          youtube: f.socialMedia?.youtube || "", facebook: f.socialMedia?.facebook || "", website: f.socialMedia?.website || "",
        });
        setExistingAvatar(f.avatar || null);
      } catch {
        toast.error("Failed to load farmer profile");
        router.push("/profile");
      } finally {
        setLoading(false);
      }
    };
    loadFarmer();
  }, [farmerId, router]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const { name, value, type, checked } = e.target as any;
    if (name === "delivery") { setForm((s) => ({ ...s, delivery: value === "yes" })); return; }
    if (name === "organicCertified" && type === "checkbox") { setForm((s) => ({ ...s, organicCertified: checked })); return; }
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 6 * 1024 * 1024) { toast.error("File too large (max 6MB)"); return; }
    setFile(f);
  };

  const uploadToSupabase = async (keyForPath = "farmer") => {
    if (!file) return null;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `avatars/${keyForPath}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return { publicUrl: publicData.publicUrl, filePath };
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = async () => {
    let photoPayload: { avatar?: string; photoPath?: string } = {};
    if (file) {
      const res = await uploadToSupabase(form.profileId || form.id || "edit");
      if (!res) throw new Error("Image upload failed");
      photoPayload.avatar = res.publicUrl;
      photoPayload.photoPath = res.filePath;
    }
    return {
      profileId: form.profileId,
      name: form.name, fatherName: form.fatherName || undefined,
      gender: form.gender || undefined, dateOfBirth: form.dateOfBirth || undefined,
      phone: form.phone || undefined, alternatePhone: form.alternatePhone || undefined,
      email: form.email || undefined, whatsappNumber: form.whatsappNumber || undefined,
      addressLine1: form.addressLine1 || undefined, addressLine2: form.addressLine2 || undefined,
      village: form.village || undefined, mandal: form.mandal || undefined,
      district: form.district || undefined, state: form.state || undefined, pincode: form.pincode || undefined,
      farmName: form.farmName || undefined, farmArea: form.farmArea || undefined,
      totalLandArea: form.totalLandArea || undefined, ownedLandArea: form.ownedLandArea || undefined,
      leasedLandArea: form.leasedLandArea || undefined, irrigationType: form.irrigationType || undefined,
      soilType: form.soilType || undefined, waterSource: form.waterSource || undefined,
      organicCertified: form.organicCertified, organicCertificationDetails: form.organicCertificationDetails || undefined,
      farmingExperienceYears: form.farmingExperienceYears || undefined,
      category: form.category || "", subCategories: form.subCategories || undefined,
      seasonalCrops: form.seasonalCrops || undefined, perennialCrops: form.perennialCrops || undefined,
      aadhaarNumber: form.aadhaarNumber || undefined, panNumber: form.panNumber || undefined,
      fssaiLicense: form.fssaiLicense || undefined, gstNumber: form.gstNumber || undefined,
      bankAccountHolderName: form.bankAccountHolderName || undefined, bankAccountNumber: form.bankAccountNumber || undefined,
      bankIFSC: form.bankIFSC || undefined, bankName: form.bankName || undefined,
      bankBranch: form.bankBranch || undefined, upiId: form.upiId || undefined,
      delivery: form.delivery, deliveryRadiusKm: form.deliveryRadiusKm || undefined,
      deliveryPinCodes: form.deliveryPinCodes || undefined,
      pickupLocation: form.pickupAddress ? { address: form.pickupAddress } : undefined,
      about: form.about || undefined, experienceDescription: form.experienceDescription || undefined,
      awards: form.awards || undefined,
      socialMedia: { instagram: form.instagram || undefined, youtube: form.youtube || undefined, facebook: form.facebook || undefined, website: form.website || undefined },
      ...photoPayload,
    };
  };

  const handleSave = async () => {
    if (!farmerId) return;
    if (!form.name) { toast.error("Please enter your name"); setActiveTab("basic"); return; }
    setSaving(true);
    try {
      const payload = await buildPayload();
      const res = await fetch(`/api/v1/farmers?id=${encodeURIComponent(farmerId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to update farmer");
      toast.success("Farmer profile updated");
      router.push("/profile");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update farmer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="mx-auto max-w-4xl px-4 pt-8 space-y-6 pb-32">
          <div className="h-8 w-48 rounded-xl bg-border animate-pulse" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 w-24 flex-shrink-0 rounded-full bg-border animate-pulse" />
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-surface-card p-6 animate-pulse space-y-4">
            <div className="h-24 w-24 rounded-full bg-border" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-16 rounded bg-border" />
                  <div className="h-10 rounded-xl bg-border" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avatarSrc = file ? URL.createObjectURL(file) : existingAvatar;

  return (
    <div className="min-h-screen bg-surface pb-32">
      <div className="mx-auto max-w-4xl px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground-heading transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Profile
          </Link>
          <span className="text-foreground-muted">/</span>
          <h1 className="text-xl font-bold text-foreground-heading">Edit Farmer Profile</h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cx(
                "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition",
                activeTab === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-surface-card text-foreground-muted hover:border-primary hover:text-foreground-heading",
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Avatar card — shown on Basic tab */}
        {activeTab === "basic" && (
          <div className="rounded-2xl border border-border bg-surface-card p-6">
            <p className="mb-4 text-sm font-semibold text-foreground-heading">Profile Photo</p>
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="h-24 w-24 rounded-full object-cover ring-2 ring-border" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-secondary-subtle flex items-center justify-center">
                    <User className="h-10 w-10 text-foreground-muted" />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground shadow hover:opacity-90 transition"
                >
                  <Camera className="h-3.5 w-3.5" />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleFile} className="sr-only" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground-heading">{form.name || "Farmer name"}</p>
                <p className="text-xs text-foreground-muted">Tap the camera icon to change your photo</p>
                {uploading && <p className="text-xs text-brand">Uploading…</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === "basic" && (
          <SectionCard>
            <Field label="Full name *">
              <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Farmer's full name" />
            </Field>
            <Field label="Father's name">
              <input name="fatherName" value={form.fatherName} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Gender">
              <select name="gender" value={form.gender} onChange={handleChange} className={selectCls}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Main category">
              <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                <option value="">Select category</option>
                {categoriesList.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Sub-categories / crops (comma-separated)">
              <input name="subCategories" value={form.subCategories} onChange={handleChange} className={inputCls} placeholder="e.g. mangoes, leafy greens" />
            </Field>
          </SectionCard>
        )}

        {activeTab === "contact" && (
          <SectionCard>
            <Field label="Phone number">
              <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="Primary phone" />
            </Field>
            <Field label="Alternate phone">
              <input name="alternatePhone" value={form.alternatePhone} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Email">
              <input name="email" value={form.email} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="WhatsApp number">
              <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} className={inputCls} />
            </Field>
          </SectionCard>
        )}

        {activeTab === "address" && (
          <SectionCard>
            <Field label="Address line 1" full>
              <input name="addressLine1" value={form.addressLine1} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Address line 2" full>
              <input name="addressLine2" value={form.addressLine2} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Village / area">
              <input name="village" value={form.village} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Mandal">
              <input name="mandal" value={form.mandal} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="District">
              <input name="district" value={form.district} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="State">
              <input name="state" value={form.state} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Pincode">
              <input name="pincode" value={form.pincode} onChange={handleChange} className={inputCls} />
            </Field>
          </SectionCard>
        )}

        {activeTab === "farm" && (
          <SectionCard>
            <Field label="Farm name">
              <input name="farmName" value={form.farmName} onChange={handleChange} className={inputCls} placeholder="e.g. Sri Lakshmi Organic Farm" />
            </Field>
            <Field label="Farm area">
              <input name="farmArea" value={form.farmArea} onChange={handleChange} className={inputCls} placeholder="e.g. 2 acres" />
            </Field>
            <Field label="Total land area (acres)">
              <input name="totalLandArea" value={form.totalLandArea} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Owned land (acres)">
              <input name="ownedLandArea" value={form.ownedLandArea} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Leased land (acres)">
              <input name="leasedLandArea" value={form.leasedLandArea} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Irrigation type">
              <select name="irrigationType" value={form.irrigationType} onChange={handleChange} className={selectCls}>
                <option value="">Select</option>
                <option value="rainfed">Rainfed</option>
                <option value="borewell">Borewell</option>
                <option value="canal">Canal</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Soil type">
              <input name="soilType" value={form.soilType} onChange={handleChange} className={inputCls} placeholder="Red soil, black soil…" />
            </Field>
            <Field label="Water source">
              <input name="waterSource" value={form.waterSource} onChange={handleChange} className={inputCls} placeholder="Borewell, canal, tank…" />
            </Field>
            <Field label="Farming experience (years)">
              <input name="farmingExperienceYears" value={form.farmingExperienceYears} onChange={handleChange} className={inputCls} />
            </Field>
            <div className="col-span-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  id="organicCertified"
                  type="checkbox"
                  name="organicCertified"
                  checked={form.organicCertified}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm font-medium text-foreground-heading">Organic certified</span>
              </label>
            </div>
            {form.organicCertified && (
              <Field label="Certification details" full>
                <input name="organicCertificationDetails" value={form.organicCertificationDetails} onChange={handleChange} className={inputCls} placeholder="NPOP, PGS, etc." />
              </Field>
            )}
            <Field label="Seasonal crops (comma-separated)" full>
              <input name="seasonalCrops" value={form.seasonalCrops} onChange={handleChange} className={inputCls} placeholder="e.g. paddy, groundnut" />
            </Field>
            <Field label="Perennial crops (comma-separated)" full>
              <input name="perennialCrops" value={form.perennialCrops} onChange={handleChange} className={inputCls} placeholder="e.g. mango, coconut" />
            </Field>
          </SectionCard>
        )}

        {activeTab === "compliance" && (
          <SectionCard>
            <Field label="Aadhaar number">
              <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="PAN number">
              <input name="panNumber" value={form.panNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="FSSAI license">
              <input name="fssaiLicense" value={form.fssaiLicense} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="GST number">
              <input name="gstNumber" value={form.gstNumber} onChange={handleChange} className={inputCls} />
            </Field>
          </SectionCard>
        )}

        {activeTab === "banking" && (
          <SectionCard>
            <Field label="Account holder name">
              <input name="bankAccountHolderName" value={form.bankAccountHolderName} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Account number">
              <input name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="IFSC code">
              <input name="bankIFSC" value={form.bankIFSC} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Bank name">
              <input name="bankName" value={form.bankName} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Branch">
              <input name="bankBranch" value={form.bankBranch} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="UPI ID">
              <input name="upiId" value={form.upiId} onChange={handleChange} className={inputCls} placeholder="e.g. farmer@upi" />
            </Field>
          </SectionCard>
        )}

        {activeTab === "delivery" && (
          <SectionCard>
            <Field label="Do you deliver directly to buyers?" full>
              <select name="delivery" value={form.delivery ? "yes" : "no"} onChange={handleChange} className={selectCls}>
                <option value="no">No — pickup / courier only</option>
                <option value="yes">Yes — I can deliver directly</option>
              </select>
            </Field>
            <Field label="Delivery radius (km)">
              <input name="deliveryRadiusKm" value={form.deliveryRadiusKm} onChange={handleChange} className={inputCls} placeholder="e.g. 10" />
            </Field>
            <Field label="Delivery pincodes (comma-separated)" full>
              <input name="deliveryPinCodes" value={form.deliveryPinCodes} onChange={handleChange} className={inputCls} placeholder="e.g. 530012, 530013" />
            </Field>
            <Field label="Pickup address (for courier / collection)" full>
              <input name="pickupAddress" value={form.pickupAddress} onChange={handleChange} className={inputCls} />
            </Field>
          </SectionCard>
        )}

        {activeTab === "story" && (
          <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
            <Field label="About your farm">
              <textarea name="about" value={form.about} onChange={handleChange} className={cx(inputCls, "resize-none")} rows={4} placeholder="Tell your story, practices, mission…" />
            </Field>
            <Field label="Farming journey / experience">
              <textarea name="experienceDescription" value={form.experienceDescription} onChange={handleChange} className={cx(inputCls, "resize-none")} rows={3} placeholder="How you started, your journey so far…" />
            </Field>
            <Field label="Awards / recognitions (comma-separated)">
              <input name="awards" value={form.awards} onChange={handleChange} className={inputCls} placeholder="e.g. Best Organic Farmer 2023" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-border">
              <Field label="Instagram">
                <input name="instagram" value={form.instagram} onChange={handleChange} className={inputCls} placeholder="https://instagram.com/…" />
              </Field>
              <Field label="YouTube">
                <input name="youtube" value={form.youtube} onChange={handleChange} className={inputCls} placeholder="https://youtube.com/…" />
              </Field>
              <Field label="Facebook">
                <input name="facebook" value={form.facebook} onChange={handleChange} className={inputCls} placeholder="https://facebook.com/…" />
              </Field>
              <Field label="Website">
                <input name="website" value={form.website} onChange={handleChange} className={inputCls} placeholder="https://…" />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-card/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-xs text-foreground-muted hidden sm:block">
            Section: <span className="font-semibold text-foreground-heading capitalize">{TABS.find((t) => t.key === activeTab)?.label}</span>
          </p>
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground-muted hover:text-foreground-heading transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
            >
              {saving ? "Saving…" : uploading ? "Uploading…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
