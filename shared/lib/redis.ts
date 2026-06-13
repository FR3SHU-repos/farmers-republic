/**
 * shared/lib/redis.ts
 *
 * BullMQ connection options parsed from REDIS_URL.
 * BullMQ creates its own ioredis connections internally; we supply RedisOptions.
 *
 * For rate limiting / OTP / caching in serverless API routes, use upstashRedis.ts.
 */

import type { RedisOptions } from "ioredis";

function parseRedisUrl(): RedisOptions {
  const raw = process.env.REDIS_URL;
  if (!raw) throw new Error("REDIS_URL is not set");

  // Accept both redis:// and rediss:// — Upstash always requires TLS
  const normalized = raw.startsWith("redis://")
    ? raw.replace("redis://", "https://")
    : raw.replace("rediss://", "https://");

  const parsed   = new URL(normalized);
  const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;

  return {
    host:                 parsed.hostname,
    port:                 Number(parsed.port) || 6379,
    username:             parsed.username || "default",
    password,
    tls:                  {},          // TLS required for Upstash
    maxRetriesPerRequest: null,        // BullMQ requirement
    enableReadyCheck:     false,       // BullMQ requirement
    connectTimeout:       10_000,
  };
}

/**
 * Returns BullMQ-compatible RedisOptions each time it is called.
 * BullMQ Queue and Worker each create their own internal ioredis connections;
 * call this function once per Queue / Worker instance.
 */
export function newBullConnection(): RedisOptions {
  return parseRedisUrl();
}
