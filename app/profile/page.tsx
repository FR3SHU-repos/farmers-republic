// app/profile/page.tsx
"use client";

import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/shared/lib/supabase/client";
import { TELUGU_LANGUAGE } from "@/shared/language/telugu";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Sprout,
  Truck,
  User,
  X,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

// ─── Constants ────────────────────────────────────────────────

const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm " +
  "text-foreground-heading placeholder:text-foreground-muted outline-none transition " +
  "focus:border-primary focus:ring-4 focus:ring-primary/10";

const LABEL_CLASS =
  "block text-xs font-semibold uppercase tracking-wide text-foreground-muted";

// ─── Quick-link tile ──────────────────────────────────────────

function QuickLink({
  href,
  icon: Icon,
  label,
  sub,
  iconBg,
  iconColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sub?: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface-card p-4 transition hover:bg-surface hover:shadow-sm"
    >
      <div
        className={cx(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
          iconBg
        )}
      >
        <Icon className={cx("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground-heading">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-foreground-muted">{sub}</p>}
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-foreground-muted" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, login, logout } = useUser();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", phoneNumber: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [buyerProfile, setBuyerProfile] = useState<{ buyerId: string } | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<{ farmerId: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    setForm({
      name: user.name || "",
      phoneNumber: user.phoneNumber || "",
      type: user.type || "",
    });

    const typeLC = user.type?.toLowerCase();

    const fetchBuyer = async () => {
      if (!user.id) return;
      setProfileLoading(true);
      try {
        const res = await fetch(
          `/api/v1/buyers?profileId=${encodeURIComponent(user.id)}`,
          { credentials: "include" }
        );
        const json = await res.json();
        setBuyerProfile(
          json?.success && json.data?.buyerId
            ? { buyerId: json.data.buyerId }
            : null
        );
      } catch {
        setBuyerProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchFarmer = async () => {
      if (!user.id) return;
      setProfileLoading(true);
      try {
        const res = await fetch(
          `/api/v1/helper/by-profile/${encodeURIComponent(user.id)}`,
          { credentials: "include" }
        );
        const json = await res.json();
        setFarmerProfile(
          json?.success && json.data?.farmerId
            ? { farmerId: json.data.farmerId }
            : null
        );
      } catch {
        setFarmerProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (typeLC === "buyer") fetchBuyer();
    else if (typeLC === "farmer") fetchFarmer();
  }, [user, router]);

  if (!user) return null;

  // ── Photo handling ──────────────────────────────────────────

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/user/update", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to update profile");

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

        const photoRes = await fetch("/api/v1/user/photo", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoUrl: publicData.publicUrl,
            photoPath: filePath,
          }),
        });
        const photoJson = await photoRes.json();
        if (!photoRes.ok || !photoJson.success)
          throw new Error(photoJson.message || "Failed to save photo");

        updatedUser = photoJson.data;
        clearFile();
      }

      login({
        id: updatedUser.id ?? String(updatedUser._id ?? ""),
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        type: updatedUser.type,
        photo: updatedUser.photo,
      });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────

  const handleLogout = async () => {
    setSaving(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
      logout();
      router.push("/");
      toast.success("Logged out");
    } catch {
      toast.error("Logout failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Role-based links ────────────────────────────────────────

  const typeLC = user.type?.toLowerCase();
  const isBuyer = typeLC === "buyer";
  const isFarmer = typeLC === "farmer";
  const isDelivery = user.type === "Logistics Provider";

  const profileId = isBuyer
    ? buyerProfile?.buyerId
    : isFarmer
    ? farmerProfile?.farmerId
    : undefined;

  const createPath = isBuyer
    ? "/buyers/create"
    : isFarmer
    ? "/farmers/create"
    : "";
  const editPath = isBuyer
    ? profileId
      ? `/buyers/edit/${profileId}`
      : ""
    : isFarmer
    ? profileId
      ? `/farmers/edit/${profileId}`
      : ""
    : "";

  const roleLinkHref = profileId ? editPath : createPath;
  const roleLinkLabel = profileLoading
    ? "Loading…"
    : profileId
    ? `Edit ${user.type} Profile`
    : `Create ${user.type} Profile`;

  // Display avatar — new preview → existing photo → initials
  const avatarSrc = preview ?? user.photo ?? null;
  const initials = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">

        {/* ── Avatar card ──────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={user.name || "Avatar"}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-subtle text-2xl font-bold text-brand">
                  {initials}
                </div>
              )}

              {/* Camera overlay button */}
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-surface-card bg-primary text-primary-foreground transition hover:bg-primary-hover">
                <Camera className="h-3.5 w-3.5" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Name / email / role */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground-heading">
                {user.name || "Your name"}
              </h1>
              <p className="mt-0.5 truncate text-sm text-foreground-muted">
                {user.email}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary-subtle px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                <Sprout className="h-3 w-3" />
                {user.type}
              </span>
            </div>
          </div>

          {/* Pending file notice */}
          {file && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-foreground-body">
                <Camera className="h-4 w-4 text-brand" />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-foreground-muted">
                  — will upload on save
                </span>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="ml-2 flex-shrink-0 text-foreground-muted transition hover:text-status-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Edit form ─────────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-border bg-surface-card p-6">
          <h2 className="mb-5 text-sm font-semibold text-foreground-heading">
            Account details
          </h2>

          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>
                Full name
                <span className="ml-1.5 font-normal normal-case text-foreground-muted">
                  ({TELUGU_LANGUAGE.name})
                </span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Your name"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Phone
                <span className="ml-1.5 font-normal normal-case text-foreground-muted">
                  ({TELUGU_LANGUAGE.phone})
                </span>
              </label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                }
                placeholder="+91 98765 43210"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Email
              </label>
              <input
                value={user.email}
                readOnly
                className={cx(INPUT_CLASS, "cursor-not-allowed opacity-60")}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Role
                <span className="ml-1.5 font-normal normal-case text-foreground-muted">
                  ({TELUGU_LANGUAGE.user_type})
                </span>
              </label>
              <input
                value={form.type}
                readOnly
                className={cx(INPUT_CLASS, "cursor-not-allowed opacity-60")}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-50"
          >
            {(saving || uploading) && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            )}
            {uploading ? "Uploading photo…" : saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* ── Quick links ───────────────────────────────── */}
        {(isBuyer || isFarmer || isDelivery) && (
          <div className="mb-5 space-y-3">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
              Quick links
            </h2>

            {isDelivery && (
              <QuickLink
                href="/delivery"
                icon={Truck}
                label="My Deliveries"
                sub="View and manage your delivery queue"
                iconBg="bg-secondary-subtle"
                iconColor="text-brand"
              />
            )}

            {isDelivery && (
              <QuickLink
                href="/delivery/earnings"
                icon={ShoppingBag}
                label="My Earnings"
                sub="Track your delivery earnings and history"
                iconBg="bg-status-success-surface"
                iconColor="text-status-success"
              />
            )}

            {isFarmer && (
              <QuickLink
                href="/farmers/dashboard"
                icon={LayoutDashboard}
                label="Farmer Dashboard"
                sub="View your farm stats and activity"
                iconBg="bg-secondary-subtle"
                iconColor="text-brand"
              />
            )}

            {isFarmer && (
              <QuickLink
                href="/farmers/orders"
                icon={Package}
                label="My Orders"
                sub="Buyer orders containing your products"
                iconBg="bg-status-info-surface"
                iconColor="text-status-info"
              />
            )}

            {isBuyer && (
              <QuickLink
                href={user.id ? `/orders/${user.id}` : "/orders"}
                icon={ShoppingBag}
                label="My Orders"
                sub="Track all your purchases"
                iconBg="bg-status-info-surface"
                iconColor="text-status-info"
              />
            )}

            {roleLinkHref && (
              <QuickLink
                href={roleLinkHref}
                icon={User}
                label={roleLinkLabel}
                sub={
                  profileId
                    ? `Update your ${user.type?.toLowerCase()} details`
                    : `Set up your ${user.type?.toLowerCase()} profile`
                }
                iconBg="bg-status-success-surface"
                iconColor="text-status-success"
              />
            )}
          </div>
        )}

        {/* ── Danger zone ───────────────────────────────── */}
        <div className="rounded-2xl border border-status-danger/20 bg-status-danger-surface p-5">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-status-danger">
            Danger zone
          </h2>
          <p className="mb-4 text-xs text-foreground-muted">
            You will be signed out and redirected to the home page.
          </p>
          <button
            onClick={handleLogout}
            disabled={saving}
            className="flex items-center gap-2 rounded-full border border-status-danger/30 bg-surface-card px-5 py-2.5 text-sm font-semibold text-status-danger transition hover:bg-status-danger hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

      </div>
    </div>
  );
}
