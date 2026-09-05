"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Sprout } from "lucide-react";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";
import { bridgeLogin, reconcileIdentity, safeNext } from "@/shared/lib/auth/gin";
import {
  Divider,
  GoogleButton,
  INPUT_CLS,
  PasswordField,
  WhatsAppButton,
} from "@/shared/components/auth/parts";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const supabase = createAuthBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const oauthError = params.get("error");
  if (oauthError === "oauth_denied") {
    // Rendered once; cleared by navigating.
  }

  async function afterSignIn() {
    const rec = await reconcileIdentity();
    router.replace(rec && !rec.onboardingComplete ? "/onboarding" : next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setNeedsVerify(false);
    const normEmail = email.trim().toLowerCase();

    let { error } = await supabase.auth.signInWithPassword({
      email: normEmail,
      password,
    });

    // Legacy account not yet on Supabase — run the one-time bridge, then retry.
    if (error && /invalid login credentials/i.test(error.message)) {
      const { migrated } = await bridgeLogin(normEmail, password);
      if (migrated) {
        ({ error } = await supabase.auth.signInWithPassword({
          email: normEmail,
          password,
        }));
      }
    }

    setLoading(false);

    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        setNeedsVerify(true);
        toast.error("Please verify your email first.");
        return;
      }
      toast.error("Invalid email or password.");
      return;
    }
    await afterSignIn();
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
      toast.error("Google sign-in is unavailable right now.");
    }
  }

  async function resendVerification() {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    toast[error ? "error" : "success"](
      error ? "Could not resend right now." : "Verification email sent.",
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <BrandPanel />
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-card px-6 py-12 lg:px-12">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground-heading">
            {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
          </span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground-heading">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Sign in to continue to your account
          </p>

          {oauthError === "oauth_denied" && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              Google sign-in was cancelled. Try again or use your email and
              password.
            </p>
          )}

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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground-body">
                    Password
                  </span>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordField
                  label=""
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            {needsVerify && (
              <button
                type="button"
                onClick={resendVerification}
                className="w-full text-center text-xs font-medium text-primary hover:underline"
              >
                Resend verification email
              </button>
            )}

            <WhatsAppButton />
          </div>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-1.5 text-xs text-foreground-muted transition hover:text-foreground-body"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-primary-hover px-12 py-10 text-primary-foreground">
      <div className="flex items-center gap-2.5">
        <Sprout className="h-6 w-6 text-secondary" />
        <span className="text-xl font-semibold tracking-tight">
          {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
        </span>
      </div>
      <div>
        <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight">
          Food that feels
          <br />
          closer to the farm.
        </h1>
        <p className="mt-4 max-w-sm text-base leading-7 text-primary-foreground/70">
          Discover farmers by what they grow, build trust before you buy, and
          keep your kitchen connected to fresh seasonal produce.
        </p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <p className="text-sm font-semibold">Direct from farmers</p>
        <p className="mt-1 text-sm leading-6 text-primary-foreground/70">
          Better discovery for buyers, more predictable demand for farmers.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
