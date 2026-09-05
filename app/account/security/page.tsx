"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";

import type { UserIdentity } from "@supabase/supabase-js";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";
import { ginFetch } from "@/shared/lib/auth/gin";

type AuditRow = { event: string; createdAt: string; provider?: string };

export default function SecurityPage() {
  const router = useRouter();
  const supabase = createAuthBrowserClient();

  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [busy, setBusy] = useState(false);

  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
  const hasGoogle = identities.some((i) => i.provider === "google");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/account/security");
        return;
      }
      const { data } = await supabase.auth.getUserIdentities();
      setIdentities(data?.identities ?? []);
      const res = await ginFetch("/account/security/audit").catch(() => null);
      if (res?.ok) {
        const j = await res.json();
        setEvents((j?.data?.events ?? []) as AuditRow[]);
      }
    })();
  }, [router, supabase]);

  async function linkGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account/security` },
    });
    if (error) {
      setBusy(false);
      toast.error("Could not start linking. Try again.");
    }
  }

  async function unlinkGoogle() {
    const target = identities.find((i) => i.provider === "google");
    if (!target) return;
    setBusy(true);
    const { error } = await supabase.auth.unlinkIdentity(target);
    setBusy(false);
    if (error) {
      toast.error("Could not unlink Google.");
      return;
    }
    setIdentities((xs) => xs.filter((i) => i.provider !== "google"));
    await ginFetch("/account/security/audit", {
      method: "POST",
      body: JSON.stringify({ event: "identity_unlinked" }),
    }).catch(() => {});
    toast.success("Google unlinked.");
  }

  async function signOutEverywhere() {
    setBusy(true);
    await ginFetch("/account/sessions/revoke-all", { method: "POST" }).catch(
      () => {},
    );
    await supabase.auth.signOut({ scope: "global" });
    router.replace("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground-heading">
          Account security
        </h1>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground-heading">
          Connected sign-in methods
        </h2>
        <ul className="mt-3 space-y-2">
          {identities.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              <span className="capitalize">{i.provider}</span>
              {i.provider === "google" && identities.length > 1 && (
                <button
                  onClick={unlinkGoogle}
                  disabled={busy}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Unlink
                </button>
              )}
            </li>
          ))}
        </ul>
        {googleEnabled && !hasGoogle && (
          <button
            onClick={linkGoogle}
            disabled={busy}
            className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-card"
          >
            Link a Google account
          </button>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground-heading">Password</h2>
        <button
          onClick={() => router.push("/forgot-password")}
          className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-card"
        >
          Change password
        </button>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground-heading">Sessions</h2>
        <button
          onClick={signOutEverywhere}
          disabled={busy}
          className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          Sign out of all devices
        </button>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground-heading">
          Recent security activity
        </h2>
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border text-sm">
          {events.length === 0 && (
            <li className="px-4 py-3 text-foreground-muted">No recent events.</li>
          )}
          {events.map((ev, i) => (
            <li key={i} className="flex justify-between px-4 py-3">
              <span>{ev.event.replace(/_/g, " ")}</span>
              <span className="text-foreground-muted">
                {new Date(ev.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
