import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns wallet transaction reads. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/wallet/transactions");
}
