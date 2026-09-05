"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Sprout } from "lucide-react";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";
import { ginFetch } from "@/shared/lib/auth/gin";
import {
  PasswordField,
  StrengthMeter,
  passwordScore,
} from "@/shared/components/auth/parts";

function ResetInner() {
  const router = useRouter();
  const supabase = createAuthBrowserClient();

  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // @supabase/ssr detects the recovery token in the URL and emits a
  // PASSWORD_RECOVERY event with a temporary session.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValid(true);
      }
      setReady(true);
    });
    // Also check immediately in case the event already fired.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValid(true);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (passwordScore(password).score < 1) {
      toast.error("Choose a stronger password.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSaving(false);
      toast.error("This reset link is invalid or has expired.");
      return;
    }
    // Record the security event and sign out other sessions.
    await ginFetch("/account/security/audit", {
      method: "POST",
      body: JSON.stringify({ event: "password_changed" }),
    }).catch(() => {});
    await ginFetch("/account/sessions/revoke-all", { method: "POST" }).catch(
      () => {},
    );
    await supabase.auth.signOut();
    toast.success("Password updated. Please sign in.");
    router.replace("/login");
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
          Set a new password
        </h2>

        {!ready ? (
          <p className="mt-6 text-sm text-foreground-muted">Checking your link…</p>
        ) : !valid ? (
          <div className="mt-6">
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              This password reset link is invalid or has expired. Request a new
              one.
            </p>
            <button
              type="button"
              onClick={() => router.replace("/forgot-password")}
              className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Request a new link
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <PasswordField
                label="New password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                minLength={8}
              />
              <StrengthMeter password={password} />
            </div>
            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              minLength={8}
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}
