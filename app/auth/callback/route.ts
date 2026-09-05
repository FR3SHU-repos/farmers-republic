import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

/**
 * OAuth / email-confirmation callback. Exchanges the PKCE code for a session,
 * then reconciles the identity with the Gin API and routes on.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const rawNext = url.searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
      ? rawNext
      : "/";
  const origin = url.origin;

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=oauth_denied`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_denied`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_denied`);
  }

  // Reconcile with the canonical user (creates the record on first sight).
  let onboardingComplete = true;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? origin}/api/v1/auth/reconcile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: "{}",
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      onboardingComplete = Boolean(json?.data?.onboardingComplete);
    }
  } catch {
    // Non-fatal: the middleware / onboarding page will re-check.
  }

  const dest = onboardingComplete ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${dest}`);
}
