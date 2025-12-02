// app/profile/page.tsx

"use client";

import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { TELUGU_LANGUAGE } from "@/shared/language/telugu";
import Link from "next/link";

export default function ProfilePage() {
  const { user, login, logout } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    type: "" as string,
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Buyer + Farmer profiles
  const [buyerProfile, setBuyerProfile] = useState<{ buyerId: string } | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<{ farmerId: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // init form
    setForm({
      name: user?.name || "",
      phoneNumber: user?.phoneNumber || "",
      type: user?.type || "",
    });

    const fetchBuyer = async () => {
      if (!user.type || user.type.toLowerCase() !== "buyer") return;
      if (!user.id) return;

      try {
        setProfileLoading(true);
        const res = await fetch(
          `/api/v1/buyers?profileId=${encodeURIComponent(user.id)}`,
          { credentials: "include" },
        );

        if (res.status === 404) {
          setBuyerProfile(null);
          return;
        }

        if (!res.ok) {
          console.error("Failed to fetch buyer profile, status:", res.status);
          setBuyerProfile(null);
          return;
        }

        const json = await res.json();
        if (json?.success && json.data?.buyerId) {
          setBuyerProfile({ buyerId: json.data.buyerId });
        } else {
          setBuyerProfile(null);
        }
      } catch (err) {
        console.error("Failed to load buyer profile", err);
        setBuyerProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchFarmer = async () => {
      if (!user.type || user.type.toLowerCase() !== "farmer") return;
      if (!user.id) return;

      try {
        setProfileLoading(true);

        // 🔥 IMPORTANT: use helper route, NOT /farmers?profileId=...
        const res = await fetch(
          `/api/v1/helper/by-profile/${encodeURIComponent(user.id)}`,
          { credentials: "include" },
        );

        if (res.status === 404) {
          setFarmerProfile(null);
          return;
        }

        if (!res.ok) {
          console.error("Failed to fetch farmer profile, status:", res.status);
          setFarmerProfile(null);
          return;
        }

        const json = await res.json();

        // From your helper route:
        // { success: true, data: { farmerId: string, farmer: {...} } }
        if (json?.success && json.data?.farmerId) {
          setFarmerProfile({ farmerId: json.data.farmerId });
        } else {
          setFarmerProfile(null);
        }
      } catch (err) {
        console.error("Failed to load farmer profile", err);
        setFarmerProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    // call based on type
    if (user.type?.toLowerCase() === "buyer") {
      fetchBuyer();
    } else if (user.type?.toLowerCase() === "farmer") {
      fetchFarmer();
    }
  }, [user, router]);

  if (!user) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      toast.error("Image must be < 5MB");
      return;
    }
    setFile(f);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/user/update", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update profile");
      }

      let updatedUser = json.data;

      if (file) {
        setUploading(true);
        const ext = file.name.split(".").pop();
        const filePath = `avatars/${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        const publicURL = publicData.publicUrl;

        const photoRes = await fetch("/api/v1/user/photo", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: publicURL, photoPath: filePath }),
        });

        const photoJson = await photoRes.json();
        if (!photoRes.ok || !photoJson.success) {
          throw new Error(photoJson.message || "Failed to save photo");
        }
        updatedUser = photoJson.data;
        setUploading(false);
      }

      const mapped = {
        id: updatedUser.id ?? updatedUser._id ?? String(updatedUser._id ?? ""),
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        type: updatedUser.type,
        photo: updatedUser.photo,
      };
      login(mapped);

      toast.success("Profile updated");
    } catch (err: any) {
      console.error("Save profile error:", err);
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      logout();
      router.push("/");
      toast.success("Logged out");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const typeSlug = user?.type?.toLowerCase();

  const isBuyer = typeSlug === "buyer";
  const isFarmer = typeSlug === "farmer";

  let profileIdForLink: string | undefined;
  let createPath = "";
  let editPath = "";

  if (isBuyer) {
    profileIdForLink = buyerProfile?.buyerId;
    createPath = "/buyers/create";
    editPath = profileIdForLink ? `/buyers/edit/${profileIdForLink}` : "";
  } else if (isFarmer) {
    profileIdForLink = farmerProfile?.farmerId;
    createPath = "/farmers/create";
    editPath = profileIdForLink ? `/farmers/edit/${profileIdForLink}` : "";
  }

  const finalHref = profileIdForLink ? editPath : createPath;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl">
        <div className="flex items-center gap-4">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
              {user.name?.charAt(0) || "U"}
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {user.name || "Your name"}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-2 flex gap-2">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="px-3 py-1 bg-stone-100 rounded-md text-sm">
                  Choose Photo
                </span>
              </label>
              <button
                onClick={() => {
                  if (file) {
                    const url = URL.createObjectURL(file);
                    window.open(url);
                  } else {
                    toast("Select a photo first");
                  }
                }}
                className="px-3 py-1 bg-stone-100 rounded-md text-sm"
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <label className="text-sm text-gray-600">
              Full name ({TELUGU_LANGUAGE.name})
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Phone ({TELUGU_LANGUAGE.phone})
            </label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              User type ({TELUGU_LANGUAGE.user_type})
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              <option value={user?.type || ""}>{user?.type || "Select"}</option>
            </select>
          </div>

          <div className="flex gap-3 mt-3">
            <button
              onClick={handleSave}
              disabled={loading || uploading}
              className="flex-1 bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

          <button
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2 rounded-md border text-sm text-red-600 disabled:opacity-60"
            >
              Logout
            </button>
          </div>

          {/* Additional data */}
          {(isBuyer || isFarmer) && (
            <div className="mt-6 w-full max-w-md">
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {user?.type}
                </h3>

                <Link
                  href={finalHref}
                  className="w-full inline-flex items-center justify-center bg-green-600 text-white py-2.5 rounded-lg font-semibold transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {profileLoading
                    ? "Loading..."
                    : profileIdForLink
                    ? "Edit Profile"
                    : "Create Profile"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
