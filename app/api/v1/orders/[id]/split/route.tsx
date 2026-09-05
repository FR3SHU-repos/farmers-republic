import { NextRequest } from "next/server";
import { proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/**
 * @deprecated Compatibility route; Go owns the per-farmer sub-order split
 * (POST /api/v1/orders/{id}/split). Idempotent — existing sub-orders are
 * returned unchanged.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyCatalogueMutation(req, `/orders/${encodeURIComponent(id)}/split`);
}
