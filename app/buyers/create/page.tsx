// app/buyers/create/page.tsx

"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";

type FormState = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  pincode: string;
  about?: string;
  profileId?: string;  // <-- added
};

export default function BuyerProfilePage() {
  const router = useRouter();
  const { user } = useUser();              // <-- get logged in user

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    about: "",
    profileId: "",                         // <-- will be set automatically
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✔ Automatically inject profile ID once user is loaded
  React.useEffect(() => {
    if (user?.id) {
      setForm((prev) => ({
        ...prev,
        profileId: user.id,                // <-- assign profileId
      }));
    }
  }, [user?.id]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e: any) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 6 * 1024 * 1024) {
      toast.error("File too large (max 6MB)");
      return;
    }
    setFile(f);
  };

  // Upload to supabase
  const uploadToSupabase = async (pid = "anon") => {
    if (!file) return null;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeName = `${pid}/${Date.now()}.${ext}`;
      const filePath = `avatars/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return { publicUrl: publicData.publicUrl, filePath };
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = async () => {
    let photoPayload: any = {};
    if (file) {
      const res = await uploadToSupabase(form.profileId || "new");
      if (!res) throw new Error("Image upload failed");
      photoPayload.avatar = res.publicUrl;
      photoPayload.photoPath = res.filePath;
    }

    return {
      profileId: form.profileId,                 // <-- included in payload
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: {
        line1: form.addressLine1,
        line2: form.addressLine2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      about: form.about,
      ...photoPayload,
    };
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = await buildPayload();

      const res = await fetch("/api/v1/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create buyer");

      toast.success("Buyer profile created");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      about: "",
      profileId: user?.id || "",            // <-- keep profileId after reset
    });
    setFile(null);
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold text-green-700 mb-4">
          Buyer Profile
        </h1>

        {/* Avatar + Form Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Avatar */}
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-600">Profile Photo</label>
            <div className="mt-2">
              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  className="w-36 h-36 rounded-full object-cover"
                />
              ) : (
                <div className="w-36 h-36 bg-stone-100 rounded-full flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="mt-3"
            />
            {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          </div>

          {/* Form */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <label className="block text-sm text-gray-600">Phone</label>
              <input
                name="phone"
                value={form.phone}
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
              <label className="block text-sm text-gray-600">Pincode</label>
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600">
                Address Line 1
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
                Address Line 2
              </label>
              <input
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600">City</label>
              <input
                name="city"
                value={form.city}
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

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600">Preferences</label>
              <textarea
                name="about"
                value={form.about}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleCreate}
            disabled={saving || uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            {saving ? "Saving..." : "Create Buyer"}
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 border rounded-md"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
