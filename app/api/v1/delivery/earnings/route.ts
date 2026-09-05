// app/api/v1/delivery/earnings/route.ts

import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/**
 * @deprecated Compatibility routes; Go owns delivery earnings.
 * - GET  /api/v1/delivery/earnings   authenticated, self/role-scoped read (the
 *   legacy route trusted a client-supplied deliveryPersonId).
 * - POST /api/v1/delivery/earnings   manual earning record — upsert keyed on
 *   orderId; restricted to Logistics Provider / elevated roles.
 */
export function GET(req: NextRequest) {
  return proxyCatalogueGET(req, "/delivery/earnings");
}

export function POST(req: NextRequest) {
  return proxyCatalogueMutation(req, "/delivery/earnings");
}
