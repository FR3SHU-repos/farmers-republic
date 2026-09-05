import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns farmer analytics. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/analytics/farmer");
}
