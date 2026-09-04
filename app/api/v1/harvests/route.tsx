import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns harvest announcements. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/harvests");
}
export function POST(request: NextRequest) {
  return proxyCatalogueMutation(request, "/harvests");
}
