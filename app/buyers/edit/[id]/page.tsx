// app/buyers/edit/[id]/page.tsx

"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

type BuyerAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
};

type BuyerForm = {
  name: string;
  phone: string;
  email: string;
  about: string;
  address: BuyerAddress;
};

export default function EditBuyerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const buyerId = params?.id;

  const [form, setForm] = useState<BuyerForm>({
    name: "",
    phone: "",
    email: "",
    about: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!buyerId) return;

    const loadBuyer = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/buyers?id=${encodeURIComponent(buyerId)}`, {
          credentials: "include",
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          toast.error(json?.message || "Failed to load buyer profile");
          router.push("/profile");
          return;
        }

        const json = await res.json();

        if (!json?.success || !json.data?.buyer) {
          toast.error(json?.message || "Buyer profile not found");
          router.push("/profile");
          return;
        }

        const buyer = json.data.buyer;

        setForm({
          name: buyer.name || "",
          phone: buyer.phone || "",
          email: buyer.email || "",
          about: buyer.about || "",
          address: {
            line1: buyer.address?.line1 || "",
            line2: buyer.address?.line2 || "",
            city: buyer.address?.city || "",
            state: buyer.address?.state || "",
            pincode: buyer.address?.pincode || "",
          },
        });
      } catch (err) {
        console.error("Failed to fetch buyer:", err);
        toast.error("Failed to load buyer profile");
        router.push("/profile");
      } finally {
        setLoading(false);
      }
    };

    loadBuyer();
  }, [buyerId, router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.replace("address.", "") as keyof BuyerAddress;
      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!buyerId) return;

    try {
      setSaving(true);

      const res = await fetch(`/api/v1/buyers?id=${encodeURIComponent(buyerId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to update buyer");
      }

      toast.success("Buyer profile updated");
      router.push("/profile");
    } catch (err: any) {
      console.error("Update buyer error:", err);
      toast.error(err?.message || "Failed to update buyer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-600 font-medium">
            Loading buyer profile…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            Edit Buyer Profile
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Phone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Address */}
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-stone-800 mb-2">
              Address
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-700">
                  Address Line 1
                </label>
                <input
                  name="address.line1"
                  value={form.address.line1}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-stone-700">
                  Address Line 2 (optional)
                </label>
                <input
                  name="address.line2"
                  value={form.address.line2}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-stone-700">
                    City
                  </label>
                  <input
                    name="address.city"
                    value={form.address.city}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-700">
                    State
                  </label>
                  <input
                    name="address.state"
                    value={form.address.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-stone-700">
                  Pincode
                </label>
                <input
                  name="address.pincode"
                  value={form.address.pincode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-stone-700">
              About (optional)
            </label>
            <textarea
              name="about"
              value={form.about}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Tell something about yourself..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="inline-flex items-center justify-center rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Back to Profile
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
