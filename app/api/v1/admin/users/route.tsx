import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns the admin user directory. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/admin/users");
}
