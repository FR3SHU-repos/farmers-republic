import { NextRequest, NextResponse } from "next/server";

import { apiBase, apiURL } from "./url";
const BASE = apiBase(process.env.NEXT_PUBLIC_CATALOGUE_API_BASE_URL);

/** Temporary compatibility path for callers still using the marketplace origin. */
export async function proxyCatalogueGET(request: NextRequest, path: string): Promise<NextResponse> {
  const target = new URL(apiURL(BASE, path));
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));
  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json", "X-Request-ID": request.headers.get("x-request-id") ?? crypto.randomUUID() },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const response = new NextResponse(await upstream.text(), { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" } });
    for (const name of ["x-cache", "x-request-id"]) { const value = upstream.headers.get(name); if (value) response.headers.set(name, value); }
    response.headers.set("Deprecation", "true");
    response.headers.set("Link", `<${target.origin}/api/v1${path}>; rel=\"successor-version\"`);
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Catalogue service is unavailable", code: "catalogue_unavailable" }, { status: 503 });
  }
}

export async function proxyCatalogueMutation(request: NextRequest, path: string): Promise<NextResponse> {
  const target = apiURL(BASE, path);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    "X-Request-ID": request.headers.get("x-request-id") ?? crypto.randomUUID(),
  };
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  const idempotencyKey = request.headers.get("idempotency-key");
  const ifMatch = request.headers.get("if-match");
  if (cookie) headers.Cookie = cookie;
  if (authorization) headers.Authorization = authorization;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  if (ifMatch) headers["If-Match"] = ifMatch;
  try {
    const upstream = await fetch(target, { method: request.method, headers, body: await request.text(), cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const response = new NextResponse(await upstream.text(), { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" } });
    response.headers.set("Deprecation", "true");
    response.headers.set("Link", `<${target}>; rel=\"successor-version\"`);
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Catalogue service is unavailable", code: "catalogue_unavailable" }, { status: 503 });
  }
}
