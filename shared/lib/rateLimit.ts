/**
 * shared/lib/rateLimit.ts
 *
 * Sliding-window rate limiters backed by Upstash Redis.
 * Fail-open: if Redis is unreachable, requests are allowed through (logged).
 *
 * Usage in an API route:
 *   const limited = await checkRateLimit(limiters.login, getIP(req));
 *   if (limited) return limited; // 429 response
 */

import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import { upstash } from "./upstashRedis";

// ── Pre-configured limiters ──────────────────────────────────────────────────

export const limiters = {
  /** 5 attempts / minute / IP */
  login: new Ratelimit({
    redis: upstash,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: false,
    prefix: "rl:login",
  }),

  /** 3 registrations / minute / IP */
  register: new Ratelimit({
    redis: upstash,
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: false,
    prefix: "rl:register",
  }),

  /** 3 OTP requests / 10 minutes / identifier (email or IP) */
  otp: new Ratelimit({
    redis: upstash,
    limiter: Ratelimit.slidingWindow(3, "10 m"),
    analytics: false,
    prefix: "rl:otp",
  }),

  /** 20 requests / minute / user or IP */
  orderApis: new Ratelimit({
    redis: upstash,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: false,
    prefix: "rl:order",
  }),

  /** 10 products created / hour / farmer */
  productCreate: new Ratelimit({
    redis: upstash,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: false,
    prefix: "rl:product-create",
  }),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract the best available IP from request headers. */
export function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

/**
 * Run the limiter and return a 429 NextResponse if the limit is exceeded.
 * Returns null when the request is allowed to proceed.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<NextResponse | null> {
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset":     String(reset),
            "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }
    return null;
  } catch (err) {
    // Fail-open: Redis down → allow the request, log the error
    console.error("[RateLimit] check failed (fail-open):", (err as Error).message);
    return null;
  }
}
