"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Mail, Sprout } from "lucide-react";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";
import { INPUT_CLS } from "@/shared/components/auth/parts";

const COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const supabase = createAuthBrowserClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
    setCooldown(COOLDOWN);
    // Enumeration-safe: identical response regardless of account existence.
    toast.success("If that email has an account, a reset link is on its way.");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-card px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold text-foreground-heading">
          {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
        </span>
      </div>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground-heading">
          Reset your password
        </h2>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Enter your email and we&apos;ll send a secure link to set a new
          password.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground-body"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={INPUT_CLS}
            />
          </div>
          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Send reset link"}
          </button>
        </form>

        {sent && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm text-foreground-body">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Check your inbox for the reset link. It expires shortly for your
            security.
          </p>
        )}

        <div className="mt-8">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-1.5 text-xs text-foreground-muted hover:text-foreground-body"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
