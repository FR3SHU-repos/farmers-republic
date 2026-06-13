"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Building2,
  CheckCircle2,
  Copy,
  Leaf,
  MapPin,
  Sprout,
  TreePine,
  Users,
  Warehouse,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";
import { useUser } from "@/shared/context/UserContext";
import type { GroupType } from "@/shared/interfaces/mongodb/community/communityGroup";

type FormState = {
  name: string;
  type: GroupType | "";
  description: string;
  location: string;
  pincode: string;
};

const TYPE_OPTIONS: Array<{ value: GroupType; label: string; icon: React.ReactNode; hint: string }> = [
  { value: "village", label: "Village", icon: <TreePine className="h-5 w-5" />, hint: "Rural community" },
  { value: "apartment", label: "Apartment", icon: <Building2 className="h-5 w-5" />, hint: "Residential complex" },
  { value: "fpo", label: "FPO", icon: <Leaf className="h-5 w-5" />, hint: "Farmer producer org" },
  { value: "workplace", label: "Workplace", icon: <Warehouse className="h-5 w-5" />, hint: "Office or factory" },
  { value: "cooperative", label: "Cooperative", icon: <Sprout className="h-5 w-5" />, hint: "Buying cooperative" },
];

const INPUT_CLS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function CreateCommunityGroupPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [form, setForm] = useState<FormState>({
    name: "",
    type: "",
    description: "",
    location: "",
    pincode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<{ code: string; groupId: string } | null>(null);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.id) return toast.error("Please log in first");
    if (!form.name.trim()) return toast.error("Group name is required");
    if (!form.type) return toast.error("Please select a group type");
    if (!form.location.trim()) return toast.error("Location is required");

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim() || undefined,
          location: form.location.trim(),
          pincode: form.pincode.trim() || undefined,
          adminUserId: user.id,
          adminName: user.name ?? user.email,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to create group");

      const { id, joinCode } = json.data;
      setSuccessCode({ code: joinCode, groupId: id });
      toast.success("Community group created!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user && !userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="rounded-2xl border border-border bg-surface-card p-8 text-center shadow-sm">
          <Users className="mx-auto mb-3 h-10 w-10 text-foreground-muted" />
          <p className="text-sm font-semibold text-foreground-heading">Sign in to create a group</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (successCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md rounded-2xl border border-status-success/30 bg-status-success-surface p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-status-success" />
          <h2 className="text-xl font-semibold text-foreground-heading">Group Created!</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Share this code with your community to let them join.
          </p>
          <div className="my-5 rounded-xl border border-border bg-surface-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
              Join Code
            </p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.25em] text-foreground-heading">
              {successCode.code}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(successCode.code).then(() =>
                  toast.success("Join code copied"),
                );
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy code
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/community/${successCode.groupId}`)}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Go to your group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="border-b border-border bg-surface-card">
        <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 text-xs font-medium text-foreground-muted hover:text-brand"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-heading">
            Create a Community Group
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Bring your community together to order fresh produce in bulk.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground-heading">
              Group Name <span className="text-status-danger">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Srinagar Colony Buyers"
              className={INPUT_CLS}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground-heading">
              Group Type <span className="text-status-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("type", opt.value)}
                  className={cx(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-semibold transition",
                    form.type === opt.value
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border-border bg-surface text-foreground-body hover:border-primary/50 hover:bg-secondary-subtle",
                  )}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                  <span
                    className={cx(
                      "text-[10px] font-normal",
                      form.type === opt.value ? "text-primary-foreground/70" : "text-foreground-muted",
                    )}
                  >
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground-heading">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Tell your community what this group is about…"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground-heading">
              Location <span className="text-status-danger">*</span>
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Village name, District  OR  Apartment name, Area"
                className={cx(INPUT_CLS, "pl-9")}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground-heading">
              Pincode
            </label>
            <input
              value={form.pincode}
              onChange={(e) => update("pincode", e.target.value)}
              placeholder="e.g. 500001"
              maxLength={6}
              className={INPUT_CLS}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? "Creating group…" : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
