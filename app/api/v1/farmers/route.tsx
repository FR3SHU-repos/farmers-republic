import { NextRequest, NextResponse } from "next/server";

import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

// Temporary same-origin compatibility proxy. Farmer persistence is owned by Go.
export function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (id) return proxyCatalogueGET(req, `/farmers/${encodeURIComponent(id)}/private`);
  return proxyCatalogueGET(req, "/farmers");
}
export function POST(req: NextRequest) { return proxyCatalogueMutation(req, "/farmers"); }
export function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ success: false, message: "id is required", code: "validation_failed" }, { status: 400 });
  return proxyCatalogueMutation(req, `/farmers/${encodeURIComponent(id)}`);
}
