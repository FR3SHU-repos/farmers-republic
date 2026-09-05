// app/api/v1/farmers/orders/[id]/route.ts

import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

type ParamsContext = { params: { id: string } | Promise<{ id: string }> };

// GET — deprecated compatibility route; Go owns this read, resolving the
// caller's own farmer profile server-side instead of trusting ?farmerId=.
export async function GET(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  return proxyCatalogueGET(req, `/farmers/orders/${encodeURIComponent(id)}`);
}

// PATCH — deprecated compatibility route; Go owns per-item farmer updates
// (PATCH /api/v1/farmers/orders/{id}), resolving the farmer from the caller's
// own profile unless an elevated role passes ?farmerId=.
export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  return proxyCatalogueMutation(
    req,
    `/farmers/orders/${encodeURIComponent(id)}${req.nextUrl.search}`,
  );
}
