"use client";

import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { cx } from "@/shared/lib/utils";

type TxType =
  | "credit"
  | "debit"
  | "refund"
  | "referral_reward"
  | "cashback"
  | "subscription_refund";

type TxStatus = "pending" | "completed" | "failed";

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  status: TxStatus;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
}

const CREDIT_TYPES: TxType[] = [
  "credit",
  "refund",
  "referral_reward",
  "cashback",
  "subscription_refund",
];

function isCredit(type: TxType): boolean {
  return CREDIT_TYPES.includes(type);
}

function txLabel(type: TxType): string {
  const map: Record<TxType, string> = {
    credit: "Credit",
    debit: "Debit",
    refund: "Refund",
    referral_reward: "Referral Reward",
    cashback: "Cashback",
    subscription_refund: "Subscription Refund",
  };
  return map[type];
}

function TxIcon({ type }: { type: TxType }) {
  if (isCredit(type)) {
    if (type === "referral_reward") return <Gift className="h-4 w-4" />;
    if (type === "refund" || type === "subscription_refund")
      return <RotateCcw className="h-4 w-4" />;
    return <ArrowDownLeft className="h-4 w-4" />;
  }
  return <ArrowUpRight className="h-4 w-4" />;
}

function StatusBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    completed: "bg-status-success-surface text-status-success",
    pending: "bg-status-warning-surface text-status-warning",
    failed: "bg-status-danger-surface text-status-danger",
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

export default function WalletPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchTransactions = useCallback(
    async (pageNum: number, replace = false) => {
      if (!user) return;
      setFetching(true);
      try {
        const res = await fetch(
          `/api/v1/wallet/transactions?userId=${user.id}&page=${pageNum}&limit=20`,
        );
        const json = await res.json();
        if (json.success) {
          setWallet(json.data.wallet);
          setMeta(json.data.meta);
          setTransactions((prev) =>
            replace ? json.data.transactions : [...prev, ...json.data.transactions],
          );
        }
      } finally {
        setFetching(false);
        setInitialLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTransactions(1, true);
    }
  }, [user, fetchTransactions]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
  }

  if (authLoading || initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  const hasMore = meta ? page < meta.totalPages : false;

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground-heading">My Wallet</h1>
            <p className="text-xs text-foreground-muted">FR3SH Credits</p>
          </div>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl border border-border bg-surface-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Wallet Balance
          </p>
          <p className="mt-2 text-5xl font-bold text-foreground-heading">
            ₹{wallet?.balance ?? 0}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Available to use at checkout</p>
        </div>

        {/* How to earn */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            How to earn credits
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: "👥", title: "Refer a Friend", desc: "Earn ₹100 per referral" },
              { emoji: "💸", title: "Cashback", desc: "On eligible purchases" },
              { emoji: "🔄", title: "Refunds", desc: "Credited automatically" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface-card p-4 text-center"
              >
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-xs font-semibold text-foreground-heading">{item.title}</p>
                <p className="text-[10px] text-foreground-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
              Transactions
            </h2>
            {meta && (
              <span className="text-xs text-foreground-muted">{meta.total} total</span>
            )}
          </div>

          {transactions.length === 0 && !fetching ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-card py-12 text-center">
              <Wallet className="h-10 w-10 text-foreground-muted opacity-40" />
              <p className="text-sm font-semibold text-foreground-heading">
                No transactions yet
              </p>
              <p className="text-xs text-foreground-muted">
                Refer friends or earn cashback to see activity here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-surface-card">
              {transactions.map((tx) => {
                const credit = isCredit(tx.type);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className={cx(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                        credit
                          ? "bg-status-success-surface text-status-success"
                          : "bg-status-danger-surface text-status-danger",
                      )}
                    >
                      <TxIcon type={tx.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground-heading">
                        {tx.description}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10px] text-foreground-muted">
                          {txLabel(tx.type)}
                        </span>
                        <span className="text-[10px] text-foreground-muted">·</span>
                        <span className="text-[10px] text-foreground-muted">
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cx(
                          "text-sm font-bold",
                          credit ? "text-status-success" : "text-status-danger",
                        )}
                      >
                        {credit ? "+" : "-"}₹{tx.amount}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={fetching}
              className="mt-4 w-full rounded-xl border border-border bg-surface-card py-3 text-sm font-semibold text-foreground-heading transition hover:bg-surface disabled:opacity-50"
            >
              {fetching ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
