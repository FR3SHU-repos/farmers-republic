"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Building2,
  Copy,
  Leaf,
  MapPin,
  Plus,
  Search,
  Sprout,
  TreePine,
  Users,
  Warehouse,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

type GroupType = "village" | "apartment" | "fpo" | "workplace" | "cooperative";

type CommunityGroup = {
  id: string;
  name: string;
  type: GroupType;
  description?: string;
  location: string;
  pincode?: string;
  joinCode: string;
  adminName?: string;
  memberCount: number;
  isActive: boolean;
  createdAt?: string;
};

const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "village", label: "Village" },
  { value: "apartment", label: "Apartment" },
  { value: "fpo", label: "FPO" },
  { value: "workplace", label: "Workplace" },
  { value: "cooperative", label: "Cooperative" },
];

function typeIcon(type: GroupType) {
  switch (type) {
    case "village": return <TreePine className="h-3.5 w-3.5" />;
    case "apartment": return <Building2 className="h-3.5 w-3.5" />;
    case "fpo": return <Leaf className="h-3.5 w-3.5" />;
    case "workplace": return <Warehouse className="h-3.5 w-3.5" />;
    case "cooperative": return <Sprout className="h-3.5 w-3.5" />;
  }
}

function typeLabel(type: GroupType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function typeBadgeClass(type: GroupType) {
  switch (type) {
    case "village": return "bg-status-success-surface text-status-success border-status-success/30";
    case "apartment": return "bg-status-info-surface text-status-info border-status-info/30";
    case "fpo": return "bg-secondary-subtle text-foreground-heading border-border";
    case "workplace": return "bg-status-warning-surface text-status-warning border-status-warning/30";
    case "cooperative": return "bg-surface text-brand border-border";
  }
}

export default function CommunityPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "20" });
      if (typeFilter) params.set("type", typeFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);
      const res = await fetch(`/api/v1/community?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load");
      setGroups(json.data.items);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load community groups");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, debouncedSearch]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  function copyJoinCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.success("Join code copied"));
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      <section className="border-b border-border bg-surface-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground-heading sm:text-4xl">
                Community Buying
              </h1>
              <p className="mt-2 max-w-xl text-sm text-foreground-muted">
                Join your village or apartment group. Order together, save on delivery.
              </p>
            </div>
            <Link
              href="/community/new"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Create your own group
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                className={cx(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                  typeFilter === f.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-card text-foreground-body hover:bg-surface",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or location"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 pl-9 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-primary border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface-card px-6 py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-foreground-muted" />
            <p className="text-sm font-semibold text-foreground-heading">No community groups found</p>
            <p className="mt-1 text-xs text-foreground-muted">
              Try a different filter or{" "}
              <Link href="/community/new" className="text-brand underline">
                create the first one
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      typeBadgeClass(group.type),
                    )}
                  >
                    {typeIcon(group.type)}
                    {typeLabel(group.type)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyJoinCode(group.joinCode)}
                    title="Copy join code"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs font-semibold text-foreground-heading transition hover:bg-secondary-subtle"
                  >
                    {group.joinCode}
                    <Copy className="h-3.5 w-3.5 text-foreground-muted" />
                  </button>
                </div>

                <h3 className="mt-3 text-base font-semibold text-foreground-heading">
                  {group.name}
                </h3>

                {group.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">
                    {group.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {group.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/community/${group.id}`}
                    className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
                  >
                    Join Group
                  </Link>
                  <Link
                    href={`/community/${group.id}`}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-center text-xs font-semibold text-foreground-body transition hover:bg-secondary-subtle"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
