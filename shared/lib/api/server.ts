import { NextRequest } from "next/server";

import { apiBase, apiURL } from "./url";

const BASE = apiBase(
  process.env.NEXT_PUBLIC_CATALOGUE_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL,
);

export class GoAPIError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Server-only request helper. It forwards identity but never logs tokens. */
export async function goAPIData<T>(request: NextRequest, path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  if (cookie) headers.Cookie = cookie;
  if (authorization) headers.Authorization = authorization;
  const response = await fetch(apiURL(BASE, path), {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    throw new GoAPIError(body?.message ?? "Go API request failed", response.status);
  }
  return body.data as T;
}
