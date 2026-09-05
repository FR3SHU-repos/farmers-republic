"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { MailCheck, Sprout } from "lucide-react";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";

const COOLDOWN = 60;

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const supabase = createAuthBrowserClient();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // If the user is already signed in and verified, move on.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email_confirmed_at) router.replace("/");
    });
  }, [supabase, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (cooldown > 0 || !email) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setCooldown(COOLDOWN);
    toast[error ? "error" : "success"](
      error ? "Could not resend right now." : "Verification email sent.",
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-card px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold text-foreground-heading">
          {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
        </span>
      </div>
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground-heading">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-foreground-muted">
          {email ? (
            <>
              We sent a confirmation link to{" "}
              <span className="font-medium">{email}</span>. Open it to activate
              your account.
            </>
          ) : (
            "Open the confirmation link we emailed you to activate your account."
          )}
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || !email}
          className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
        </button>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-3 w-full text-xs font-medium text-primary hover:underline"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
