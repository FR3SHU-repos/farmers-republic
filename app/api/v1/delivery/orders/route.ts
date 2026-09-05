import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility URL; authenticated delivery-order reads are Go-owned. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/delivery/orders");
}
