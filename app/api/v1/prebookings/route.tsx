import { NextRequest } from "next/server";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/prebookings");
}
