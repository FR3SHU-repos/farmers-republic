import { NextRequest, NextResponse } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Admin UI now calls the canonical catalogue client. */
export function GET(request: NextRequest) { return proxyCatalogueGET(request, "/products"); }

/** @deprecated Compatibility proxy; performs no local database write. */
export async function PATCH(request: NextRequest) {
  const body = await request.clone().json().catch(() => null) as { productId?: string } | null;
  if (!body?.productId) return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
  return proxyCatalogueMutation(request, `/products/${encodeURIComponent(body.productId)}`);
}
