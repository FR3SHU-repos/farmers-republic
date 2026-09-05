// app/api/v1/orders/[id]/route.tsx

import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

type ParamsContext = { params: { id: string } | Promise<{ id: string }> };

// GET — deprecated compatibility route; Go owns order-detail reads.
export async function GET(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  return proxyCatalogueGET(req, `/orders/${encodeURIComponent(id)}`);
}

/**
 * PATCH — deprecated compatibility route; Go owns the order status state
 * machine (PATCH /api/v1/orders/{id}). Go drives the transition, moves stock
 * (delivered -> consume; cancelled/returned -> release) transactionally, and
 * upserts the delivery-earning record on a delivered transition. Best-effort
 * BullMQ email/notification jobs from the old handler are not reproduced — the
 * notification worker is a stub and the marketplace's own workers still consume
 * the `orders`/`emailQueue` events written elsewhere.
 */
export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  return proxyCatalogueMutation(req, `/orders/${encodeURIComponent(id)}`);
}
