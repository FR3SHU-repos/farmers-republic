import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

type Ctx = { params: Promise<{ id: string }> };

// @deprecated Compatibility routes; Go owns pooled group-buy orders under
// /api/v1/community/{id}/orders (membership enforced server-side; the creator
// and the per-user request are forced to the authenticated caller).

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyCatalogueGET(req, `/community/${encodeURIComponent(id)}/orders`);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyCatalogueMutation(req, `/community/${encodeURIComponent(id)}/orders`);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyCatalogueMutation(req, `/community/${encodeURIComponent(id)}/orders`);
}
