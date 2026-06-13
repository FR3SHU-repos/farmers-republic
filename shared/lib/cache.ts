/**
 * shared/lib/cache.ts
 *
 * Redis-backed cache helpers using @upstash/redis.
 * Fail-safe: all operations catch errors and fall back gracefully.
 *
 * Cache key layout:
 *   products:list:{queryHash}   TTL 60 s
 *   products:detail:{id}        TTL 120 s
 *   categories:all              TTL 3600 s
 */

import crypto from "crypto";
import { upstash } from "./upstashRedis";

export const CacheTTL = {
  productList:   60,
  productDetail: 120,
  categories:    3600,
} as const;

export const CacheKeys = {
  productList:   (hash: string) => `products:list:${hash}`,
  productDetail: (id: string)   => `products:detail:${id}`,
  categoriesAll: "categories:all",
} as const;

/** Stable hash of a query-params object for use as a cache key suffix. */
export function queryHash(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("md5").update(sorted).digest("hex").slice(0, 12);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await upstash.get<string>(key);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T);
  } catch (err) {
    console.error("[Cache] get error:", (err as Error).message);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await upstash.set(key, JSON.stringify(value), { ex: ttl });
  } catch (err) {
    console.error("[Cache] set error:", (err as Error).message);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await upstash.del(...keys);
  } catch (err) {
    console.error("[Cache] del error:", (err as Error).message);
  }
}

/**
 * Invalidate all product list caches.
 * Uses KEYS pattern — fine for moderate key counts (< 10 k).
 * For very large deployments, switch to tag-based invalidation.
 */
export async function invalidateProductListCache(): Promise<void> {
  try {
    const keys = await upstash.keys("products:list:*");
    if (keys.length > 0) await upstash.del(...keys);
  } catch (err) {
    console.error("[Cache] invalidate product list error:", (err as Error).message);
  }
}
