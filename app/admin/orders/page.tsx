"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import { Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

type OrderItem = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  total: number;
  status: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
};

type Meta = { total: number; page: number; limit: number; totalPages: number };

type StatusTab = "all" | "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled" | "returned";

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "out_for_delivery", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returns" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-status-warning-surface text-status-warning",
  confirmed: "bg-status-info-surface text-status-info",
  out_for_delivery: "bg-status-info-surface text-status-info",
  delivered: "bg-status-success-surface text-status-success",
  cancelled: "bg-status-danger-surface text-status-danger",
  returned: "bg-status-danger-surface text-status-danger",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-status-success-surface text-status-success",
  unpaid: "bg-status-danger-surface text-status-danger",
  refund_pending: "bg-status-warning-surface text-status-warning",
  refunded: "bg-secondary-subtle text-foreground-muted",
};

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refund_initiated",
  "refunded",
];

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export default function AdminOrdersPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<any>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.type !== "Admin") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      if (activeTab !== "all") params.set("status", activeTab);

      const res = await fetch(`/api/v1/admin/orders?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.items);
        setMeta(json.data.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, activeTab, page]);

  useEffect(() => {
    if (!userLoading && user?.type === "Admin") fetchOrders();
  }, [fetchOrders, user, userLoading]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(id);
    try {
      const res = await fetch(`/api/v1/admin/orders/${id}`);
      const json = await res.json();
      if (json.success) setExpandedDetail(json.data);
    } catch {
      toast.error("Failed to load order details");
    }
  };

  const overrideStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        toast.success("Order status updated");
      } else {
        toast.error(json.message || "Failed");
      }
    } catch {
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground-heading">Order Management</h1>
        <p className="text-sm text-foreground-muted mt-1">{meta.total} orders total</p>
      </div>

      {/* Status tabs */}
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
          placeholder="Search by buyer name…"
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
                {["Order ID", "Buyer", "Items", "Total", "Status", "Payment", "Date", "Actions"].map((h) => (
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
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-foreground-muted">
                    No orders found
                  </td>
                </tr>
              )}
              {!loading &&
                orders.map((o) => (
                  <>
                    <tr
                      key={o.id}
                      className="border-b border-border hover:bg-surface transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                        #{shortId(o.id)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground-heading">{o.buyerName || "—"}</p>
                        <p className="text-xs text-foreground-muted">{o.buyerPhone || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">{o.itemCount}</td>
                      <td className="px-4 py-3 font-semibold text-foreground-heading">
                        ₹{formatCurrency(o.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            STATUS_COLORS[o.status] ?? "bg-secondary-subtle text-foreground-muted",
                          )}
                        >
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            PAYMENT_COLORS[o.paymentStatus] ?? "bg-secondary-subtle text-foreground-muted",
                          )}
                        >
                          {o.paymentStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(o.id)}
                            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted hover:bg-secondary-subtle transition-colors"
                          >
                            Details
                            <ChevronDown
                              className={cx(
                                "h-3 w-3 transition-transform",
                                expandedId === o.id && "rotate-180",
                              )}
                            />
                          </button>
                          <select
                            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground-heading focus:outline-none focus:ring-1 focus:ring-primary/30"
                            value={o.status}
                            onChange={(e) => overrideStatus(o.id, e.target.value)}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>

                    {expandedId === o.id && expandedDetail && (
                      <tr key={`${o.id}-detail`} className="border-b border-border bg-surface">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                              Order Items
                            </p>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="pb-1.5 text-left text-foreground-muted font-medium">Product</th>
                                    <th className="pb-1.5 text-right text-foreground-muted font-medium">Qty</th>
                                    <th className="pb-1.5 text-right text-foreground-muted font-medium">Price</th>
                                    <th className="pb-1.5 text-right text-foreground-muted font-medium">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(expandedDetail.items ?? []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-border last:border-0">
                                      <td className="py-1.5 text-foreground-heading">{item.name}</td>
                                      <td className="py-1.5 text-right text-foreground-muted">{item.qty}</td>
                                      <td className="py-1.5 text-right text-foreground-muted">₹{item.price}</td>
                                      <td className="py-1.5 text-right font-medium text-foreground-heading">
                                        ₹{formatCurrency(item.price * item.qty)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
