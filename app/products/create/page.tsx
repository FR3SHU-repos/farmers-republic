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

type FormState = {
  // General / basic
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;

  // Pricing
  price: number | "";
  mrp: number | "";
  currency: string;
  hsnCode?: string;
  gstRate: number | "";
  gstIncludedInPrice: boolean;

  // Unit
  unit: string;
  unitQuantity: number | "";

  // Qty / inventory
  stockQty: number | "";
  inStock: boolean;
  minOrderQty: number | "";
  maxOrderQty: number | "";
  stepQty: number | "";
  allowBackorder: boolean;

  // Category / merchandising
  category?: string;
  subCategory?: string;
  tags?: string; // comma separated
  badge?: string;
  label?: string;
  status: ProductStatus;
  isFeatured: boolean;
  sortPriority: number | "";

  // Health / quality
  healthBenefits?: string; // comma separated
  swadeshiPercent: number | "";
  shelfLife?: string;
  storageInstructions?: string;
  ingredients?: string; // comma separated
  originCountry?: string;
  isOrganic: boolean;
  certifications?: string; // comma separated
  timeToSupply?: string;

  // Farmer / source
  sourceFrom?: string;
  farmer?: string;
  farmerId?: string;

  // Logistics
  productType: ProductType;
  weightGrams: number | "";
  lengthCm: number | "";
  widthCm: number | "";
  heightCm: number | "";
  fragile: boolean;
  perishable: boolean;
  codAvailable: boolean;

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  searchKeywords?: string; // comma separated
};

type FarmerOption = {
  id: string;
  name: string;
  farmName?: string;
};

type TabKey =
  | "general"
  | "pricing"
  | "inventory"
  | "category"
  | "health"
  | "logistics"
  | "seo";

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


// Simple helper to generate a SKU from the product name
function generateSkuFromName(name: string): string {
  if (!name) return "";

  const words = name.trim().split(/\s+/);

  // First 4 letters of the first word (e.g., Banginapalli → BANG)
  const main = words[0].slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "");

  // First 3 letters of the last word (e.g., mango → MAN)
  const last =
    words.length > 1
      ? words[words.length - 1]
          .slice(0, 3)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
      : "";

  // Random 3 digits (clean, numeric)
  const rand = Math.floor(100 + Math.random() * 900); // 100-999

  if (last)
    return `${main}-${last}-${rand}`;
  
  return `${main}-${rand}`;
}



export default function ProductCreatePage() {
  const router = useRouter();
  const { user } = useUser();

  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const MAX_FILES = 6;
  const MAX_SIZE = 6 * 1024 * 1024; // 6MB

  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("general");

  // Fetch farmers
  useEffect(() => {
    async function loadFarmers() {
      setFarmersLoading(true);
      setFarmersError(null);
      try {
        const res = await fetch(
          "/api/v1/farmers?page=1&limit=100&sort=name_asc",
        );
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load farmers");
        }

        const items: any[] = json.data?.items ?? [];
        const mapped: FarmerOption[] = items.map((f) => ({
          id: String(f.id ?? f._id ?? ""),
          name: f.name ?? "",
          farmName: f.farmName ?? "",
        }));

        setFarmers(mapped);
      } catch (err: any) {
        console.error("Load farmers error:", err);
        setFarmersError(err?.message || "Failed to load farmers");
      } finally {
        setFarmersLoading(false);
      }
    }

    loadFarmers();
  }, []);


  useEffect(() => {
  if (user?.type === "Farmer" && user?.id) {
    setForm((prev) => ({
      ...prev,
      farmerId: user.id,
      farmer: user.name || "",
    }));
  }
}, [user]);

const handleChange = (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) => {
  const { name, value } = e.target;

  // Special handling: when product name changes, auto-suggest SKU + slug if empty
  if (name === "name") {
    setForm((prev) => {
      const next = { ...prev, name: value };

      // Auto-generate SKU only if it's empty
      if (!prev.sku || prev.sku.trim() === "") {
        next.sku = generateSkuFromName(value);
      }

      // Optional: also auto-fill slug if empty
      if (!prev.slug || prev.slug.trim() === "") {
        next.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      return next;
    });
    return;
  }

  const numericFields: (keyof FormState)[] = [
    "price",
    "mrp",
    "gstRate",
    "unitQuantity",
    "stockQty",
    "minOrderQty",
    "maxOrderQty",
    "stepQty",
    "swadeshiPercent",
    "weightGrams",
    "lengthCm",
    "widthCm",
    "heightCm",
    "sortPriority",
  ];

  if (numericFields.includes(name as keyof FormState)) {
    setForm((s) => ({
      ...s,
      [name]: value === "" ? "" : Number(value),
    }));
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
        const filePath = safeName;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            metadata: {
              uploaded_at: new Date().toISOString(),
              original_name: file.name,
            },
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        uploadedUrls.push(publicData.publicUrl);
        uploadedPaths.push(filePath);
      }

      return { urls: uploadedUrls, paths: uploadedPaths };
    } catch (err: any) {
      console.error("Supabase upload error:", err);
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

      // ✅ Ensure SKU exists
  let sku = form.sku;
  if (!sku || sku.trim() === "") {
    sku = generateSkuFromName(form.name);
  }

    setSaving(true);
    try {
      // 1) upload images
      const uploadResult = await uploadFilesToSupabase(
        form.slug ||
          form.name.replace(/\s+/g, "-").toLowerCase() ||
          "new-product",
      );
      const images = uploadResult.urls;
      const mainImage = images.length ? images[0] : undefined;

      // helper to split comma strings into arrays
      const toArray = (val?: string) =>
        val
          ? val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      // 2) build payload (matches extended Product model + route)
      const payload: any = {
        // identity / basic
        name: form.name,
        slug: form.slug || undefined,
        sku: form.sku || undefined,

        // media
        image: mainImage,
        images,

        // pricing
        price: Number(form.price),
        mrp: form.mrp === "" ? undefined : Number(form.mrp),
        currency: form.currency || "INR",
        hsnCode: form.hsnCode || undefined,
        gstRate: form.gstRate === "" ? undefined : Number(form.gstRate),
        gstIncludedInPrice: form.gstIncludedInPrice,

        // unit
        unit: form.unit || undefined,
        unitQuantity:
          form.unitQuantity === "" ? undefined : Number(form.unitQuantity),

        // qty / inventory
        stockQty: form.stockQty === "" ? undefined : Number(form.stockQty),
        inStock: form.inStock,
        minOrderQty:
          form.minOrderQty === "" ? undefined : Number(form.minOrderQty),
        maxOrderQty:
          form.maxOrderQty === "" ? undefined : Number(form.maxOrderQty),
        stepQty: form.stepQty === "" ? undefined : Number(form.stepQty),
        allowBackorder: form.allowBackorder,

        // category / merchandising
        category: form.category || undefined,
        subCategory: form.subCategory || undefined,
        tags: toArray(form.tags),
        badge: form.badge || undefined,
        label: form.label || undefined,
        status: form.status || "draft",
        isFeatured: form.isFeatured,
        sortPriority:
          form.sortPriority === "" ? undefined : Number(form.sortPriority),

        // health / quality
        healthBenefits: toArray(form.healthBenefits),
        swadeshiPercent:
          form.swadeshiPercent === ""
            ? undefined
            : Number(form.swadeshiPercent),
        shelfLife: form.shelfLife || undefined,
        storageInstructions: form.storageInstructions || undefined,
        ingredients: toArray(form.ingredients),
        originCountry: form.originCountry || "India",
        isOrganic: form.isOrganic,
        certifications: toArray(form.certifications),
        timeToSupply: form.timeToSupply || undefined,

        // farmer / source
        sourceFrom: form.sourceFrom || undefined,
        farmer: form.farmer || undefined,
        farmerId: form.farmerId || undefined,

        // logistics
        productType: form.productType || "physical",
        weightGrams:
          form.weightGrams === "" ? undefined : Number(form.weightGrams),
        dimensionsCm:
          form.lengthCm !== "" &&
          form.widthCm !== "" &&
          form.heightCm !== ""
            ? {
                length: Number(form.lengthCm),
                width: Number(form.widthCm),
                height: Number(form.heightCm),
              }
            : undefined,
        fragile: form.fragile,
        perishable: form.perishable,
        codAvailable: form.codAvailable,

        // content
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,

        // SEO
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
      if (!res.ok) {
        console.error("API error", json);
        throw new Error(json?.message || "Failed to create product");
      }

      toast.success("Product created");
      const newId = json?.data?.id ?? json?.id ?? null;
      if (newId) {
        router.push(`/products/${String(newId)}`);
      } else {
        router.push("/products");
      }
    } catch (err: any) {
      console.error("Create product error:", err);
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

  const tabButtonClasses = (tab: TabKey) =>
    [
      "px-3 py-1.5 text-xs md:text-sm rounded-full border transition-all",
      activeTab === tab
        ? "bg-green-600 text-white border-green-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
    ].join(" ");

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow">
        {/* Header + Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold text-green-700">
            Create product
          </h1>

          <div className="flex flex-wrap gap-2">
            <button
              className={tabButtonClasses("general")}
              onClick={() => setActiveTab("general")}
            >
              General
            </button>
            <button
              className={tabButtonClasses("pricing")}
              onClick={() => setActiveTab("pricing")}
            >
              Pricing
            </button>
            <button
              className={tabButtonClasses("inventory")}
              onClick={() => setActiveTab("inventory")}
            >
              Qty / Inventory
            </button>
            <button
              className={tabButtonClasses("category")}
              onClick={() => setActiveTab("category")}
            >
              Category
            </button>
            <button
              className={tabButtonClasses("health")}
              onClick={() => setActiveTab("health")}
            >
              Health
            </button>
            <button
              className={tabButtonClasses("logistics")}
              onClick={() => setActiveTab("logistics")}
            >
              Logistics
            </button>
            <button
              className={tabButtonClasses("seo")}
              onClick={() => setActiveTab("seo")}
            >
              SEO
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: Images */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Images
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="w-full h-44 rounded-md bg-stone-100 overflow-hidden flex items-center justify-center">
                {previewUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 p-2 w-full">
                    {previewUrls.map((u, i) => (
                      <img
                        key={i}
                        src={u}
                        className="w-full h-20 object-cover rounded"
                        alt={`preview-${i}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-stone-500 text-sm">
                    No images selected
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="mt-2 text-sm"
              />
              <div className="text-xs text-stone-500">
                Up to {MAX_FILES} images. Max 6MB each.
              </div>
              {uploading && (
                <p className="text-sm text-gray-500 mt-2">
                  Uploading images...
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: Tabbed content */}
          <div className="md:col-span-2">
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Product name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Mango"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    SKU (internal code)
                  </label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: MNG-1KG-001"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Unit *
                  </label>
                  <input
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: kg, packet"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Unit quantity
                  </label>
                  <input
                    name="unitQuantity"
                    value={form.unitQuantity}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 1 (for 1kg)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Short description
                  </label>
                  <input
                    name="shortDescription"
                    value={form.shortDescription}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Shown on product cards"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Full description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    rows={4}
                    placeholder="Story, how it's grown, etc."
                  />
                </div>
              </div>
            )}

            {/* PRICING TAB */}
            {activeTab === "pricing" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Price (₹) *
                  </label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 200"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    MRP (₹)
                  </label>
                  <input
                    name="mrp"
                    value={form.mrp}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Currency
                  </label>
                  <input
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="INR"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    HSN Code
                  </label>
                  <input
                    name="hsnCode"
                    value={form.hsnCode}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 1006"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    GST Rate (%)
                  </label>
                  <input
                    name="gstRate"
                    value={form.gstRate}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 5"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    id="gstIncludedInPrice"
                    type="checkbox"
                    checked={form.gstIncludedInPrice}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        gstIncludedInPrice: e.target.checked,
                      }))
                    }
                  />
                  <label
                    htmlFor="gstIncludedInPrice"
                    className="text-sm text-gray-600"
                  >
                    Price includes GST
                  </label>
                </div>
              </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === "inventory" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Stock quantity
                  </label>
                  <input
                    name="stockQty"
                    value={form.stockQty}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 100"
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="inStock"
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, inStock: e.target.checked }))
                    }
                  />
                  <label htmlFor="inStock" className="text-sm text-gray-600">
                    In stock
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Min order quantity
                  </label>
                  <input
                    name="minOrderQty"
                    value={form.minOrderQty}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Default: 1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Max order quantity
                  </label>
                  <input
                    name="maxOrderQty"
                    value={form.maxOrderQty}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Step quantity
                  </label>
                  <input
                    name="stepQty"
                    value={form.stepQty}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 1"
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="allowBackorder"
                    type="checkbox"
                    checked={form.allowBackorder}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        allowBackorder: e.target.checked,
                      }))
                    }
                  />
                  <label
                    htmlFor="allowBackorder"
                    className="text-sm text-gray-600"
                  >
                    Allow backorder
                  </label>
                </div>
              </div>
            )}

            {/* CATEGORY TAB */}
            {activeTab === "category" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="">Select a category</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Sub-category
                  </label>
                  <input
                    name="subCategory"
                    value={form.subCategory}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Optional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Tags (comma separated)
                  </label>
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Chemical Free, Tasty"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Badge
                  </label>
                  <input
                    name="badge"
                    value={form.badge}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Organic, Bestseller"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Label
                  </label>
                  <input
                    name="label"
                    value={form.label}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Festive Offer"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out_of_stock">Out of stock</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="isFeatured"
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, isFeatured: e.target.checked }))
                    }
                  />
                  <label
                    htmlFor="isFeatured"
                    className="text-sm text-gray-600"
                  >
                    Featured product
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Sort priority
                  </label>
                  <input
                    name="sortPriority"
                    value={form.sortPriority}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Higher = show earlier"
                  />
                </div>

                {/* Farmer selection */}
                <div className="md:col-span-2">
                  {user?.type === "Admin" ? (
  // ---------- ADMIN VIEW: Show dropdown ----------
                  <div>
                    <label className="block text-sm text-gray-600">Farmer</label>
                    <select
                      name="farmerId"
                      value={form.farmerId || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        const selected = farmers.find((f) => f.id === id);

                        setForm((s) => ({
                          ...s,
                          farmerId: id || "",
                          farmer: selected?.name || "",
                        }));
                      }}
                      className="mt-1 w-full border rounded px-3 py-2 bg-white"
                    >
                      <option value="">
                        {farmersLoading ? "Loading farmers..." : "Select farmer"}
                      </option>

                      {farmersError && (
                        <option value="" disabled>
                          {farmersError}
                        </option>
                      )}

                      {farmers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                          {f.farmName ? ` — ${f.farmName}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  // ---------- FARMER VIEW: Auto-assign, no dropdown ----------
                  <div>
                    <label className="block text-sm text-gray-600">Farmer</label>
                    <input
                      type="text"
                      readOnly
                      value={user?.name || "My Profile"}
                      className="mt-1 w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                )}


                  {farmersError && (
                    <p className="mt-1 text-xs text-red-500">
                      Couldn’t load farmers. You can still create the product
                      without selecting one.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* HEALTH TAB */}
            {activeTab === "health" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Health benefits (comma separated)
                  </label>
                  <input
                    name="healthBenefits"
                    value={form.healthBenefits}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Good for gut health"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Swadeshi %
                  </label>
                  <input
                    name="swadeshiPercent"
                    value={form.swadeshiPercent}
                    onChange={handleChange}
                    type="number"
                    min={0}
                    max={100}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 100"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Shelf life
                  </label>
                  <input
                    name="shelfLife"
                    value={form.shelfLife}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 10 days"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Storage instructions
                  </label>
                  <input
                    name="storageInstructions"
                    value={form.storageInstructions}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Keep refrigerated"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Ingredients (comma separated)
                  </label>
                  <input
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Milk, Cocoa, Jaggery"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Origin country
                  </label>
                  <input
                    name="originCountry"
                    value={form.originCountry}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: India"
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="isOrganic"
                    type="checkbox"
                    checked={form.isOrganic}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, isOrganic: e.target.checked }))
                    }
                  />
                  <label
                    htmlFor="isOrganic"
                    className="text-sm text-gray-600"
                  >
                    Organic
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Certifications (comma separated)
                  </label>
                  <input
                    name="certifications"
                    value={form.certifications}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: NPOP, PGS"
                  />
                </div>
              </div>
            )}

            {/* LOGISTICS TAB */}
            {activeTab === "logistics" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Product type
                  </label>
                  <select
                    name="productType"
                    value={form.productType}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Weight (grams)
                  </label>
                  <input
                    name="weightGrams"
                    value={form.weightGrams}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 1000"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Length (cm)
                  </label>
                  <input
                    name="lengthCm"
                    value={form.lengthCm}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Width (cm)
                  </label>
                  <input
                    name="widthCm"
                    value={form.widthCm}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Height (cm)
                  </label>
                  <input
                    name="heightCm"
                    value={form.heightCm}
                    onChange={handleChange}
                    type="number"
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Source from (location)
                  </label>
                  <input
                    name="sourceFrom"
                    value={form.sourceFrom}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: Vizag"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Time to supply
                  </label>
                  <input
                    name="timeToSupply"
                    value={form.timeToSupply}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: 2–4 days"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    id="fragile"
                    type="checkbox"
                    checked={form.fragile}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, fragile: e.target.checked }))
                    }
                  />
                  <label htmlFor="fragile" className="text-sm text-gray-600">
                    Fragile
                  </label>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    id="perishable"
                    type="checkbox"
                    checked={form.perishable}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, perishable: e.target.checked }))
                    }
                  />
                  <label htmlFor="perishable" className="text-sm text-gray-600">
                    Perishable
                  </label>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    id="codAvailable"
                    type="checkbox"
                    checked={form.codAvailable}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, codAvailable: e.target.checked }))
                    }
                  />
                  <label
                    htmlFor="codAvailable"
                    className="text-sm text-gray-600"
                  >
                    COD available
                  </label>
                </div>
              </div>
            )}

            {/* SEO TAB */}
            {activeTab === "seo" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Slug (URL)
                  </label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: organic-mango-1kg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    SEO title
                  </label>
                  <input
                    name="seoTitle"
                    value={form.seoTitle}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    SEO description
                  </label>
                  <textarea
                    name="seoDescription"
                    value={form.seoDescription}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Search keywords (comma separated)
                  </label>
                  <input
                    name="searchKeywords"
                    value={form.searchKeywords}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Ex: mango, organic mango, vizag fruits"
                  />
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreate}
                disabled={saving || uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create product"}
              </button>

              <button
                onClick={handleReset}
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
