import type { NextRequest } from "next/server";
import { updateSession } from "@/shared/lib/supabase/middleware";

// Server-side session refresh + route guard. Client-side checks are secondary.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
