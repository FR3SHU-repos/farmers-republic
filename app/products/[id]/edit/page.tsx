// app/products/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Save,
  X,
} from "lucide-react";
import type {
  ProductStatus,
  ProductType,
} from "@/shared/interfaces/mongodb/products/product";
import { cx } from "@/shared/lib/utils";
import { catalogueAPI, type CatalogueCategory } from "@/shared/lib/api/catalogue";

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
  lowStockThreshold: number | "";
  harvestDate: string;
  expiryDate: string;
  batchId: string;

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

type FarmerOption = { id: string; name: string; farmName?: string };
type TabKey = "general" | "pricing" | "inventory" | "category" | "health" | "logistics" | "seo";

const TABS: { key: TabKey; label: string }[] = [
  { key: "general",   label: "General"   },
  { key: "pricing",   label: "Pricing"   },
  { key: "inventory", label: "Inventory" },
  { key: "category",  label: "Category"  },
  { key: "health",    label: "Health"    },
  { key: "logistics", label: "Logistics" },
  { key: "seo",       label: "SEO"       },
];

const initialForm: FormState = {
  name: "", slug: "", sku: "", description: "", shortDescription: "",
  price: "", mrp: "", currency: "INR", hsnCode: "", gstRate: "", gstIncludedInPrice: true,
  unit: "", unitQuantity: "",
  stockQty: "", inStock: true, minOrderQty: 1, maxOrderQty: "", stepQty: 1,
  allowBackorder: false, lowStockThreshold: "", harvestDate: "", expiryDate: "", batchId: "",
  category: "", subCategory: "", tags: "", badge: "", label: "", status: "draft",
  isFeatured: false, sortPriority: "",
  healthBenefits: "", swadeshiPercent: "", shelfLife: "", storageInstructions: "",
  ingredients: "", originCountry: "India", isOrganic: false, certifications: "", timeToSupply: "",
  sourceFrom: "", farmer: "", farmerId: "",
  productType: "physical", weightGrams: "", lengthCm: "", widthCm: "", heightCm: "",
  fragile: false, perishable: false, codAvailable: true,
  seoTitle: "", seoDescription: "", searchKeywords: "",
};

// ─── Shared field components ──────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground-muted">{label}</label>
      {children}
    </div>
  );
}

function CheckRow({
  id, checked, onChange, label,
}: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-primary"
      />
      <span className="text-sm text-foreground-heading">{label}</span>
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = React.use(params);
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingMainImage, setExistingMainImage] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState<string>("");
  const [revision, setRevision] = useState(1);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState<string | null>(null);
  const [canonicalCategories, setCanonicalCategories] = useState<CatalogueCategory[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const MAX_FILES = 6;
  const MAX_SIZE = 6 * 1024 * 1024;

  useEffect(() => {
    catalogueAPI.categories().then(setCanonicalCategories).catch((err) => toast.error(err?.message || "Failed to load categories"));
  }, []);

  // ---------- Load farmers ----------
  useEffect(() => {
    async function loadFarmers() {
      setFarmersLoading(true);
      try {
        const res = await fetch("/api/v1/farmers?page=1&limit=100&sort=name_asc");
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load farmers");
        const items: any[] = json.data?.items ?? [];
        setFarmers(
          items.map((f) => ({
            id: String(f.id ?? f._id ?? ""),
            name: f.name ?? "",
            farmName: f.farmName ?? "",
          })),
        );
      } catch (err: any) {
        setFarmersError(err?.message || "Failed to load farmers");
      } finally {
        setFarmersLoading(false);
      }
    }
    loadFarmers();
  }, []);

  // ---------- Load product ----------
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const p = await catalogueAPI.get(productId);
		const categoryOptions = await catalogueAPI.categories();
        setProductName(p.name ?? "");
        setRevision(p.revision ?? 1);

        setForm({
          name:               p.name               ?? "",
          slug:               p.slug               ?? "",
          sku:                p.sku                ?? "",
          description:        p.description        ?? "",
          shortDescription:   p.shortDescription   ?? "",
          price:              p.price              ?? "",
          mrp:                p.mrp                ?? "",
          currency:           p.currency           ?? "INR",
          hsnCode:            p.hsnCode            ?? "",
          gstRate:            p.gstRate            ?? "",
          gstIncludedInPrice: p.gstIncludedInPrice ?? true,
          unit:               p.unit               ?? "",
          unitQuantity:       p.unitQuantity        ?? "",
          stockQty:           p.stockQty           ?? "",
          inStock:            p.inStock            ?? true,
          minOrderQty:        p.minOrderQty        ?? 1,
          maxOrderQty:        p.maxOrderQty        ?? "",
          stepQty:            p.stepQty            ?? 1,
          allowBackorder:     p.allowBackorder     ?? false,
          lowStockThreshold:  p.lowStockThreshold  ?? "",
          harvestDate: p.harvestDate
            ? new Date(p.harvestDate).toISOString().split("T")[0]
            : "",
          expiryDate: p.expiryDate
            ? new Date(p.expiryDate).toISOString().split("T")[0]
            : "",
          batchId:            p.batchId            ?? "",
          category:           p.categoryId ?? categoryOptions.find((c) => c.name.toLowerCase() === (p.category ?? "").toLowerCase())?.id ?? "",
          subCategory:        p.subCategory        ?? "",
          tags:               (p.tags ?? []).join(", "),
          badge:              p.badge              ?? "",
          label:              p.label              ?? "",
          status:             (p.status as ProductStatus) ?? "draft",
          isFeatured:         p.isFeatured         ?? false,
          sortPriority:       p.sortPriority       ?? "",
          healthBenefits:     (p.healthBenefits ?? []).join(", "),
          swadeshiPercent:    p.swadeshiPercent    ?? "",
          shelfLife:          p.shelfLife          ?? "",
          storageInstructions: p.storageInstructions ?? "",
          ingredients:        (p.ingredients ?? []).join(", "),
          originCountry:      p.originCountry      ?? "India",
          isOrganic:          p.isOrganic          ?? false,
          certifications:     (p.certifications ?? []).join(", "),
          timeToSupply:       p.timeToSupply       ?? "",
          sourceFrom:         p.sourceFrom         ?? "",
          farmer:             p.farmer             ?? "",
          farmerId:           p.farmerId ? String(p.farmerId) : "",
          productType:        (p.productType as ProductType) ?? "physical",
          weightGrams:        p.weightGrams        ?? "",
          lengthCm:           p.dimensionsCm?.length ?? "",
          widthCm:            p.dimensionsCm?.width  ?? "",
          heightCm:           p.dimensionsCm?.height ?? "",
          fragile:            p.fragile            ?? false,
          perishable:         p.perishable         ?? false,
          codAvailable:       p.codAvailable       ?? true,
          seoTitle:           p.seoTitle           ?? "",
          seoDescription:     p.seoDescription     ?? "",
          searchKeywords:     (p.searchKeywords ?? []).join(", "),
        });

        const imgs: string[] = p.images ?? [];
        setExistingImages(imgs);
        setExistingMainImage(p.image);
        setPreviewUrls(imgs.length ? imgs : p.image ? [p.image] : []);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    if (productId) loadProduct();
  }, [productId]);

  // ---------- Handlers ----------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const numericFields: (keyof FormState)[] = [
      "price", "mrp", "gstRate", "unitQuantity", "stockQty", "minOrderQty",
      "maxOrderQty", "stepQty", "lowStockThreshold", "swadeshiPercent",
      "weightGrams", "lengthCm", "widthCm", "heightCm", "sortPriority",
    ];
    setForm((s) => ({
      ...s,
      [name]: numericFields.includes(name as keyof FormState)
        ? value === "" ? "" : Number(value)
        : value,
    }));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    const arr = Array.from(fl).slice(0, MAX_FILES);
    for (const f of arr) {
      if (f.size > MAX_SIZE) { toast.error(`${f.name} is too large (max 6 MB)`); return; }
    }
    setFiles(arr);
    setPreviewUrls([...existingImages, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  async function uploadFilesToSupabase(pathPrefix = productId) {
    if (!files.length) return { urls: [] };
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const filePath = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
      return { urls: uploadedUrls };
    } catch (err: any) {
      toast.error(err?.message || "Image upload failed");
      return { urls: [] };
    } finally {
      setUploading(false);
    }
  }

  const handleUpdate = async () => {
    if (!form.name || form.price === "" || Number.isNaN(Number(form.price))) {
      toast.error("Please enter a product name and valid price");
      setActiveTab("general");
      return;
    }
    setSaving(true);
    try {
      const { urls: newImages } = await uploadFilesToSupabase(
        form.slug || form.name.replace(/\s+/g, "-").toLowerCase() || productId,
      );
      const allImages = [...existingImages, ...newImages];
      const mainImage = allImages[0] ?? existingMainImage;

      const toArray = (v?: string) =>
        v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

      const payload: any = {
        name: form.name, slug: form.slug || undefined, sku: form.sku || undefined,
        image: mainImage, images: allImages,
        price: Number(form.price),
        mrp: form.mrp === "" ? undefined : Number(form.mrp),
        currency: form.currency || "INR",
        hsnCode: form.hsnCode || undefined,
        gstRate: form.gstRate === "" ? undefined : Number(form.gstRate),
        gstIncludedInPrice: form.gstIncludedInPrice,
        unit: form.unit || undefined,
        unitQuantity: form.unitQuantity === "" ? undefined : Number(form.unitQuantity),
        minOrderQty: form.minOrderQty === "" ? undefined : Number(form.minOrderQty),
        maxOrderQty: form.maxOrderQty === "" ? undefined : Number(form.maxOrderQty),
        stepQty: form.stepQty === "" ? undefined : Number(form.stepQty),
        allowBackorder: form.allowBackorder,
        categoryId: form.category || undefined, subCategory: form.subCategory || undefined,
        tags: toArray(form.tags), badge: form.badge || undefined, label: form.label || undefined,
        status: form.status || "draft", isFeatured: form.isFeatured,
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
        farmer: form.farmer || undefined, farmerId: form.farmerId || undefined,
        productType: form.productType || "physical",
        weightGrams: form.weightGrams === "" ? undefined : Number(form.weightGrams),
        dimensionsCm:
          form.lengthCm !== "" && form.widthCm !== "" && form.heightCm !== ""
            ? { length: Number(form.lengthCm), width: Number(form.widthCm), height: Number(form.heightCm) }
            : undefined,
        fragile: form.fragile, perishable: form.perishable, codAvailable: form.codAvailable,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        seoTitle: form.seoTitle || undefined, seoDescription: form.seoDescription || undefined,
        searchKeywords: toArray(form.searchKeywords),
      };

      const updated = await catalogueAPI.update(productId, payload, revision);
      setRevision(updated.revision ?? revision + 1);

      toast.success("Product saved");
      router.push(`/products/${productId}`);
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-xl bg-border" />
          <div className="h-32 animate-pulse rounded-2xl bg-border" />
          <div className="h-64 animate-pulse rounded-2xl bg-border" />
        </div>
      </div>
    );
  }

  const selectCls = cx(inputCls, "bg-surface");

  return (
    <div className="min-h-screen bg-surface pb-32">
      <div className="mx-auto max-w-3xl px-4 py-8">

        {/* Back link */}
        <Link
          href={`/products/${productId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground-heading transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to product
        </Link>

        {/* Page header */}
        <div className="mb-6 rounded-2xl border border-border bg-surface-card px-6 py-5">
          <h1 className="text-xl font-bold text-foreground-heading">Edit product</h1>
          {productName && (
            <p className="mt-1 text-sm font-medium text-foreground-muted">{productName}</p>
          )}
          <p className="mt-0.5 font-mono text-[11px] text-foreground-muted/50">ID: {productId}</p>
        </div>

        {/* Image upload card */}
        <div className="mb-6 rounded-2xl border border-border bg-surface-card px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Product images
          </p>
          {previewUrls.length > 0 ? (
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {previewUrls.map((u, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <img src={u} alt={`img-${i}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-border bg-surface">
              <div className="flex flex-col items-center gap-1 text-foreground-muted">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">No images yet</span>
              </div>
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-heading hover:bg-secondary-subtle transition-colors">
            <ImagePlus className="h-4 w-4" />
            Add / replace images
            <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          </label>
          <span className="ml-3 text-xs text-foreground-muted">
            Up to {MAX_FILES} images · max 6 MB each
          </span>
          {uploading && (
            <p className="mt-2 text-xs text-foreground-muted">Uploading…</p>
          )}
        </div>

        {/* Tab pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cx(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all",
                activeTab === key
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-surface-card text-foreground-muted hover:bg-secondary-subtle",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content card */}
        <div className="rounded-2xl border border-border bg-surface-card px-6 py-6">

          {/* ── GENERAL ── */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Product name *">
                <input name="name" value={form.name} onChange={handleChange}
                  className={inputCls} placeholder="Ex: Organic Mango" />
              </Field>
              <Field label="SKU (internal code)">
                <input name="sku" value={form.sku} onChange={handleChange}
                  className={inputCls} placeholder="Ex: MNG-1KG-001" />
              </Field>
              <Field label="Unit *">
                <input name="unit" value={form.unit} onChange={handleChange}
                  className={inputCls} placeholder="Ex: kg, packet" />
              </Field>
              <Field label="Unit quantity">
                <input name="unitQuantity" value={form.unitQuantity} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Ex: 1" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Short description">
                  <input name="shortDescription" value={form.shortDescription} onChange={handleChange}
                    className={inputCls} placeholder="Shown on product cards" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Full description">
                  <textarea name="description" value={form.description} onChange={handleChange}
                    className={inputCls} rows={4} placeholder="Story, how it's grown, etc." />
                </Field>
              </div>
            </div>
          )}

          {/* ── PRICING ── */}
          {activeTab === "pricing" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Price (₹) *">
                <input name="price" value={form.price} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Ex: 200" />
              </Field>
              <Field label="MRP (₹)">
                <input name="mrp" value={form.mrp} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Optional" />
              </Field>
              <Field label="Currency">
                <input name="currency" value={form.currency} onChange={handleChange}
                  className={inputCls} placeholder="INR" />
              </Field>
              <Field label="HSN Code">
                <input name="hsnCode" value={form.hsnCode} onChange={handleChange}
                  className={inputCls} placeholder="Ex: 1006" />
              </Field>
              <Field label="GST Rate (%)">
                <input name="gstRate" value={form.gstRate} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Ex: 5" />
              </Field>
              <div className="flex items-end pb-1">
                <CheckRow
                  id="gstIncludedInPrice"
                  checked={form.gstIncludedInPrice}
                  onChange={(v) => setForm((s) => ({ ...s, gstIncludedInPrice: v }))}
                  label="Price includes GST"
                />
              </div>
            </div>
          )}

          {/* ── INVENTORY ── */}
          {activeTab === "inventory" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Stock quantity">
                <input name="stockQty" value={form.stockQty} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Ex: 100" />
              </Field>
              <div className="flex items-end pb-1">
                <CheckRow id="inStock" checked={form.inStock}
                  onChange={(v) => setForm((s) => ({ ...s, inStock: v }))}
                  label="In stock" />
              </div>
              <Field label="Min order quantity">
                <input name="minOrderQty" value={form.minOrderQty} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Default: 1" />
              </Field>
              <Field label="Max order quantity">
                <input name="maxOrderQty" value={form.maxOrderQty} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Optional" />
              </Field>
              <Field label="Step quantity">
                <input name="stepQty" value={form.stepQty} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Ex: 1" />
              </Field>
              <div className="flex items-end pb-1">
                <CheckRow id="allowBackorder" checked={form.allowBackorder}
                  onChange={(v) => setForm((s) => ({ ...s, allowBackorder: v }))}
                  label="Allow backorder" />
              </div>

              {/* Freshness & low-stock section */}
              <div className="sm:col-span-2 mt-2 border-t border-border pt-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Freshness &amp; stock alerts
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Low stock alert threshold">
                    <input name="lowStockThreshold" value={form.lowStockThreshold}
                      onChange={handleChange} type="number" min={0}
                      className={inputCls} placeholder="Ex: 10 — warn when ≤ this" />
                  </Field>
                  <Field label="Batch ID">
                    <input name="batchId" value={form.batchId} onChange={handleChange}
                      className={inputCls} placeholder="Ex: BATCH-2024-JUN-01" />
                  </Field>
                  <Field label="Harvest date">
                    <input name="harvestDate" value={form.harvestDate} onChange={handleChange}
                      type="date" className={inputCls} />
                  </Field>
                  <Field label="Expiry / best-before date">
                    <input name="expiryDate" value={form.expiryDate} onChange={handleChange}
                      type="date" className={inputCls} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── CATEGORY ── */}
          {activeTab === "category" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select name="category" value={form.category} onChange={handleChange}
                  className={selectCls}>
                  <option value="">Select a category</option>
                  {canonicalCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sub-category">
                <input name="subCategory" value={form.subCategory} onChange={handleChange}
                  className={inputCls} placeholder="Optional" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Tags (comma separated)">
                  <input name="tags" value={form.tags} onChange={handleChange}
                    className={inputCls} placeholder="Ex: Chemical Free, Tasty" />
                </Field>
              </div>
              <Field label="Badge">
                <input name="badge" value={form.badge} onChange={handleChange}
                  className={inputCls} placeholder="Ex: Organic, Bestseller" />
              </Field>
              <Field label="Label">
                <input name="label" value={form.label} onChange={handleChange}
                  className={inputCls} placeholder="Ex: Festive Offer" />
              </Field>
              <Field label="Status">
                <select name="status" value={form.status} onChange={handleChange}
                  className={selectCls}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="out_of_stock">Out of stock</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field label="Sort priority">
                <input name="sortPriority" value={form.sortPriority} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Higher = show earlier" />
              </Field>
              <div className="flex items-end pb-1">
                <CheckRow id="isFeatured" checked={form.isFeatured}
                  onChange={(v) => setForm((s) => ({ ...s, isFeatured: v }))}
                  label="Featured product" />
              </div>
              <div className="sm:col-span-2">
                <Field label="Farmer">
                  <select
                    name="farmerId"
                    value={form.farmerId || ""}
                    onChange={(e) => {
                      const fid = e.target.value;
                      const selected = farmers.find((f) => f.id === fid);
                      setForm((s) => ({ ...s, farmerId: fid || "", farmer: selected?.name || "" }));
                    }}
                    className={selectCls}
                  >
                    <option value="">
                      {farmersLoading ? "Loading farmers…" : "Select a farmer (optional)"}
                    </option>
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}{f.farmName ? ` — ${f.farmName}` : ""}
                      </option>
                    ))}
                  </select>
                  {farmersError && (
                    <p className="mt-1 text-xs text-status-danger">
                      Couldn't load farmers — you can still save without selecting one.
                    </p>
                  )}
                </Field>
              </div>
            </div>
          )}

          {/* ── HEALTH ── */}
          {activeTab === "health" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Health benefits (comma separated)">
                  <input name="healthBenefits" value={form.healthBenefits} onChange={handleChange}
                    className={inputCls} placeholder="Ex: Good for gut health" />
                </Field>
              </div>
              <Field label="Swadeshi %">
                <input name="swadeshiPercent" value={form.swadeshiPercent} onChange={handleChange}
                  type="number" min={0} max={100} className={inputCls} placeholder="Ex: 100" />
              </Field>
              <Field label="Shelf life">
                <input name="shelfLife" value={form.shelfLife} onChange={handleChange}
                  className={inputCls} placeholder="Ex: 10 days" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Storage instructions">
                  <input name="storageInstructions" value={form.storageInstructions}
                    onChange={handleChange} className={inputCls} placeholder="Ex: Keep refrigerated" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Ingredients (comma separated)">
                  <input name="ingredients" value={form.ingredients} onChange={handleChange}
                    className={inputCls} placeholder="Ex: Milk, Cocoa, Jaggery" />
                </Field>
              </div>
              <Field label="Origin country">
                <input name="originCountry" value={form.originCountry} onChange={handleChange}
                  className={inputCls} placeholder="Ex: India" />
              </Field>
              <div className="flex items-end pb-1">
                <CheckRow id="isOrganic" checked={form.isOrganic}
                  onChange={(v) => setForm((s) => ({ ...s, isOrganic: v }))}
                  label="Organic" />
              </div>
              <div className="sm:col-span-2">
                <Field label="Certifications (comma separated)">
                  <input name="certifications" value={form.certifications} onChange={handleChange}
                    className={inputCls} placeholder="Ex: NPOP, PGS" />
                </Field>
              </div>
            </div>
          )}

          {/* ── LOGISTICS ── */}
          {activeTab === "logistics" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Product type">
                <select name="productType" value={form.productType} onChange={handleChange}
                  className={selectCls}>
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                  <option value="service">Service</option>
                </select>
              </Field>
              <Field label="Weight (grams)">
                <input name="weightGrams" value={form.weightGrams} onChange={handleChange}
                  type="number" className={inputCls} placeholder="Ex: 1000" />
              </Field>
              <Field label="Length (cm)">
                <input name="lengthCm" value={form.lengthCm} onChange={handleChange}
                  type="number" className={inputCls} />
              </Field>
              <Field label="Width (cm)">
                <input name="widthCm" value={form.widthCm} onChange={handleChange}
                  type="number" className={inputCls} />
              </Field>
              <Field label="Height (cm)">
                <input name="heightCm" value={form.heightCm} onChange={handleChange}
                  type="number" className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Source from (location)">
                  <input name="sourceFrom" value={form.sourceFrom} onChange={handleChange}
                    className={inputCls} placeholder="Ex: Vizag" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Time to supply">
                  <input name="timeToSupply" value={form.timeToSupply} onChange={handleChange}
                    className={inputCls} placeholder="Ex: 2–4 days" />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
                <CheckRow id="fragile" checked={form.fragile}
                  onChange={(v) => setForm((s) => ({ ...s, fragile: v }))} label="Fragile" />
                <CheckRow id="perishable" checked={form.perishable}
                  onChange={(v) => setForm((s) => ({ ...s, perishable: v }))} label="Perishable" />
                <CheckRow id="codAvailable" checked={form.codAvailable}
                  onChange={(v) => setForm((s) => ({ ...s, codAvailable: v }))} label="COD available" />
              </div>
            </div>
          )}

          {/* ── SEO ── */}
          {activeTab === "seo" && (
            <div className="grid grid-cols-1 gap-4">
              <Field label="Slug (URL)">
                <input name="slug" value={form.slug} onChange={handleChange}
                  className={inputCls} placeholder="Ex: organic-mango-1kg" />
              </Field>
              <Field label="SEO title">
                <input name="seoTitle" value={form.seoTitle} onChange={handleChange}
                  className={inputCls} />
              </Field>
              <Field label="SEO description">
                <textarea name="seoDescription" value={form.seoDescription} onChange={handleChange}
                  className={inputCls} rows={3} />
              </Field>
              <Field label="Search keywords (comma separated)">
                <input name="searchKeywords" value={form.searchKeywords} onChange={handleChange}
                  className={inputCls} placeholder="Ex: mango, organic mango, vizag fruits" />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-card/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href={`/products/${productId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground-muted hover:bg-secondary-subtle transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </Link>

          <button
            onClick={handleUpdate}
            disabled={saving || uploading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : uploading ? "Uploading…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
