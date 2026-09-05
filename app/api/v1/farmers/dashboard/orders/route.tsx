import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns the farmer order dashboard. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/farmers/dashboard/orders");
}
