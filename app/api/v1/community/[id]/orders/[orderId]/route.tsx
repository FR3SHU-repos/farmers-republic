import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

type Ctx = { params: Promise<{ id: string; orderId: string }> };

// @deprecated Compatibility routes; Go owns a single group-buy pool at
// /api/v1/community/{id}/orders/{orderId} (edit/delete restricted to the pool
// creator or the community-group admin).

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id, orderId } = await ctx.params;
  return proxyCatalogueGET(req, `/community/${encodeURIComponent(id)}/orders/${encodeURIComponent(orderId)}`);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, orderId } = await ctx.params;
  return proxyCatalogueMutation(req, `/community/${encodeURIComponent(id)}/orders/${encodeURIComponent(orderId)}`);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id, orderId } = await ctx.params;
  return proxyCatalogueMutation(req, `/community/${encodeURIComponent(id)}/orders/${encodeURIComponent(orderId)}`);
}
