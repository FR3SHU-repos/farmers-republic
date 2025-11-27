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
  name: string;
  farmName?: string;
  farmArea?: string;
  category: string;
  place?: string;
  phone?: string;
  about?: string;
  delivery: boolean; // ✅ new field
};

export default function FarmerProfilePage() {
  const router = useRouter();
  const { user } = useUser(); // ⬅️ e.g. from Supabase / custom

  const [form, setForm] = useState<FormState>({
    name: "",
    farmName: "",
    farmArea: "",
    category: "",
    place: "",
    phone: "",
    about: "",
    delivery: false,
    profileId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const { name, value } = e.target;

    if (name === "delivery") {
      // "yes" / "no" from select
      setForm((s) => ({ ...s, delivery: value === "yes" }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
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
      profileId: form.profileId, // ✅ goes to API
      name: form.name,
      farmName: form.farmName,
      farmArea: form.farmArea,
      category: form.category,
      place: form.place,
      phone: form.phone,
      about: form.about,
      delivery: form.delivery,
      ...photoPayload,
    };
  };

  const handleCreate = async () => {
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

      toast.success("Farmer created");
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

      toast.success("Farmer updated");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold text-green-700 mb-4">
          Farmer Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avatar */}
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
                <div className="w-36 h-36 rounded-full bg-stone-100 flex items-center justify-center text-xl">
                  No image
                </div>
              )}
            </div>
            <input
              className="mt-3"
              type="file"
              accept="image/*"
              onChange={handleFile}
            />
            {uploading && (
              <p className="text-sm text-gray-500 mt-2">Uploading...</p>
            )}
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600">Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Farm name</label>
                <input
                  name="farmName"
                  value={form.farmName}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Farm area</label>
                <input
                  name="farmArea"
                  value={form.farmArea}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                  placeholder="Eg: 2 acres"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Place</label>
                <input
                  name="place"
                  value={form.place}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">
                  Category{" "}
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="">Select category</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Delivery field */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">
                  Do you deliver directly to buyers?
                </label>
                <select
                  name="delivery"
                  value={form.delivery ? "yes" : "no"}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="no">No, pickup / courier only</option>
                  <option value="yes">Yes, I can deliver directly</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">About</label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={form.id ? handleUpdate : handleCreate}
                disabled={saving || uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                {saving
                  ? "Saving..."
                  : form.id
                    ? "Update Farmer"
                    : "Create Farmer"}
              </button>

              <button
                onClick={() => {
                  setForm({
                    name: "",
                    farmName: "",
                    farmArea: "",
                    category: "",
                    place: "",
                    phone: "",
                    about: "",
                    delivery: false,
                    profileId: user?.id || "",
                  });
                  setFile(null);
                }}
                className="px-4 py-2 border rounded-md"
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
