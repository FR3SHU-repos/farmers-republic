import { NextRequest, NextResponse } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";
export function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("farmerId")?.trim();
  if (!id) return NextResponse.json({ success: false, message: "farmerId is required", code: "validation_failed" }, { status: 400 });
  return proxyCatalogueGET(req, `/farmers/${encodeURIComponent(id)}/kyc`);
}
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, message: "Invalid JSON body", code: "bad_request" }, { status: 400 }); }
  const id = typeof body.farmerId === "string" ? body.farmerId.trim() : "";
  if (!id) return NextResponse.json({ success: false, message: "farmerId is required", code: "validation_failed" }, { status: 400 });
  delete body.farmerId;
  const forwarded = new NextRequest(req.url, { method: "POST", headers: req.headers, body: JSON.stringify(body) });
  return proxyCatalogueMutation(forwarded, `/farmers/${encodeURIComponent(id)}/kyc`);
}
