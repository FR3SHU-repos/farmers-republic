"use client";

import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/**
 * Browser Supabase client for auth (sign-in/up, OAuth, password reset). Uses
 * PKCE and stores the session in `sb-*` cookies via @supabase/ssr. Storage
 * uploads still use the plain client in `./client`.
 */
export function createAuthBrowserClient() {
  return createBrowserClient(URL || "https://placeholder.supabase.co", KEY || "placeholder-anon-key");
}

/** True when Supabase Auth is configured for this deployment. */
export const supabaseAuthConfigured = Boolean(URL && KEY);
