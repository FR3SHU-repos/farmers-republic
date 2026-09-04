import { NextRequest } from "next/server";
import { proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Same-origin compatibility route; Go owns credential validation and session issuance. */
export function POST(request: NextRequest) {
  return proxyCatalogueMutation(request, "/auth/login");
}
