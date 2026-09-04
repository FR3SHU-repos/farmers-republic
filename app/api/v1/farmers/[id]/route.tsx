import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, context: Context) { const { id } = await context.params; return proxyCatalogueGET(req, `/farmers/${encodeURIComponent(id)}`); }
export async function PATCH(req: NextRequest, context: Context) { const { id } = await context.params; return proxyCatalogueMutation(req, `/farmers/${encodeURIComponent(id)}`); }
