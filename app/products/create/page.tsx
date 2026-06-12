// app/product/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { useRouter } from "next/navigation";
import { categoriesList } from "@/shared/data/category";
import type {
  ProductStatus,
  ProductType,
} from "@/shared/interfaces/mongodb/products/product";
import { useUser } from "@/shared/context/UserContext";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  Leaf,
  LayoutGrid,
  Search,
  Tag,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type FormState = {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  price: number | "";
  mrp: number | "";
  currency: string;
  hsnCode?: string;
  gstRate: number | "";
  gstIncludedInPrice: boolean;
  unit: string;
  unitQuantity: number | "";
  stockQty: number | "";
  inStock: boolean;
  minOrderQty: number | "";
  maxOrderQty: number | "";
  stepQty: number | "";
  allowBackorder: boolean;
  category?: string;
  subCategory?: string;
  tags?: string;
  badge?: string;
  label?: string;
  status: ProductStatus;
  isFeatured: boolean;
  sortPriority: number | "";
  healthBenefits?: string;
  swadeshiPercent: number | "";
  shelfLife?: string;
  storageInstructions?: string;
  ingredients?: string;
  originCountry?: string;
  isOrganic: boolean;
  certifications?: string;
  timeToSupply?: string;
  sourceFrom?: string;
  farmer?: string;
  farmerId?: string;
  productType: ProductType;
  weightGrams: number | "";
  lengthCm: number | "";
  widthCm: number | "";
  heightCm: number | "";
  fragile: boolean;
  perishable: boolean;
  codAvailable: boolean;
  seoTitle?: string;
  seoDescription?: string;
  searchKeywords?: string;
};

type FarmerOption = {
  id: string;
  name: string;
  farmName?: string;
  profileId?: string;
};

type TabKey =
  | "general"
  | "pricing"
  | "inventory"
  | "category"
  | "health"
  | "logistics"
  | "seo";

// ─── Constants ───────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "general", label: "General", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { key: "pricing", label: "Pricing", icon: <Tag className="h-3.5 w-3.5" /> },
  { key: "inventory", label: "Inventory", icon: <Box className="h-3.5 w-3.5" /> },
  { key: "category", label: "Category", icon: <BadgeCheck className="h-3.5 w-3.5" /> },
  { key: "health", label: "Health", icon: <Leaf className="h-3.5 w-3.5" /> },
  { key: "logistics", label: "Logistics", icon: <Truck className="h-3.5 w-3.5" /> },
  { key: "seo", label: "SEO", icon: <Search className="h-3.5 w-3.5" /> },
];

const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

const SELECT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground-heading outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer";

const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wide text-foreground-muted";

const initialForm: FormState = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  shortDescription: "",
  price: "",
  mrp: "",
  currency: "INR",
  hsnCode: "",
  gstRate: "",
  gstIncludedInPrice: true,
  unit: "",
  unitQuantity: "",
  stockQty: "",
  inStock: true,
  minOrderQty: 1,
  maxOrderQty: "",
  stepQty: 1,
  allowBackorder: false,
  category: "",
  subCategory: "",
  tags: "",
  badge: "",
  label: "",
  status: "draft",
  isFeatured: false,
  sortPriority: "",
  healthBenefits: "",
  swadeshiPercent: "",
  shelfLife: "",
  storageInstructions: "",
  ingredients: "",
  originCountry: "India",
  isOrganic: false,
  certifications: "",
  timeToSupply: "",
  sourceFrom: "",
  farmer: "",
  farmerId: "",
  productType: "physical",
  weightGrams: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  fragile: false,
  perishable: false,
  codAvailable: true,
  seoTitle: "",
  seoDescription: "",
  searchKeywords: "",
};

// ─── Helpers ─────────────────────────────────────────────────

function generateSkuFromName(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  const main = words[0].slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const last =
    words.length > 1
      ? words[words.length - 1]
          .slice(0, 3)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
      : "";
  const rand = Math.floor(100 + Math.random() * 900);
  return last ? `${main}-${last}-${rand}` : `${main}-${rand}`;
}

// ─── Toggle switch ────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cx(
            "h-5 w-9 rounded-full transition-colors",
            checked ? "bg-primary" : "bg-tertiary"
          )}
        />
        <div
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </div>
      <span className="text-sm text-foreground-body">{label}</span>
    </label>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function ProductCreatePage() {
  const router = useRouter();
  const { user } = useUser();

  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const MAX_FILES = 6;
  const MAX_SIZE = 6 * 1024 * 1024;

  useEffect(() => {
    async function loadFarmers() {
      setFarmersLoading(true);
      setFarmersError(null);
      try {
        const res = await fetch("/api/v1/farmers?page=1&limit=100&sort=name_asc");
        const json = await res.json();
        if (!res.ok || !json?.success)
          throw new Error(json?.message || "Failed to load farmers");
        const items: any[] = json.data?.items ?? [];
        setFarmers(
          items.map((f) => ({
            id: String(f.id ?? f._id ?? ""),
            name: f.name ?? "",
            farmName: f.farmName ?? "",
            profileId: f.profileId ?? "",
          }))
        );
      } catch (err: any) {
        setFarmersError(err?.message || "Failed to load farmers");
      } finally {
        setFarmersLoading(false);
      }
    }
    loadFarmers();
  }, []);

  useEffect(() => {
    if (user?.type === "Farmer" && user.id && farmers.length) {
      const myFarmer = farmers.find((f) => f.profileId === user.id);
      if (myFarmer) {
        setForm((prev) => ({ ...prev, farmerId: myFarmer.id, farmer: myFarmer.name }));
      }
    }
  }, [user, farmers]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "name") {
      setForm((prev) => {
        const next = { ...prev, name: value };
        if (!prev.sku || prev.sku.trim() === "") next.sku = generateSkuFromName(value);
        if (!prev.slug || prev.slug.trim() === "")
          next.slug = value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return next;
      });
      return;
    }
    const numericFields: (keyof FormState)[] = [
      "price", "mrp", "gstRate", "unitQuantity", "stockQty",
      "minOrderQty", "maxOrderQty", "stepQty", "swadeshiPercent",
      "weightGrams", "lengthCm", "widthCm", "heightCm", "sortPriority",
    ];
    if (numericFields.includes(name as keyof FormState)) {
      setForm((s) => ({ ...s, [name]: value === "" ? "" : Number(value) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    const arr = Array.from(fl).slice(0, MAX_FILES);
    for (const f of arr) {
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name} is too large (max 6MB)`);
        return;
      }
    }
    setFiles(arr);
    setPreviewUrls(arr.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  async function uploadFilesToSupabase(productIdForPath = "new") {
    if (!files || files.length === 0) return { urls: [], paths: [] };
    setUploading(true);
    try {
      const bucket = "product-images";
      const uploadedUrls: string[] = [];
      const uploadedPaths: string[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const safeName = `${productIdForPath}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(safeName, file, {
            cacheControl: "3600",
            upsert: false,
            metadata: {
              uploaded_at: new Date().toISOString(),
              original_name: file.name,
            },
          });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(safeName);
        uploadedUrls.push(publicData.publicUrl);
        uploadedPaths.push(safeName);
      }
      return { urls: uploadedUrls, paths: uploadedPaths };
    } catch (err: any) {
      toast.error(err?.message || "Image upload failed");
      return { urls: [], paths: [] };
    } finally {
      setUploading(false);
    }
  }

  const handleCreate = async () => {
    if (!form.name || form.price === "" || Number.isNaN(Number(form.price))) {
      toast.error("Please enter product name and valid price");
      setActiveTab("general");
      return;
    }
    let sku = form.sku;
    if (!sku || sku.trim() === "") sku = generateSkuFromName(form.name);
    let finalFarmerId: string | undefined = form.farmerId || undefined;
    let finalFarmerName: string | undefined = form.farmer || undefined;
    if (user?.type === "Farmer" && user.id) {
      const myFarmer = farmers.find((f) => f.profileId === user.id);
      if (myFarmer) {
        finalFarmerId = myFarmer.id;
        finalFarmerName = myFarmer.name;
      }
    }
    setSaving(true);
    try {
      const uploadResult = await uploadFilesToSupabase(
        form.slug || form.name.replace(/\s+/g, "-").toLowerCase() || "new-product"
      );
      const images = uploadResult.urls;
      const mainImage = images.length ? images[0] : undefined;
      const toArray = (val?: string) =>
        val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];

      const payload: any = {
        name: form.name,
        slug: form.slug || undefined,
        sku,
        image: mainImage,
        images,
        price: Number(form.price),
        mrp: form.mrp === "" ? undefined : Number(form.mrp),
        currency: form.currency || "INR",
        hsnCode: form.hsnCode || undefined,
        gstRate: form.gstRate === "" ? undefined : Number(form.gstRate),
        gstIncludedInPrice: form.gstIncludedInPrice,
        unit: form.unit || undefined,
        unitQuantity: form.unitQuantity === "" ? undefined : Number(form.unitQuantity),
        stockQty: form.stockQty === "" ? undefined : Number(form.stockQty),
        inStock: form.inStock,
        minOrderQty: form.minOrderQty === "" ? undefined : Number(form.minOrderQty),
        maxOrderQty: form.maxOrderQty === "" ? undefined : Number(form.maxOrderQty),
        stepQty: form.stepQty === "" ? undefined : Number(form.stepQty),
        allowBackorder: form.allowBackorder,
        category: form.category || undefined,
        subCategory: form.subCategory || undefined,
        tags: toArray(form.tags),
        badge: form.badge || undefined,
        label: form.label || undefined,
        status: form.status || "draft",
        isFeatured: form.isFeatured,
        sortPriority: form.sortPriority === "" ? undefined : Number(form.sortPriority),
        healthBenefits: toArray(form.healthBenefits),
        swadeshiPercent: form.swadeshiPercent === "" ? undefined : Number(form.swadeshiPercent),
        shelfLife: form.shelfLife || undefined,
        storageInstructions: form.storageInstructions || undefined,
        ingredients: toArray(form.ingredients),
        originCountry: form.originCountry || "India",
        isOrganic: form.isOrganic,
        certifications: toArray(form.certifications),
        timeToSupply: form.timeToSupply || undefined,
        sourceFrom: form.sourceFrom || undefined,
        farmer: finalFarmerName,
        farmerId: finalFarmerId,
        productType: form.productType || "physical",
        weightGrams: form.weightGrams === "" ? undefined : Number(form.weightGrams),
        dimensionsCm:
          form.lengthCm !== "" && form.widthCm !== "" && form.heightCm !== ""
            ? { length: Number(form.lengthCm), width: Number(form.widthCm), height: Number(form.heightCm) }
            : undefined,
        fragile: form.fragile,
        perishable: form.perishable,
        codAvailable: form.codAvailable,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        searchKeywords: toArray(form.searchKeywords),
      };

      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create product");
      toast.success("Product created!");
      const newId = json?.data?.id ?? json?.id ?? null;
      router.push(newId ? `/products/${String(newId)}` : "/products");
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setFiles([]);
    setPreviewUrls([]);
    setActiveTab("general");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-card text-foreground-muted transition hover:text-foreground-heading"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-heading">
              New Product
            </h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Fill in the details to list a new product
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Left: Image upload ──────────────────── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Product Images
              </p>

              {/* Drop zone */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface py-8 transition hover:border-primary hover:bg-surface/80">
                <Upload className="mb-2 h-6 w-6 text-foreground-muted" />
                <p className="text-sm font-medium text-foreground-body">
                  Click to upload
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Up to {MAX_FILES} images · 6MB each
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  className="sr-only"
                />
              </label>

              {/* Previews */}
              {previewUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previewUrls.map((u, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-surface">
                      <img
                        src={u}
                        alt={`preview-${i}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-status-danger-surface text-status-danger opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Uploading…
                </div>
              )}
            </div>

            {/* Progress indicator */}
            <div className="rounded-2xl border border-border bg-surface-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Completion
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Name & Unit", done: !!form.name && !!form.unit },
                  { label: "Price set", done: form.price !== "" },
                  { label: "Images added", done: previewUrls.length > 0 },
                  { label: "Category", done: !!form.category },
                  { label: "Description", done: !!form.description },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className={cx(
                        "h-2 w-2 rounded-full",
                        done ? "bg-status-success" : "bg-tertiary"
                      )}
                    />
                    <span
                      className={cx(
                        "text-xs",
                        done ? "text-status-success" : "text-foreground-muted"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Tabs + form ──────────────────── */}
          <div className="min-w-0">
            {/* Tab bar */}
            <div className="mb-5 flex flex-wrap gap-2">
              {TABS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cx(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                    activeTab === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-card text-foreground-body hover:bg-surface"
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Form panel */}
            <div className="rounded-2xl border border-border bg-surface-card p-6">
              {/* GENERAL */}
              {activeTab === "general" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Product name *</label>
                    <input name="name" value={form.name} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Ex: Alphonso Mango" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>SKU</label>
                    <input name="sku" value={form.sku} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Auto-generated" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Unit *</label>
                    <input name="unit" value={form.unit} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="kg, packet, dozen…" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Unit quantity</label>
                    <input name="unitQuantity" value={form.unitQuantity} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="1" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Status</label>
                    <select name="status" value={form.status} onChange={handleChange} className={SELECT_CLASS}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="out_of_stock">Out of stock</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Short description</label>
                    <input name="shortDescription" value={form.shortDescription} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Shown on product cards (1–2 lines)" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Full description</label>
                    <textarea name="description" value={form.description} onChange={handleChange}
                      className={cx(INPUT_CLASS, "resize-none")} rows={5}
                      placeholder="Story, growing method, taste, etc." />
                  </div>
                </div>
              )}

              {/* PRICING */}
              {activeTab === "pricing" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Price (₹) *</label>
                    <input name="price" value={form.price} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="200" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>MRP (₹)</label>
                    <input name="mrp" value={form.mrp} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="Optional" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Currency</label>
                    <input name="currency" value={form.currency} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="INR" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>HSN Code</label>
                    <input name="hsnCode" value={form.hsnCode} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Ex: 1006" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>GST Rate (%)</label>
                    <input name="gstRate" value={form.gstRate} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="5" />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <Toggle
                      id="gstIncludedInPrice"
                      checked={form.gstIncludedInPrice}
                      onChange={(v) => setForm((s) => ({ ...s, gstIncludedInPrice: v }))}
                      label="Price includes GST"
                    />
                  </div>
                </div>
              )}

              {/* INVENTORY */}
              {activeTab === "inventory" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Stock quantity</label>
                    <input name="stockQty" value={form.stockQty} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="100" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Min order qty</label>
                    <input name="minOrderQty" value={form.minOrderQty} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="1" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Max order qty</label>
                    <input name="maxOrderQty" value={form.maxOrderQty} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="Optional" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Step qty</label>
                    <input name="stepQty" value={form.stepQty} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="1" />
                  </div>
                  <div className="flex items-center">
                    <Toggle
                      id="inStock"
                      checked={form.inStock}
                      onChange={(v) => setForm((s) => ({ ...s, inStock: v }))}
                      label="In stock"
                    />
                  </div>
                  <div className="flex items-center">
                    <Toggle
                      id="allowBackorder"
                      checked={form.allowBackorder}
                      onChange={(v) => setForm((s) => ({ ...s, allowBackorder: v }))}
                      label="Allow backorder"
                    />
                  </div>
                </div>
              )}

              {/* CATEGORY */}
              {activeTab === "category" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Category</label>
                    <select name="category" value={form.category} onChange={handleChange} className={SELECT_CLASS}>
                      <option value="">Select category</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Sub-category</label>
                    <input name="subCategory" value={form.subCategory} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Optional" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Tags (comma separated)</label>
                    <input name="tags" value={form.tags} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Chemical Free, Tasty, Premium…" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Badge</label>
                    <input name="badge" value={form.badge} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Organic, Bestseller…" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Label</label>
                    <input name="label" value={form.label} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Festive Offer…" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Sort priority</label>
                    <input name="sortPriority" value={form.sortPriority} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="Higher = show earlier" />
                  </div>
                  <div className="flex items-center">
                    <Toggle
                      id="isFeatured"
                      checked={form.isFeatured}
                      onChange={(v) => setForm((s) => ({ ...s, isFeatured: v }))}
                      label="Featured product"
                    />
                  </div>

                  {/* Farmer selection */}
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Farmer</label>
                    {user?.type === "Admin" ? (
                      <select
                        name="farmerId"
                        value={form.farmerId || ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          const selected = farmers.find((f) => f.id === id);
                          setForm((s) => ({ ...s, farmerId: id || "", farmer: selected?.name || "" }));
                        }}
                        className={SELECT_CLASS}
                      >
                        <option value="">
                          {farmersLoading ? "Loading farmers…" : "Select farmer"}
                        </option>
                        {farmersError && <option value="" disabled>{farmersError}</option>}
                        {farmers.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}{f.farmName ? ` — ${f.farmName}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={form.farmer || user?.name || "My Profile"}
                        className={cx(INPUT_CLASS, "cursor-not-allowed opacity-70")}
                      />
                    )}
                    {farmersError && (
                      <p className="mt-1.5 text-xs text-status-danger">
                        Couldn&apos;t load farmers — product can still be saved.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* HEALTH */}
              {activeTab === "health" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Health benefits (comma separated)</label>
                    <input name="healthBenefits" value={form.healthBenefits} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Rich in Vitamin C, Good for gut health…" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Swadeshi %</label>
                    <input name="swadeshiPercent" value={form.swadeshiPercent} onChange={handleChange}
                      type="number" min={0} max={100} className={INPUT_CLASS} placeholder="100" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Shelf life</label>
                    <input name="shelfLife" value={form.shelfLife} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="10 days" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Storage instructions</label>
                    <input name="storageInstructions" value={form.storageInstructions} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Keep refrigerated" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Ingredients (comma separated)</label>
                    <input name="ingredients" value={form.ingredients} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Milk, Cocoa, Jaggery…" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Origin country</label>
                    <input name="originCountry" value={form.originCountry} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="India" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Certifications (comma separated)</label>
                    <input name="certifications" value={form.certifications} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="NPOP, PGS…" />
                  </div>
                  <div className="flex items-center">
                    <Toggle
                      id="isOrganic"
                      checked={form.isOrganic}
                      onChange={(v) => setForm((s) => ({ ...s, isOrganic: v }))}
                      label="Organic product"
                    />
                  </div>
                </div>
              )}

              {/* LOGISTICS */}
              {activeTab === "logistics" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Product type</label>
                    <select name="productType" value={form.productType} onChange={handleChange} className={SELECT_CLASS}>
                      <option value="physical">Physical</option>
                      <option value="digital">Digital</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Weight (grams)</label>
                    <input name="weightGrams" value={form.weightGrams} onChange={handleChange}
                      type="number" className={INPUT_CLASS} placeholder="1000" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Length (cm)</label>
                    <input name="lengthCm" value={form.lengthCm} onChange={handleChange}
                      type="number" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Width (cm)</label>
                    <input name="widthCm" value={form.widthCm} onChange={handleChange}
                      type="number" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Height (cm)</label>
                    <input name="heightCm" value={form.heightCm} onChange={handleChange}
                      type="number" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Time to supply</label>
                    <input name="timeToSupply" value={form.timeToSupply} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="2–4 days" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Source from (location)</label>
                    <input name="sourceFrom" value={form.sourceFrom} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="Vizag, Andhra Pradesh" />
                  </div>
                  <div className="flex items-center">
                    <Toggle id="fragile" checked={form.fragile}
                      onChange={(v) => setForm((s) => ({ ...s, fragile: v }))} label="Fragile" />
                  </div>
                  <div className="flex items-center">
                    <Toggle id="perishable" checked={form.perishable}
                      onChange={(v) => setForm((s) => ({ ...s, perishable: v }))} label="Perishable" />
                  </div>
                  <div className="flex items-center">
                    <Toggle id="codAvailable" checked={form.codAvailable}
                      onChange={(v) => setForm((s) => ({ ...s, codAvailable: v }))} label="COD available" />
                  </div>
                </div>
              )}

              {/* SEO */}
              {activeTab === "seo" && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Slug (URL)</label>
                    <input name="slug" value={form.slug} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="organic-mango-1kg" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>SEO title</label>
                    <input name="seoTitle" value={form.seoTitle} onChange={handleChange}
                      className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>SEO description</label>
                    <textarea name="seoDescription" value={form.seoDescription} onChange={handleChange}
                      className={cx(INPUT_CLASS, "resize-none")} rows={3} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Search keywords (comma separated)</label>
                    <input name="searchKeywords" value={form.searchKeywords} onChange={handleChange}
                      className={INPUT_CLASS} placeholder="mango, organic mango, vizag fruits" />
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleCreate}
                disabled={saving || uploading}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-50"
              >
                {(saving || uploading) && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                )}
                {saving ? "Creating…" : uploading ? "Uploading…" : "Create product"}
              </button>
              <button
                onClick={handleReset}
                className="rounded-full border border-border bg-surface-card px-5 py-3 text-sm font-medium text-foreground-body transition hover:bg-surface"
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
