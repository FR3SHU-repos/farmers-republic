import { NextRequest } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns community groups. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/community");
}
export function POST(request: NextRequest) {
  return proxyCatalogueMutation(request, "/community");
}
