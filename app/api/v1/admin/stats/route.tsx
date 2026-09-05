import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns admin dashboard stats. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/admin/stats");
}
