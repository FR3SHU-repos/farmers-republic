import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

type ParamsContext = { params: Promise<{ id: string }> };

/**
 * @deprecated Compatibility route; Go owns order-detail reads (GET
 * /api/v1/orders/{id}, Admin is already an allowed viewer) and the admin
 * override (PATCH /api/v1/admin/orders/{id} — a blunt $set of status /
 * paymentStatus / adminNote, no state-machine or stock side effects).
 */
export async function GET(_req: NextRequest, context: ParamsContext) {
  const { id } = await context.params;
  return proxyCatalogueGET(_req, `/orders/${encodeURIComponent(id)}`);
}

export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await context.params;
  return proxyCatalogueMutation(req, `/admin/orders/${encodeURIComponent(id)}`);
}
