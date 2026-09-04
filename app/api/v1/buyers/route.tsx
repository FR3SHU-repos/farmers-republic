import { NextRequest, NextResponse } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns customer profiles and addresses. */
export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const profileID = request.nextUrl.searchParams.get("profileId")?.trim();
  if (id) return proxyCatalogueGET(request, `/customers/${encodeURIComponent(id)}`);
  if (profileID) return proxyCatalogueGET(request, "/customers/me");
  return NextResponse.json({ success: false, message: "Either id or profileId query parameter is required", code: "validation_failed" }, { status: 400 });
}
export function POST(request: NextRequest) { return proxyCatalogueMutation(request, "/customers"); }
export function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ success: false, message: "id is required", code: "validation_failed" }, { status: 400 });
  return proxyCatalogueMutation(request, `/customers/${encodeURIComponent(id)}`);
}
