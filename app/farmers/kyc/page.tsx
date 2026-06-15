"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";

type KycStatus = "pending" | "submitted" | "verified" | "rejected";

type KycData = {
  aadhaarNumber: string;
  aadhaarDocUrl: string;
  panNumber: string;
  panDocUrl: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  bankIFSC: string;
  bankName: string;
  fssaiLicense: string;
  fssaiDocUrl: string;
  landDocUrl: string;
  organicCertified: boolean;
};

const INITIAL_DATA: KycData = {
  aadhaarNumber: "",
  aadhaarDocUrl: "",
  panNumber: "",
  panDocUrl: "",
  bankAccountHolderName: "",
  bankAccountNumber: "",
  bankIFSC: "",
  bankName: "",
  fssaiLicense: "",
  fssaiDocUrl: "",
  landDocUrl: "",
  organicCertified: false,
};

const STEPS = [
  { id: 1, label: "Identity" },
  { id: 2, label: "Bank" },
  { id: 3, label: "Certifications" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-foreground-heading";

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  required = false,
}: {
  label: string;
  name: keyof KycData;
  value: string;
  onChange: (name: keyof KycData, value: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required && <span className="ml-0.5 text-status-danger">*</span>}
      </label>
      <input
        type={type}
        className={cx(INPUT_CLASS, readOnly && "opacity-60 cursor-not-allowed")}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}

function StatusBanner({
  status,
  notes,
}: {
  status: KycStatus;
  notes?: string;
}) {
  const configs = {
    pending: {
      icon: Clock,
      text: "Complete your KYC to start selling on Farmers Republic",
      cls: "bg-secondary-subtle text-foreground-heading border-border",
    },
    submitted: {
      icon: Clock,
      text: "Your KYC is under review. We'll notify you soon.",
      cls: "bg-status-warning-surface text-status-warning border-status-warning/30",
    },
    verified: {
      icon: CheckCircle,
      text: "KYC Verified — You're approved to sell on Farmers Republic!",
      cls: "bg-status-success-surface text-status-success border-status-success/30",
    },
    rejected: {
      icon: XCircle,
      text: "Your KYC was rejected. Please review and re-submit.",
      cls: "bg-status-danger-surface text-status-danger border-status-danger/30",
    },
  };

  const cfg = configs[status];
  const Icon = cfg.icon;

  return (
    <div className={cx("flex items-start gap-3 rounded-xl border p-4", cfg.cls)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">{cfg.text}</p>
        {status === "rejected" && notes && (
          <p className="mt-1 text-sm opacity-80">Reason: {notes}</p>
        )}
      </div>
    </div>
  );
}

function StepsIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cx(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
              current === step.id
                ? "bg-primary text-primary-foreground"
                : current > step.id
                ? "bg-status-success text-primary-foreground"
                : "bg-secondary-subtle text-foreground-muted",
            )}
          >
            {current > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={cx(
              "ml-2 text-sm font-medium",
              current === step.id ? "text-foreground-heading" : "text-foreground-muted",
            )}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={cx(
                "mx-3 h-px w-8 sm:w-12 transition-colors",
                current > step.id ? "bg-status-success" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FarmerKycPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus>("pending");
  const [notes, setNotes] = useState<string>("");
  const [formData, setFormData] = useState<KycData>(INITIAL_DATA);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.type !== "Farmer") {
      router.replace("/");
      return;
    }

    async function loadKyc() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/farmers?profileId=${user!.id}`);
        const json = await res.json();

        if (!json.success || !json.data?.farmerId) {
          toast.error("Farmer profile not found. Please create a profile first.");
          setLoading(false);
          return;
        }

        const fId = json.data.farmerId as string;
        setFarmerId(fId);

        const kycRes = await fetch(`/api/v1/farmers/kyc?farmerId=${fId}`);
        const kycJson = await kycRes.json();

        if (kycJson.success && kycJson.data?.kyc) {
          const kyc = kycJson.data.kyc;
          setKycStatus(kyc.kycStatus ?? "pending");
          setNotes(kyc.notes ?? "");
          setFormData({
            aadhaarNumber: kyc.aadhaarNumber ?? "",
            aadhaarDocUrl: kyc.aadhaarDocUrl ?? "",
            panNumber: kyc.panNumber ?? "",
            panDocUrl: kyc.panDocUrl ?? "",
            bankAccountHolderName: kyc.bankAccountHolderName ?? "",
            bankAccountNumber: kyc.bankAccountNumber ?? "",
            bankIFSC: kyc.bankIFSC ?? "",
            bankName: kyc.bankName ?? "",
            fssaiLicense: kyc.fssaiLicense ?? "",
            fssaiDocUrl: kyc.fssaiDocUrl ?? "",
            landDocUrl: kyc.landDocUrl ?? "",
            organicCertified: kyc.organicCertified ?? false,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadKyc();
  }, [user, userLoading, router]);

  const updateField = (name: keyof KycData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveDraft = async () => {
    if (!farmerId) return;
    try {
      const res = await fetch("/api/v1/farmers/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId, ...formData, kycStatus: "pending" }),
      });
      const json = await res.json();
      if (json.success) toast.success("Progress saved");
      else toast.error(json.message || "Save failed");
    } catch {
      toast.error("Save failed");
    }
  };

  const handleSubmit = async () => {
    if (!farmerId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/farmers/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId, ...formData }),
      });
      const json = await res.json();
      if (json.success) {
        setKycStatus("submitted");
        toast.success("KYC submitted for verification!");
      } else {
        toast.error(json.message || "Submission failed");
      }
    } catch {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = kycStatus === "verified";

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32 text-foreground-muted text-sm">
        Loading KYC…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-8 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground-heading">KYC Verification</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Complete your identity verification to start selling
          </p>
        </div>

        <StatusBanner status={kycStatus} notes={notes} />

        {kycStatus !== "verified" && (
          <div className="rounded-2xl border border-border bg-surface-card px-5 py-4">
            <StepsIndicator current={step} />
          </div>
        )}

        {/* Step 1 — Identity */}
        {step === 1 && (
          <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-4">
            <h2 className="font-semibold text-foreground-heading">Step 1 — Identity Documents</h2>

            <Field
              label="Aadhaar Number"
              name="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={updateField}
              placeholder="1234 5678 9012"
              required
              readOnly={isReadOnly}
            />
            <Field
              label="Aadhaar Document URL"
              name="aadhaarDocUrl"
              value={formData.aadhaarDocUrl}
              onChange={updateField}
              placeholder="https://..."
              readOnly={isReadOnly}
            />
            <Field
              label="PAN Number"
              name="panNumber"
              value={formData.panNumber}
              onChange={updateField}
              placeholder="ABCDE1234F"
              readOnly={isReadOnly}
            />
            <Field
              label="PAN Document URL"
              name="panDocUrl"
              value={formData.panDocUrl}
              onChange={updateField}
              placeholder="https://..."
              readOnly={isReadOnly}
            />

            {!isReadOnly && (
              <div className="flex justify-between pt-2">
                <button
                  onClick={saveDraft}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-secondary-subtle transition-colors"
                >
                  Save progress
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Bank */}
        {step === 2 && (
          <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-4">
            <h2 className="font-semibold text-foreground-heading">Step 2 — Bank Details</h2>

            <Field
              label="Account Holder Name"
              name="bankAccountHolderName"
              value={formData.bankAccountHolderName}
              onChange={updateField}
              placeholder="As per bank records"
              required
              readOnly={isReadOnly}
            />
            <Field
              label="Bank Account Number"
              name="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={updateField}
              placeholder="Enter account number"
              required
              readOnly={isReadOnly}
            />
            <Field
              label="IFSC Code"
              name="bankIFSC"
              value={formData.bankIFSC}
              onChange={updateField}
              placeholder="e.g. SBIN0001234"
              required
              readOnly={isReadOnly}
            />
            <Field
              label="Bank Name"
              name="bankName"
              value={formData.bankName}
              onChange={updateField}
              placeholder="e.g. State Bank of India"
              readOnly={isReadOnly}
            />

            {!isReadOnly && (
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-secondary-subtle transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={saveDraft}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-secondary-subtle transition-colors"
                  >
                    Save progress
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Certifications */}
        {step === 3 && (
          <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-4">
            <h2 className="font-semibold text-foreground-heading">Step 3 — Certifications</h2>

            <Field
              label="FSSAI License Number"
              name="fssaiLicense"
              value={formData.fssaiLicense}
              onChange={updateField}
              placeholder="FSSAI license number"
              readOnly={isReadOnly}
            />
            <Field
              label="FSSAI Document URL"
              name="fssaiDocUrl"
              value={formData.fssaiDocUrl}
              onChange={updateField}
              placeholder="https://..."
              readOnly={isReadOnly}
            />
            <Field
              label="Land Document URL (optional)"
              name="landDocUrl"
              value={formData.landDocUrl}
              onChange={updateField}
              placeholder="https://..."
              readOnly={isReadOnly}
            />

            <div className="flex items-center gap-3">
              <input
                id="organic"
                type="checkbox"
                checked={formData.organicCertified}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organicCertified: e.target.checked }))
                }
                disabled={isReadOnly}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <label htmlFor="organic" className="text-sm text-foreground-heading">
                My farm is organically certified
              </label>
            </div>

            {!isReadOnly && (
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-secondary-subtle transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={saveDraft}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-secondary-subtle transition-colors"
                  >
                    Save progress
                  </button>
                  <button
                    disabled={submitting || kycStatus === "submitted"}
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {submitting
                      ? "Submitting…"
                      : kycStatus === "submitted"
                      ? "Already submitted"
                      : "Submit for Verification"}
                    {!submitting && kycStatus !== "submitted" && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {kycStatus === "verified" && (
              <div className="rounded-xl border border-status-success/30 bg-status-success-surface p-3 text-sm text-status-success font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Your KYC is verified. No changes needed.
              </div>
            )}
          </div>
        )}

        {kycStatus === "submitted" && (
          <div className="rounded-xl border border-status-warning/30 bg-status-warning-surface p-4 text-sm text-status-warning flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Your KYC documents have been submitted and are under review by our team. This
              typically takes 1–2 business days. You will be notified once reviewed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
