import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** Routes that never require a session. */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/auth/",
  "/forgot-password",
  "/reset-password",
  "/policies",
  "/privacy",
  "/terms",
  "/support",
  "/data-deletion",
  "/content-rights",
];

/** Route prefixes that DO require an authenticated session. */
const PROTECTED_PREFIXES = ["/profile", "/orders", "/wallet", "/onboarding", "/account", "/admin"];

function isSafeNext(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

/**
 * Refresh the Supabase session on every request (rotating the refresh token)
 * and gate protected routes server-side. Returns the response to send.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!URL || !KEY) return response; // Supabase not configured — legacy path elsewhere.

  const supabase = createServerClient(URL, KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !isPublic && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (isSafeNext(pathname)) url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
