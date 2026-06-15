"use client";

import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy, Share2, Users } from "lucide-react";
import { cx } from "@/shared/lib/utils";

type ReferralStatus = "pending" | "rewarded" | "expired";

interface RecentReferral {
  id: string;
  refereeName?: string;
  refereeEmail?: string;
  status: ReferralStatus;
  rewardAmount: number;
  rewardedAt?: string;
  createdAt: string;
}

interface ReferralData {
  referralCode: string | null;
  referralLink: string | null;
  stats: {
    totalReferrals: number;
    rewardedCount: number;
    totalEarned: number;
  };
  recentReferrals: RecentReferral[];
}

function StatusBadge({ status }: { status: ReferralStatus }) {
  const styles: Record<ReferralStatus, string> = {
    rewarded: "bg-status-success-surface text-status-success",
    pending: "bg-status-warning-surface text-status-warning",
    expired: "bg-status-danger-surface text-status-danger",
  };
  return (
    <span
      className={cx(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReferralPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v1/referral?userId=${user.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  function copyLink() {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function share() {
    if (!data?.referralLink) return;
    if (navigator.share) {
      navigator.share({
        title: "Join Farmers Republic",
        text: "Use my referral link to join FR3SH and get fresh produce directly from farmers!",
        url: data.referralLink,
      });
    } else {
      copyLink();
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

  const stats = data?.stats;

  return (
    <main className="min-h-screen bg-surface px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Hero */}
        <div className="rounded-2xl border border-border bg-surface-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Users className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground-heading">
            Invite friends, earn ₹100 each
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Share your unique referral link. When your friend places their first order,
            you get ₹100 in wallet credits.
          </p>
        </div>

        {/* Referral code + link */}
        {data?.referralCode ? (
          <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Your Referral Code
              </p>
              <div className="flex items-center gap-3">
                <span className="rounded-xl border border-primary bg-secondary-subtle px-4 py-2 font-mono text-base font-bold tracking-widest text-brand">
                  {data.referralCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(data.referralCode!);
                    toast.success("Code copied!");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface transition hover:bg-secondary-subtle"
                >
                  <Copy className="h-4 w-4 text-foreground-muted" />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Your Referral Link
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-xs text-foreground-muted">
                  {data.referralLink}
                </span>
                <button
                  onClick={copyLink}
                  className={cx(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition",
                    copied
                      ? "bg-status-success-surface text-status-success"
                      : "text-foreground-muted hover:text-foreground-heading",
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={share}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Share2 className="h-4 w-4" />
              Share your link
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface-card p-6 text-center">
            <p className="text-sm text-foreground-muted">
              No referral code assigned yet. Contact support to get yours.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Friends Invited", value: stats?.totalReferrals ?? 0 },
            { label: "Friends Joined", value: stats?.rewardedCount ?? 0 },
            { label: "Total Earned", value: `₹${stats?.totalEarned ?? 0}` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-surface-card p-4 text-center"
            >
              <p className="text-2xl font-bold text-foreground-heading">{s.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-border bg-surface-card p-6">
          <h2 className="mb-4 text-sm font-bold text-foreground-heading">How it works</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Share your unique referral link or code with friends" },
              { step: "2", text: "Friend signs up using your link and places their first order" },
              { step: "3", text: "You instantly earn ₹100 wallet credit — no limits!" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </div>
                <p className="pt-0.5 text-sm text-foreground-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent referrals */}
        {data?.recentReferrals && data.recentReferrals.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
              Recent Referrals
            </h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-surface-card">
              {data.recentReferrals.map((ref) => (
                <div key={ref.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary-subtle text-sm font-bold text-brand">
                    {(ref.refereeName ?? ref.refereeEmail ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground-heading">
                      {ref.refereeName ?? ref.refereeEmail ?? "Anonymous"}
                    </p>
                    {ref.refereeEmail && ref.refereeName && (
                      <p className="text-xs text-foreground-muted">{ref.refereeEmail}</p>
                    )}
                    <p className="text-[10px] text-foreground-muted">
                      {formatDate(ref.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={ref.status} />
                    {ref.status === "rewarded" && (
                      <span className="text-xs font-bold text-status-success">
                        +₹{ref.rewardAmount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
