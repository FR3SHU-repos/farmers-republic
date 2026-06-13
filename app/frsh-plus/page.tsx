"use client";

import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { cx } from "@/shared/lib/utils";

interface SubscriptionData {
  status: string;
  validUntil: string | null;
  isActive: boolean;
  plan: string;
  benefits: string[];
}

const BENEFITS = [
  { emoji: "🚚", title: "Free delivery", desc: "On every order, no minimum" },
  { emoji: "🌱", title: "Early harvest access", desc: "First pick of new arrivals" },
  { emoji: "💰", title: "5% cashback", desc: "On every purchase" },
  { emoji: "🏷️", title: "Member discounts", desc: "Exclusive FR3SH+ pricing" },
  { emoji: "🎯", title: "Priority support", desc: "Skip the queue" },
  { emoji: "✨", title: "FR3SH+ badge", desc: "Stand out on your profile" },
];

const FAQS = [
  {
    q: "When does my subscription start?",
    a: "Your subscription starts immediately after payment is confirmed.",
  },
  {
    q: "How does the 5% cashback work?",
    a: "Cashback is automatically credited to your wallet within 24 hours of order delivery.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel anytime. Your benefits remain active until the end of your billing period.",
  },
  {
    q: "Will my FR3SH+ badge disappear after cancellation?",
    a: "The badge stays as a historical record, but the 'active member' indicator will be removed.",
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground-heading">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-foreground-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-foreground-muted" />
        )}
      </button>
      {open && <p className="pb-4 text-sm text-foreground-muted">{a}</p>}
    </div>
  );
}

export default function FrshPlusPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v1/subscription?userId=${user.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSubData(json.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubscribe() {
    if (!user) return;
    setSubscribing(true);
    try {
      const res = await fetch("/api/v1/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plan: selectedPlan }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Welcome to FR3SH+!");
        const refresh = await fetch(`/api/v1/subscription?userId=${user.id}`);
        const refreshJson = await refresh.json();
        if (refreshJson.success) setSubData(refreshJson.data);
      } else {
        toast.error(json.message ?? "Failed to subscribe");
      }
    } finally {
      setSubscribing(false);
    }
  }

  async function handleCancel() {
    if (!user) return;
    if (!confirm("Cancel your FR3SH+ subscription?")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/v1/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Subscription cancelled");
        const refresh = await fetch(`/api/v1/subscription?userId=${user.id}`);
        const refreshJson = await refresh.json();
        if (refreshJson.success) setSubData(refreshJson.data);
      } else {
        toast.error(json.message ?? "Failed to cancel");
      }
    } finally {
      setCancelling(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isActive = subData?.isActive ?? false;

  return (
    <main className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-primary px-4 py-14 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex justify-center">
            <Sparkles className="h-10 w-10 text-primary-foreground opacity-80" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            FR3SH+ Plus
          </h1>
          <p className="mt-3 text-base text-primary-foreground/80">
            Fresh produce. Delivered first. Always.
          </p>

          {isActive && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-2">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm font-semibold text-primary-foreground">
                You&apos;re a FR3SH+ member
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Active subscription banner */}
        {isActive && subData?.validUntil && (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-status-success-surface px-5 py-4">
            <Check className="h-5 w-5 flex-shrink-0 text-status-success" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-status-success">
                Active FR3SH+ subscription
              </p>
              <p className="text-xs text-status-success/80">
                Valid until {formatDate(subData.validUntil)}
              </p>
            </div>
          </div>
        )}

        {/* Benefits grid */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-foreground-heading">
            Everything included
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-3 rounded-2xl border border-border bg-surface-card p-4"
              >
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground-heading">{b.title}</p>
                  <p className="text-xs text-foreground-muted">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        {!isActive && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-foreground-heading">Choose a plan</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Monthly */}
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={cx(
                  "relative rounded-2xl border-2 p-6 text-left transition-all",
                  selectedPlan === "monthly"
                    ? "border-primary bg-secondary-subtle"
                    : "border-border bg-surface-card hover:border-primary/40",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Most Flexible
                </p>
                <p className="mt-1 text-3xl font-extrabold text-foreground-heading">₹199</p>
                <p className="text-sm text-foreground-muted">per month</p>
                <ul className="mt-4 space-y-2">
                  {BENEFITS.slice(0, 4).map((b) => (
                    <li key={b.title} className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      {b.title}
                    </li>
                  ))}
                </ul>
                {selectedPlan === "monthly" && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>

              {/* Annual */}
              <button
                onClick={() => setSelectedPlan("annual")}
                className={cx(
                  "relative rounded-2xl border-2 p-6 text-left transition-all",
                  selectedPlan === "annual"
                    ? "border-primary bg-secondary-subtle"
                    : "border-border bg-surface-card hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Best Value
                  </p>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Most Popular
                  </span>
                </div>
                <p className="mt-1 text-3xl font-extrabold text-foreground-heading">₹1,499</p>
                <p className="text-sm text-foreground-muted">
                  per year{" "}
                  <span className="font-semibold text-status-success">save ₹889</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {BENEFITS.map((b) => (
                    <li key={b.title} className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      {b.title}
                    </li>
                  ))}
                </ul>
                {selectedPlan === "annual" && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {subscribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Subscribe {selectedPlan === "monthly" ? "Monthly — ₹199" : "Annually — ₹1,499"}
                </>
              )}
            </button>
          </div>
        )}

        {/* Cancel */}
        {isActive && (
          <div className="rounded-2xl border border-border bg-surface-card p-6 text-center">
            <p className="text-sm font-semibold text-foreground-heading">FR3SH+ Plan</p>
            {subData?.validUntil && (
              <p className="mt-1 text-xs text-foreground-muted">
                Active until {formatDate(subData.validUntil)}
              </p>
            )}
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-4 text-xs text-status-danger underline underline-offset-2 hover:opacity-70 disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel subscription"}
            </button>
          </div>
        )}

        {/* FAQ */}
        <div>
          <h2 className="mb-2 text-lg font-bold text-foreground-heading">
            Frequently asked questions
          </h2>
          <div className="rounded-2xl border border-border bg-surface-card px-5">
            {FAQS.map((faq) => (
              <FAQ key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
