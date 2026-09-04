import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return proxyCatalogueGET(req, `/farmers?profileId=${encodeURIComponent(id)}`); }
