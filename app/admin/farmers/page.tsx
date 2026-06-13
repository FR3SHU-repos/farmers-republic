"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import { Search, ChevronLeft, ChevronRight, X, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

type FarmerItem = {
  id: string;
  name: string;
  farmName: string;
  phone: string;
  district: string;
  state: string;
  kycStatus: "pending" | "submitted" | "verified" | "rejected";
  verified: boolean;
  avatar: string | null;
  createdAt: string;
  productCount: number;
};

type FarmerKYCDetail = FarmerItem & {
  aadhaarNumber?: string;
  aadhaarDocUrl?: string;
  panNumber?: string;
  panDocUrl?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  fssaiLicense?: string;
  fssaiDocUrl?: string;
  notes?: string;
};

type Meta = { total: number; page: number; limit: number; totalPages: number };

type KycTab = "all" | "submitted" | "verified" | "rejected";

const KYC_STATUS_STYLES: Record<string, string> = {
  pending: "bg-secondary-subtle text-foreground-muted",
  submitted: "bg-status-warning-surface text-status-warning",
  verified: "bg-status-success-surface text-status-success",
  rejected: "bg-status-danger-surface text-status-danger",
};

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

function KycModal({
  farmer,
  onClose,
  onUpdate,
}: {
  farmer: FarmerKYCDetail;
  onClose: () => void;
  onUpdate: (id: string, status: "verified" | "rejected", notes?: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handle = async (status: "verified" | "rejected") => {
    setSubmitting(true);
    await onUpdate(farmer.id, status, status === "rejected" ? reason : undefined);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-heading/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground-heading">KYC Review — {farmer.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-foreground-muted hover:bg-secondary-subtle">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <Section title="Identity Documents">
            <Field label="Aadhaar Number" value={farmer.aadhaarNumber} />
            <DocLink label="Aadhaar Doc" url={farmer.aadhaarDocUrl} />
            <Field label="PAN Number" value={farmer.panNumber} />
            <DocLink label="PAN Doc" url={farmer.panDocUrl} />
          </Section>

          <Section title="Bank Details">
            <Field label="Account Holder" value={farmer.bankAccountHolderName} />
            <Field label="Account Number" value={farmer.bankAccountNumber} />
            <Field label="IFSC Code" value={farmer.bankIFSC} />
            <Field label="Bank Name" value={farmer.bankName} />
          </Section>

          <Section title="Certifications">
            <Field label="FSSAI License" value={farmer.fssaiLicense} />
            <DocLink label="FSSAI Doc" url={farmer.fssaiDocUrl} />
          </Section>

          {farmer.kycStatus === "submitted" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground-muted">
                  Rejection reason (required if rejecting)
                </label>
                <textarea
                  className={cx(INPUT_CLASS, "h-20 resize-none")}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter rejection reason…"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  disabled={submitting}
                  onClick={() => handle("verified")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  disabled={submitting || !reason.trim()}
                  onClick={() => handle("rejected")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-status-danger bg-status-danger-surface px-4 py-2.5 text-sm font-semibold text-status-danger hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </>
          )}

          {farmer.notes && (
            <div className="rounded-xl bg-status-warning-surface border border-status-warning/30 p-3 text-sm text-status-warning">
              <strong>Admin note:</strong> {farmer.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">{title}</h3>
      <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className="font-medium text-foreground-heading">{value || "—"}</span>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string }) {
  if (!url) return <Field label={label} value="Not uploaded" />;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground-muted">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-brand hover:underline font-medium"
      >
        View <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function AdminFarmersContent() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [farmers, setFarmers] = useState<FarmerItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<KycTab>(
    (searchParams.get("kycStatus") as KycTab) ?? "all",
  );
  const [page, setPage] = useState(1);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerKYCDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.type !== "Admin") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      if (activeTab !== "all") params.set("kycStatus", activeTab);

      const res = await fetch(`/api/v1/admin/farmers?${params}`);
      const json = await res.json();
      if (json.success) {
        setFarmers(json.data.items);
        setMeta(json.data.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, activeTab, page]);

  useEffect(() => {
    if (!userLoading && user?.type === "Admin") fetchFarmers();
  }, [fetchFarmers, user, userLoading]);

  const openKycModal = async (farmer: FarmerItem) => {
    setModalLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/farmers/${farmer.id}`);
      const json = await res.json();
      if (json.success) setSelectedFarmer(json.data.farmer);
    } catch (e) {
      toast.error("Failed to load farmer details");
    } finally {
      setModalLoading(false);
    }
  };

  const handleKycUpdate = async (
    id: string,
    status: "verified" | "rejected",
    notes?: string,
  ) => {
    try {
      const body: Record<string, unknown> = { kycStatus: status };
      if (notes) body.notes = notes;

      const res = await fetch(`/api/v1/admin/farmers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(status === "verified" ? "KYC Approved" : "KYC Rejected");
        fetchFarmers();
      } else {
        toast.error(json.message || "Failed");
      }
    } catch {
      toast.error("Failed to update KYC");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const tabs: { key: KycTab; label: string }[] = [
    { key: "all", label: "All Farmers" },
    { key: "submitted", label: "KYC Pending" },
    { key: "verified", label: "Verified" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground-heading">Farmer Management</h1>
        <p className="text-sm text-foreground-muted mt-1">{meta.total} farmers total</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={cx(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
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
          placeholder="Search farmers…"
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
                {["Farmer", "Farm", "Location", "KYC Status", "Products", "Joined", "Actions"].map((h) => (
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
              {!loading && farmers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-foreground-muted">
                    No farmers found
                  </td>
                </tr>
              )}
              {!loading &&
                farmers.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {f.avatar ? (
                          <img src={f.avatar} alt={f.name} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-subtle text-xs font-bold text-foreground-heading">
                            {f.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground-heading">{f.name}</p>
                          <p className="text-xs text-foreground-muted">{f.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{f.farmName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">
                      {[f.district, f.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          KYC_STATUS_STYLES[f.kycStatus] ?? "bg-secondary-subtle text-foreground-muted",
                        )}
                      >
                        {f.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{f.productCount}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {f.kycStatus === "submitted" && (
                        <button
                          disabled={modalLoading}
                          onClick={() => openKycModal(f)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                          Review KYC
                        </button>
                      )}
                      {f.kycStatus !== "submitted" && (
                        <button
                          onClick={() => openKycModal(f)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-secondary-subtle transition-colors"
                        >
                          View
                        </button>
                      )}
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

      {selectedFarmer && (
        <KycModal
          farmer={selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
          onUpdate={handleKycUpdate}
        />
      )}
    </div>
  );
}

export default function AdminFarmersPage() {
  return (
    <Suspense>
      <AdminFarmersContent />
    </Suspense>
  );
}
