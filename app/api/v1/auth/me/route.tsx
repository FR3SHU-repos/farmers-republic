import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Same-origin compatibility route; Go owns current-user lookup. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/auth/me");
}
