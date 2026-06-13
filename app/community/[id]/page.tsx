"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Leaf,
  LogOut,
  MapPin,
  Package,
  Plus,
  Sprout,
  TreePine,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";
import { useUser } from "@/shared/context/UserContext";

type GroupType = "village" | "apartment" | "fpo" | "workplace" | "cooperative";
type GroupOrderStatus = "open" | "closed" | "submitted" | "delivered" | "cancelled";

type Member = { userId: string; userName: string; joinedAt: string };

type CommunityGroup = {
  id: string;
  name: string;
  type: GroupType;
  description?: string;
  location: string;
  pincode?: string;
  joinCode: string;
  adminUserId: string;
  adminName?: string;
  members: Member[];
  memberCount: number;
  isActive: boolean;
};

type GroupOrderItem = {
  productId: string;
  productName: string;
  unit: string;
  pricePerUnit: number;
  requests: Array<{ userId: string; userName: string; qty: number }>;
  totalQty: number;
};

type GroupOrder = {
  id: string;
  title: string;
  description?: string;
  items: GroupOrderItem[];
  deadline: string;
  deliveryLocation?: string;
  deliveryFee?: number;
  totalEstimated?: number;
  status: GroupOrderStatus;
  createdByName?: string;
  notes?: string;
};

type NewOrderForm = {
  title: string;
  description: string;
  deadline: string;
  deliveryLocation: string;
  deliveryFee: string;
  notes: string;
  items: Array<{ productName: string; unit: string; pricePerUnit: string; qty: string }>;
};

function typeIcon(type: GroupType) {
  switch (type) {
    case "village": return <TreePine className="h-4 w-4" />;
    case "apartment": return <Building2 className="h-4 w-4" />;
    case "fpo": return <Leaf className="h-4 w-4" />;
    case "workplace": return <Warehouse className="h-4 w-4" />;
    case "cooperative": return <Sprout className="h-4 w-4" />;
  }
}

function statusBadgeClass(status: GroupOrderStatus) {
  switch (status) {
    case "open": return "bg-status-success-surface text-status-success border-status-success/30";
    case "closed":
    case "submitted": return "bg-status-warning-surface text-status-warning border-status-warning/30";
    case "delivered": return "bg-status-info-surface text-status-info border-status-info/30";
    case "cancelled": return "bg-status-danger-surface text-status-danger border-status-danger/30";
  }
}

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const INPUT_CLS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [joiningLoading, setJoiningLoading] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState<NewOrderForm>({
    title: "",
    description: "",
    deadline: "",
    deliveryLocation: "",
    deliveryFee: "0",
    notes: "",
    items: [{ productName: "", unit: "kg", pricePerUnit: "", qty: "" }],
  });

  const fetchGroup = useCallback(async () => {
    setLoadingGroup(true);
    try {
      const res = await fetch(`/api/v1/community/${id}`);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load group");
      setGroup(json.data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load group");
    } finally {
      setLoadingGroup(false);
    }
  }, [id]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/v1/community/${id}/orders`);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load orders");
      setOrders(json.data.items);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load group orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
    fetchOrders();
  }, [fetchGroup, fetchOrders]);

  const isMember = group?.members.some((m) => m.userId === user?.id) ?? false;

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return toast.error("Please log in to join");
    setJoiningLoading(true);
    try {
      const res = await fetch(`/api/v1/community/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase(), userId: user.id, userName: user.name }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to join");
      toast.success("You joined the group!");
      setJoinCode("");
      fetchGroup();
    } catch (err: any) {
      toast.error(err?.message || "Failed to join group");
    } finally {
      setJoiningLoading(false);
    }
  }

  async function handleLeave() {
    if (!user?.id) return;
    if (!confirm("Leave this group?")) return;
    try {
      const res = await fetch(`/api/v1/community/${id}/join`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to leave");
      toast.success("You left the group");
      fetchGroup();
    } catch (err: any) {
      toast.error(err?.message || "Failed to leave group");
    }
  }

  function copyJoinCode() {
    if (!group) return;
    navigator.clipboard.writeText(group.joinCode).then(() => toast.success("Join code copied"));
  }

  function addOrderItem() {
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, { productName: "", unit: "kg", pricePerUnit: "", qty: "" }],
    }));
  }

  function removeOrderItem(index: number) {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function updateOrderItem(index: number, field: string, value: string) {
    setNewOrder((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !group) return toast.error("Please log in");
    if (!newOrder.title.trim() || !newOrder.deadline) {
      return toast.error("Title and deadline are required");
    }

    setSubmittingOrder(true);
    try {
      const items = newOrder.items
        .filter((it) => it.productName.trim())
        .map((it) => ({
          productId: `item_${Math.random().toString(36).slice(2, 10)}`,
          productName: it.productName.trim(),
          unit: it.unit || "kg",
          pricePerUnit: parseFloat(it.pricePerUnit) || 0,
          requests: it.qty && parseFloat(it.qty) > 0
            ? [{ userId: user.id, userName: user.name ?? "", qty: parseFloat(it.qty) }]
            : [],
          totalQty: parseFloat(it.qty) || 0,
        }));

      if (items.length === 0) return toast.error("Add at least one item");

      const res = await fetch(`/api/v1/community/${id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityGroupId: id,
          groupName: group.name,
          createdByUserId: user.id,
          createdByName: user.name,
          title: newOrder.title,
          description: newOrder.description,
          items,
          deadline: newOrder.deadline,
          deliveryLocation: newOrder.deliveryLocation,
          deliveryFee: parseFloat(newOrder.deliveryFee) || 0,
          notes: newOrder.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to create order");
      toast.success("Group order created!");
      setShowOrderModal(false);
      setNewOrder({
        title: "", description: "", deadline: "", deliveryLocation: "",
        deliveryFee: "0", notes: "",
        items: [{ productName: "", unit: "kg", pricePerUnit: "", qty: "" }],
      });
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create group order");
    } finally {
      setSubmittingOrder(false);
    }
  }

  if (loadingGroup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-primary border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-sm text-foreground-muted">Group not found.</p>
          <Link href="/community" className="mt-3 inline-block text-xs font-semibold text-brand underline">
            Back to community
          </Link>
        </div>
      </div>
    );
  }

  const visibleMembers = group.members.slice(0, 5);
  const extraMembers = group.members.length - 5;

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="border-b border-border bg-surface-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/community" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-brand">
            ← Back to Community
          </Link>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground-muted">
              {typeIcon(group.type)}
              {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-heading sm:text-3xl">
              {group.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface-card p-5">
              <h2 className="text-sm font-semibold text-foreground-heading">Group Info</h2>

              {group.description && (
                <p className="mt-2 text-xs text-foreground-muted">{group.description}</p>
              )}

              <div className="mt-3 space-y-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {group.location}
                  {group.pincode && ` — ${group.pincode}`}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                </div>
                {group.adminName && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-success" />
                    Admin: {group.adminName}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-surface p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
                  Join Code
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-2xl font-bold tracking-[0.2em] text-foreground-heading">
                    {group.joinCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyJoinCode}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-card px-2.5 py-1.5 text-xs font-semibold text-foreground-body transition hover:bg-secondary-subtle"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </div>

              {group.members.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-foreground-muted">Members</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {visibleMembers.map((m) => (
                      <div
                        key={m.userId}
                        title={m.userName}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                      >
                        {initials(m.userName)}
                      </div>
                    ))}
                    {extraMembers > 0 && (
                      <div className="flex h-8 items-center rounded-full border border-border bg-surface px-2 text-[11px] font-semibold text-foreground-muted">
                        +{extraMembers} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isMember ? (
                <button
                  type="button"
                  onClick={handleLeave}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-status-danger/40 bg-status-danger-surface px-4 py-2.5 text-sm font-semibold text-status-danger transition hover:bg-status-danger-surface/80"
                >
                  <LogOut className="h-4 w-4" />
                  Leave Group
                </button>
              ) : (
                <form onSubmit={handleJoin} className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground-heading">Join this group</p>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter join code (e.g. AB12CD)"
                    className={INPUT_CLS}
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    disabled={joiningLoading}
                    className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {joiningLoading ? "Joining…" : "Join Group"}
                  </button>
                </form>
              )}
            </div>
          </aside>

          <main className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground-heading">Active Group Orders</h2>
              {isMember && (
                <button
                  type="button"
                  onClick={() => setShowOrderModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Order
                </button>
              )}
            </div>

            {loadingOrders ? (
              <div className="flex justify-center py-10">
                <div className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-primary border-t-transparent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface-card px-6 py-12 text-center">
                <Package className="mx-auto mb-2 h-8 w-8 text-foreground-muted" />
                <p className="text-sm font-semibold text-foreground-heading">No group orders yet</p>
                {isMember && (
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create the first order
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const days = daysUntil(order.deadline);
                  const isExpanded = expandedOrder === order.id;
                  return (
                    <div key={order.id} className="rounded-2xl border border-border bg-surface-card shadow-sm">
                      <div className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cx(
                                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                  statusBadgeClass(order.status),
                                )}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {days >= 0 ? (
                                <span className="rounded-full border border-status-warning/30 bg-status-warning-surface px-2.5 py-0.5 text-[11px] font-semibold text-status-warning">
                                  {days === 0 ? "Last day" : `${days}d left`}
                                </span>
                              ) : (
                                <span className="rounded-full border border-status-danger/30 bg-status-danger-surface px-2.5 py-0.5 text-[11px] font-semibold text-status-danger">
                                  Expired
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 font-semibold text-foreground-heading">{order.title}</p>
                            {order.description && (
                              <p className="mt-0.5 text-xs text-foreground-muted">{order.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-foreground-muted">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {order.items.length} {order.items.length === 1 ? "item" : "items"}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                Deadline: {new Date(order.deadline).toLocaleDateString("en-IN")}
                              </span>
                              {order.totalEstimated != null && order.totalEstimated > 0 && (
                                <span className="font-semibold text-brand">
                                  Est. ₹{order.totalEstimated.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground-body transition hover:bg-secondary-subtle"
                          >
                            {isExpanded ? "Collapse" : "View & Participate"}
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-4 pb-4 pt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                            Items
                          </p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-border bg-surface p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-semibold text-foreground-heading">
                                      {item.productName}
                                    </p>
                                    <p className="text-[11px] text-foreground-muted">
                                      ₹{item.pricePerUnit} / {item.unit} · Total: {item.totalQty} {item.unit}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-semibold text-brand">
                                      ₹{(item.totalQty * item.pricePerUnit).toFixed(0)}
                                    </p>
                                    <p className="text-[11px] text-foreground-muted">
                                      {item.requests.length} {item.requests.length === 1 ? "request" : "requests"}
                                    </p>
                                  </div>
                                </div>
                                {item.requests.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {item.requests.map((r, ri) => (
                                      <span
                                        key={ri}
                                        className="rounded-full border border-border bg-surface-card px-2 py-0.5 text-[10px] text-foreground-muted"
                                      >
                                        {r.userName}: {r.qty} {item.unit}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {order.deliveryLocation && (
                            <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground-muted">
                              <MapPin className="h-3.5 w-3.5" />
                              Delivery: {order.deliveryLocation}
                              {order.deliveryFee ? ` · ₹${order.deliveryFee} fee` : ""}
                            </p>
                          )}
                          {order.notes && (
                            <p className="mt-1 text-xs text-foreground-muted">Note: {order.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground-heading/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-surface-card p-6 shadow-xl sm:max-w-lg sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground-heading">Create Group Order</h3>
              <button type="button" onClick={() => setShowOrderModal(false)}>
                <X className="h-5 w-5 text-foreground-muted" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground-heading">
                  Title *
                </label>
                <input
                  value={newOrder.title}
                  onChange={(e) => setNewOrder((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Weekly Vegetables Run"
                  className={INPUT_CLS}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground-heading">
                  Description
                </label>
                <textarea
                  value={newOrder.description}
                  onChange={(e) => setNewOrder((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Optional details"
                  className={INPUT_CLS}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground-heading">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={newOrder.deadline}
                    onChange={(e) => setNewOrder((p) => ({ ...p, deadline: e.target.value }))}
                    className={INPUT_CLS}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground-heading">
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newOrder.deliveryFee}
                    onChange={(e) => setNewOrder((p) => ({ ...p, deliveryFee: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground-heading">
                  Delivery Location
                </label>
                <input
                  value={newOrder.deliveryLocation}
                  onChange={(e) => setNewOrder((p) => ({ ...p, deliveryLocation: e.target.value }))}
                  placeholder="e.g. Main gate, Block A"
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground-heading">Items *</label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {newOrder.items.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-surface p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={item.productName}
                          onChange={(e) => updateOrderItem(idx, "productName", e.target.value)}
                          placeholder="Product name"
                          className={INPUT_CLS}
                        />
                        <div className="flex gap-2">
                          <input
                            value={item.unit}
                            onChange={(e) => updateOrderItem(idx, "unit", e.target.value)}
                            placeholder="Unit"
                            className={cx(INPUT_CLS, "w-20")}
                          />
                          {newOrder.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOrderItem(idx)}
                              className="text-foreground-muted hover:text-status-danger"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={item.pricePerUnit}
                          onChange={(e) => updateOrderItem(idx, "pricePerUnit", e.target.value)}
                          placeholder="Price/unit (₹)"
                          className={INPUT_CLS}
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => updateOrderItem(idx, "qty", e.target.value)}
                          placeholder="Your qty"
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground-heading">
                  Notes
                </label>
                <input
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any special instructions"
                  className={INPUT_CLS}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground-body transition hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
                >
                  {submittingOrder ? "Creating…" : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
