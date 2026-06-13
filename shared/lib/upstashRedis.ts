/**
 * shared/lib/upstashRedis.ts
 *
 * @upstash/redis HTTP client — works in Next.js serverless API routes without
 * a persistent TCP connection. Use this for: rate limiting, OTP storage, caching.
 */

import { Redis } from "@upstash/redis";

function createClient(): Redis {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars",
    );
  }
  return new Redis({ url, token });
}

// Singleton — reused across hot-reloads in dev
const g = globalThis as typeof globalThis & { _upstash?: Redis };
export const upstash: Redis = g._upstash ?? createClient();
if (process.env.NODE_ENV !== "production") g._upstash = upstash;
