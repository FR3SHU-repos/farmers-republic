"use client";

import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { cx } from "@/shared/lib/utils";

interface BadgeData {
  id: string;
  label: string;
  description: string;
  emoji: string;
  earned: boolean;
  earnedAt: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BadgesPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v1/badges?userId=${user.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBadges(json.data.badges);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <main className="min-h-screen bg-surface px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Award className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground-heading">Your Badges</h1>
              <p className="text-xs text-foreground-muted">
                Earn badges by being an active community member
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface-card px-3 py-2 text-center">
            <p className="text-lg font-bold text-foreground-heading">
              {earnedCount}
              <span className="text-sm font-normal text-foreground-muted"> / {badges.length}</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              Earned
            </p>
          </div>
        </div>

        {/* Earned section */}
        {earnedCount > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Earned ({earnedCount})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges
                .filter((b) => b.earned)
                .map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-2xl border border-border bg-surface-card p-5 flex flex-col items-center gap-3 text-center transition-all"
                  >
                    <span className="text-4xl">{badge.emoji}</span>
                    <p className="font-bold text-foreground-heading text-sm">{badge.label}</p>
                    <p className="text-xs text-foreground-muted">{badge.description}</p>
                    {badge.earnedAt && (
                      <p className="text-[10px] text-foreground-muted/60">
                        {formatDate(badge.earnedAt)}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Locked section */}
        {badges.filter((b) => !b.earned).length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Locked ({badges.filter((b) => !b.earned).length})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges
                .filter((b) => !b.earned)
                .map((badge) => (
                  <div
                    key={badge.id}
                    className={cx(
                      "rounded-2xl border p-5 flex flex-col items-center gap-3 text-center transition-all",
                      "border-dashed border-border bg-surface opacity-40",
                    )}
                  >
                    <span className="text-4xl">{badge.emoji}</span>
                    <p className="font-bold text-foreground-heading text-sm">{badge.label}</p>
                    <p className="text-xs text-foreground-muted">{badge.description}</p>
                    <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">
                      Locked
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {badges.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-card py-16 text-center">
            <Award className="h-12 w-12 text-foreground-muted opacity-40" />
            <p className="text-sm font-semibold text-foreground-heading">No badges yet</p>
            <p className="text-xs text-foreground-muted">
              Start shopping and referring friends to earn your first badge
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
