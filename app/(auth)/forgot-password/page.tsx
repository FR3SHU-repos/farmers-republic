"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Mail, Sprout } from "lucide-react";

const COOLDOWN_SECS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function sendOtp(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.();
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before resending.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || json?.error || "Failed to send OTP. Try again later.");
        return;
      }
      toast.success("OTP sent. Check your inbox (and spam).");
      setCooldown(COOLDOWN_SECS);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground-heading">
            {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-card p-8 shadow-sm">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-subtle">
            <Mail className="h-6 w-6 text-primary" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground-heading">
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Enter your email and we&apos;ll send a one-time code to reset your
            password.
          </p>

          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-body">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading
                ? "Sending…"
                : cooldown > 0
                ? `Resend OTP (${cooldown}s)`
                : "Send OTP"}
            </button>
          </form>

          <p className="mt-4 text-xs text-foreground-muted">
            After receiving the OTP, you&apos;ll be redirected to the reset page
            to enter the code and set a new password.
          </p>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm text-foreground-muted transition hover:text-foreground-body"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>
      </div>
    </div>
  );
}
