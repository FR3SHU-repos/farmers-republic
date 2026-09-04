"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import { Search, ChevronLeft, ChevronRight, Star } from "lucide-react";
import toast from "react-hot-toast";
import { catalogueAPI } from "@/shared/lib/api/catalogue";

type ProductItem = {
  id: string;
  name: string;
  farmerId: string;
  farmerName: string;
  price: number;
  stockQty: number;
  status: string;
  category: string;
  isFeatured: boolean;
  image: string | null;
  createdAt: string;
  revision: number;
};

type Meta = { total: number; page: number; limit: number; totalPages: number };

type StatusTab = "all" | "active" | "draft" | "inactive" | "archived";

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "inactive", label: "Inactive" },
  { key: "archived", label: "Archived" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-status-success-surface text-status-success",
  draft: "bg-secondary-subtle text-foreground-muted",
  inactive: "bg-status-warning-surface text-status-warning",
  archived: "bg-status-danger-surface text-status-danger",
  out_of_stock: "bg-status-danger-surface text-status-danger",
};

const PRODUCT_STATUSES = ["active", "inactive", "archived", "draft"];

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminProductsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.type !== "Admin") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await catalogueAPI.list({ page, limit: 20, q, status: activeTab === "all" ? undefined : activeTab });
      setProducts(result.items.map((product) => ({
        id: String(product.id ?? ""), name: product.name, farmerId: String(product.farmerId ?? ""),
        farmerName: product.farmer ?? "", price: product.price, stockQty: product.stockQty ?? 0,
        status: product.status ?? "draft", category: product.category ?? "", isFeatured: product.isFeatured ?? false,
        image: product.image ?? null, createdAt: String(product.createdAt ?? ""), revision: product.revision ?? 1,
      })));
      setMeta(result.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, activeTab, page]);

  useEffect(() => {
    if (!userLoading && user?.type === "Admin") fetchProducts();
  }, [fetchProducts, user, userLoading]);

  const updateProduct = async (id: string, patch: { status?: string; isFeatured?: boolean }) => {
    try {
      const current = products.find((product) => product.id === id);
      if (!current) return;
      const updated = await catalogueAPI.update(id, patch, current.revision);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, revision: updated.revision ?? p.revision + 1 } : p)));
      toast.success("Product updated");
    } catch {
      toast.error("Failed to update product");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground-heading">Product Moderation</h1>
        <p className="text-sm text-foreground-muted mt-1">{meta.total} products total</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={cx(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-surface-card border border-border text-foreground-muted hover:bg-secondary-subtle",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
        <input
          className={cx(INPUT_CLASS, "pl-9")}
          placeholder="Search products…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {["Product", "Farmer", "Price", "Stock", "Status", "Featured", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-foreground-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-foreground-muted">
                    No products found
                  </td>
                </tr>
              )}
              {!loading &&
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-9 w-9 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-subtle border border-border text-xs text-foreground-muted">
                            ?
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground-heading line-clamp-1 max-w-[150px]">
                            {p.name}
                          </p>
                          {p.category && (
                            <p className="text-xs text-foreground-muted">{p.category}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{p.farmerName || "—"}</td>
                    <td className="px-4 py-3 font-medium text-foreground-heading">
                      ₹{formatCurrency(p.price)}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{p.stockQty}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          STATUS_COLORS[p.status] ?? "bg-secondary-subtle text-foreground-muted",
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateProduct(p.id, { isFeatured: !p.isFeatured })}
                        className={cx(
                          "rounded-lg p-1.5 transition-colors",
                          p.isFeatured
                            ? "text-status-warning bg-status-warning-surface"
                            : "text-foreground-muted hover:bg-secondary-subtle",
                        )}
                        title={p.isFeatured ? "Unfeature" : "Feature"}
                      >
                        <Star className="h-4 w-4" fill={p.isFeatured ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground-heading focus:outline-none focus:ring-1 focus:ring-primary/30"
                          value={p.status}
                          onChange={(e) => updateProduct(p.id, { status: e.target.value })}
                        >
                          {PRODUCT_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {p.status !== "active" && (
                          <button
                            onClick={() => updateProduct(p.id, { status: "active" })}
                            className="rounded-lg bg-status-success-surface px-2.5 py-1 text-xs font-medium text-status-success hover:opacity-80 transition-opacity"
                          >
                            Approve
                          </button>
                        )}
                        {p.status !== "archived" && (
                          <button
                            onClick={() => updateProduct(p.id, { status: "archived" })}
                            className="rounded-lg bg-status-danger-surface px-2.5 py-1 text-xs font-medium text-status-danger hover:opacity-80 transition-opacity"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-foreground-muted">
              Page {meta.page} of {meta.totalPages}
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
