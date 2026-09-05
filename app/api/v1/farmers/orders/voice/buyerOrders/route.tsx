// app/api/v1/farmers/orders/voice/buyerOrders/route.ts

import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns buyer order-history reads. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/orders");
}

/**
 * @deprecated Compatibility route; Go owns checkout.
 *
 * `POST /api/v1/orders` (Go) recomputes every total server-side, atomically
 * reserves stock over the product counters, and writes the order as
 * status=pending / paymentStatus=unpaid. No payment is simulated. Idempotent
 * on the Idempotency-Key header.
 */
export function POST(request: NextRequest) {
  return proxyCatalogueMutation(request, "/orders");
}
