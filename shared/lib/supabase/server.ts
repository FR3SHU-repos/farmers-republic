import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/**
 * Server Supabase client bound to the request cookie store. Use in Server
 * Components, Route Handlers and Server Actions to read the session and to
 * relay the access token to the Gin API.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render — cookies are read-only here;
          // the middleware refresh handles rotation.
        }
      },
    },
  });
}

/** The current access token, or null. For `Authorization: Bearer` to Gin. */
export async function getAccessToken(): Promise<string | null> {
  if (!URL || !KEY) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export const supabaseAuthConfigured = Boolean(URL && KEY);
