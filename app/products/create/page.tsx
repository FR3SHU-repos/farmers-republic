// app/product/create/page.tsx
"use client";
import React, { useState,useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { useRouter } from "next/navigation";
import { categoriesList } from "@/shared/data/category";


type FormState = {
  name: string;
  price: number | "";
  unit: string;
  category?: string;
  badge?: string;
  description?: string;
  tags?: string; // comma separated
  healthBenefits?: string; // comma separated
  shelfLife?: string;
  sourceFrom?: string;
  timeToSupply?: string;
  swadeshiPercent?: number | "";
  farmer?: string; // farmer id or name
  farmerId?: string;  // 👈 farmer id
};

type FarmerOption = {
  id: string;
  name: string;
  farmName?: string;
};

export default function ProductCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    price: "",
    unit:"",
    category: "",
    badge: "",
    description: "",
    tags: "",
    healthBenefits: "",
    shelfLife: "",
    sourceFrom: "",
    timeToSupply: "",
    swadeshiPercent: "",
    farmer: "",
    farmerId: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const MAX_FILES = 6;
  const MAX_SIZE = 6 * 1024 * 1024; // 6MB

  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState<string | null>(null);

  // 🔽 Fetch farmers once on mount
  useEffect(() => {
    async function loadFarmers() {
      setFarmersLoading(true);
      setFarmersError(null);
      try {
        const res = await fetch("/api/v1/farmers?page=1&limit=100&sort=name_asc");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: name === "price" || name === "swadeshiPercent" ? (value === "" ? "" : Number(value)) : value }));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    const arr = Array.from(fl).slice(0, MAX_FILES);
    // check sizes
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
      const bucket = "product-images"; // ensure this bucket exists in Supabase
      const uploadedUrls: string[] = [];
      const uploadedPaths: string[] = [];

      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const safeName = `${productIdForPath}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = safeName; // stored at root of bucket within folder <productIdForPath>
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          metadata: { uploaded_at: new Date().toISOString(), original_name: file.name },
        });

        if (uploadError) {
          // If file already exists try to continue (or you can choose to abort)
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
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
      return;
    }

    setSaving(true);
    try {
      // 1) upload images
      const uploadResult = await uploadFilesToSupabase(form.name.replace(/\s+/g, "-").toLowerCase() || "new");
      const images = uploadResult.urls;
      const mainImage = images.length ? images[0] : undefined;

      // 2) build payload
      const payload: any = {
        name: form.name,
        price: Number(form.price),
        unit: form.unit || undefined,
        category: form.category || undefined,
        badge: form.badge || undefined,
        description: form.description || undefined,
        tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
        healthBenefits: form.healthBenefits ? form.healthBenefits.split(",").map((s) => s.trim()).filter(Boolean) : [],
        shelfLife: form.shelfLife || undefined,
        sourceFrom: form.sourceFrom || undefined,
        timeToSupply: form.timeToSupply || undefined,
        swadeshiPercent: form.swadeshiPercent === "" ? undefined : Number(form.swadeshiPercent),
        farmer: form.farmer || undefined,
        farmerId: form.farmerId || undefined,   // 👈 id
        image: mainImage,
        images: images,
      };

      // 3) call API
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
      // redirect to product listing or product detail if API returns id
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
    setForm({
      name: "",
      price: "",
      unit:"",
      category: "",
      badge: "",
      description: "",
      tags: "",
      healthBenefits: "",
      shelfLife: "",
      sourceFrom: "",
      timeToSupply: "",
      swadeshiPercent: "",
      farmer: "",
    });
    setFiles([]);
    setPreviewUrls([]);
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold text-green-700 mb-4">Create product</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-600">Images</label>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="w-full h-44 rounded-md bg-stone-100 overflow-hidden flex items-center justify-center">
                {previewUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 p-2 w-full">
                    {previewUrls.map((u, i) => (
                      <img key={i} src={u} className="w-full h-20 object-cover rounded" alt={`preview-${i}`} />
                    ))}
                  </div>
                ) : (
                  <div className="text-stone-500">No images selected</div>
                )}
              </div>

              <input type="file" accept="image/*" multiple onChange={handleFiles} className="mt-2" />
              <div className="text-xs text-stone-500">Up to {MAX_FILES} images. Max 6MB each.</div>
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading images...</p>}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600">Product name</label>
                <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex: Mango" />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Price (₹)</label>
                <input name="price" value={form.price} onChange={handleChange} type="number" className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex:200" />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Unit</label>
                <input name="unit" value={form.unit} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex:Kgs"/>
                
              </div>

              <div>
                <label className="block text-sm text-gray-600">Category</label>
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
                <label className="block text-sm text-gray-600">Badge</label>
                <input name="badge" value={form.badge} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex: Organic" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={4} placeholder="Ex: Best of Andhra" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex: Chemical Free, Tasty" />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Health benefits (comma separated)</label>
                <input name="healthBenefits" value={form.healthBenefits} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex: Best for gut" />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Swadeshi %</label>
                <input name="swadeshiPercent" value={form.swadeshiPercent} onChange={handleChange} type="number" min={0} max={100} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex: 100%" />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Shelf life</label>
                <input name="shelfLife" value={form.shelfLife} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex: 10 days"/>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Source from</label>
                <input name="sourceFrom" value={form.sourceFrom} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex: Vizag"/>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Time to supply</label>
                <input name="timeToSupply" value={form.timeToSupply} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="Ex:10 days"/>
              </div>

              {/* 🔽 Farmer select */}
                <div className="md:col-span-2">
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
                        farmer: selected?.name || "",  // keep name for display / backward compatibility
                      }));
                    }}
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  >
                    <option value="">
                      {farmersLoading ? "Loading farmers..." : "Select a farmer"}
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

                  {farmersError && (
                    <p className="mt-1 text-xs text-red-500">
                      Couldn’t load farmers. You can still create the product without selecting
                      one.
                    </p>
                  )}
                </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handleCreate} disabled={saving || uploading} className="px-4 py-2 bg-green-600 text-white rounded-md">
                {saving ? "Saving..." : "Create product"}
              </button>

              <button onClick={handleReset} className="px-4 py-2 border rounded-md">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
