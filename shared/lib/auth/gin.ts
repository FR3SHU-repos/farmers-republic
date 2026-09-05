"use client";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";

/**
 * Call the Gin API with the caller's Supabase access token attached as a
 * Bearer header. Routed through this app's same-origin `/api/v1/*` proxy.
 */
export async function ginFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const supabase = createAuthBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(`/api/v1${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

/** Reconcile the Supabase identity with the canonical user (post sign-up / OAuth). */
export async function reconcileIdentity(): Promise<{
  onboardingComplete: boolean;
  type: string;
} | null> {
  try {
    const res = await ginFetch("/auth/reconcile", { method: "POST", body: "{}" });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      onboardingComplete: Boolean(json?.data?.onboardingComplete),
      type: json?.data?.type ?? "",
    };
  } catch {
    return null;
  }
}

/** The one-time legacy-account migration bridge. */
export async function bridgeLogin(
  email: string,
  password: string,
): Promise<{ migrated: boolean }> {
  try {
    const res = await fetch("/api/v1/auth/bridge/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { migrated: false };
    const json = await res.json();
    return { migrated: Boolean(json?.data?.migrated ?? json?.migrated) };
  } catch {
    return { migrated: false };
  }
}

/** Safe post-login redirect: same-origin path only. */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return "/";
  }
  return next;
}
