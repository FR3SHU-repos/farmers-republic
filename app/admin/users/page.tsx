"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

type User = {
  id: string;
  name: string;
  email: string;
  type: string;
  isActive: boolean;
  subscription: string;
  phoneNumber: string;
  createdAt: string;
};

type Meta = { total: number; page: number; limit: number; totalPages: number };

const USER_TYPES = ["", "Admin", "Farmer", "Buyer", "FPO", "Manager", "Agent", "Supplier"];

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Admin: "bg-status-danger-surface text-status-danger",
    Farmer: "bg-status-success-surface text-status-success",
    Buyer: "bg-status-info-surface text-status-info",
    FPO: "bg-secondary-subtle text-foreground-heading",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors[type] ?? "bg-secondary-subtle text-foreground-muted",
      )}
    >
      {type || "—"}
    </span>
  );
}

export default function AdminUsersPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.type !== "Admin") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      if (typeFilter) params.set("type", typeFilter);
      if (activeFilter !== "") params.set("isActive", activeFilter);

      const res = await fetch(`/api/v1/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.items);
        setMeta(json.data.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, typeFilter, activeFilter, page]);

  useEffect(() => {
    if (!userLoading && user?.type === "Admin") {
      fetchUsers();
    }
  }, [fetchUsers, user, userLoading]);

  const toggleActive = async (u: User) => {
    const toastId = toast.loading(u.isActive ? "Banning user…" : "Unbanning user…");
    try {
      const res = await fetch(`/api/v1/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((x) => (x.id === u.id ? { ...x, isActive: !x.isActive } : x)),
        );
        toast.success(u.isActive ? "User banned" : "User unbanned", { id: toastId });
      } else {
        toast.error(json.message || "Failed", { id: toastId });
      }
    } catch {
      toast.error("Failed to update user", { id: toastId });
    }
  };

  const changeRole = async (u: User, newType: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, type: newType } : x)));
        toast.success("Role updated");
      } else {
        toast.error(json.message || "Failed");
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground-heading">User Management</h1>
        <p className="text-sm text-foreground-muted mt-1">{meta.total} users total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            className={cx(INPUT_CLASS, "pl-9")}
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className={cx(INPUT_CLASS, "w-auto min-w-[140px]")}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          {USER_TYPES.map((t) => (
            <option key={t} value={t}>{t || "All Types"}</option>
          ))}
        </select>
        <select
          className={cx(INPUT_CLASS, "w-auto min-w-[140px]")}
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value as "" | "true" | "false"); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {["Name", "Email", "Type", "Status", "Subscription", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-foreground-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-foreground-muted">
                    No users found
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground-heading">
                      {u.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <TypeBadge type={u.type} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          u.isActive
                            ? "bg-status-success-surface text-status-success"
                            : "bg-status-danger-surface text-status-danger",
                        )}
                      >
                        {u.isActive ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{u.subscription}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(u)}
                          className={cx(
                            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                            u.isActive
                              ? "bg-status-danger-surface text-status-danger hover:opacity-80"
                              : "bg-status-success-surface text-status-success hover:opacity-80",
                          )}
                        >
                          {u.isActive ? "Ban" : "Unban"}
                        </button>
                        <select
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground-heading focus:outline-none focus:ring-1 focus:ring-primary/30"
                          value={u.type}
                          onChange={(e) => changeRole(u, e.target.value)}
                        >
                          {USER_TYPES.filter(Boolean).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-foreground-muted">
              Page {meta.page} of {meta.totalPages} — {meta.total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-border p-1.5 text-foreground-muted hover:bg-secondary-subtle disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border p-1.5 text-foreground-muted hover:bg-secondary-subtle disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
