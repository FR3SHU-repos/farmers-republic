import { NextRequest } from "next/server";
import { proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";

/** @deprecated Compatibility route; Go owns user profile updates. */
export function PATCH(request: NextRequest) {
  return proxyCatalogueMutation(request, "/users/me");
}
