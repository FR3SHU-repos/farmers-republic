import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility proxy. Marketplace code calls Go directly. */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyCatalogueGET(req, `/products/by-farmer/${encodeURIComponent(id)}`);
}
