"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { MailCheck, Sprout } from "lucide-react";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";
import { safeNext } from "@/shared/lib/auth/gin";
import {
  Divider,
  GoogleButton,
  INPUT_CLS,
  PasswordField,
  StrengthMeter,
  WhatsAppButton,
  passwordScore,
} from "@/shared/components/auth/parts";

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const supabase = createAuthBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (passwordScore(password).score < 1) {
      toast.error("Please choose a stronger password (at least 8 characters).");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!terms) {
      toast.error("Please accept the terms and privacy policy.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);

    // Enumeration-safe: same confirmation screen whether or not the email
    // already had an account.
    if (error && !/already registered/i.test(error.message)) {
      toast.error("We couldn't create your account. Please try again.");
      return;
    }
    setSent(true);
  }

  async function onGoogle() {
    setGoogleLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error("Google sign-up is unavailable right now.");
    }
  }

  if (sent) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground-heading">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-foreground-muted">
            If an account can be created for{" "}
            <span className="font-medium">{email}</span>, we&apos;ve sent a
            confirmation link. Open it to finish setting up your FR3SH account.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Back to sign in
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground-heading">
        Create your FR3SH account
      </h2>

      <div className="mt-8 space-y-3">
        <GoogleButton onClick={onGoogle} loading={googleLoading} />
        <Divider />
        <form onSubmit={onSubmit} className="space-y-4">
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

          <div>
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
              describedById="pw-help"
            />
            <div id="pw-help">
              <StrengthMeter password={password} />
            </div>
          </div>

          <PasswordField
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            minLength={8}
          />

          <label className="flex items-start gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <WhatsAppButton />
      </div>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-card px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold text-foreground-heading">
          {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
        </span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}
