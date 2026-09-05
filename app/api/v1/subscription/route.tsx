import { NextRequest, NextResponse } from "next/server";
import { proxyCatalogueGET, proxyCatalogueMutation } from "@/shared/lib/api/catalogue-proxy";
import { rejectUnverifiedSubscriptionEntitlement } from "@/shared/lib/security/subscription-entitlement";

/** @deprecated Compatibility route; Go owns the subscription status read. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/subscription");
}

/**
 * Activation stays fail-closed here: there is no payment provider, so a
 * client-supplied payment reference can never grant an entitlement. Go does not
 * implement this endpoint.
 */
export function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  console.warn(JSON.stringify({
    level: "warn",
    event: "subscription_entitlement_rejected",
    reason: "provider_verification_unavailable",
    requestId,
  }));
  return NextResponse.json(rejectUnverifiedSubscriptionEntitlement(), {
    status: 503,
    headers: { "X-Request-ID": requestId, "Retry-After": "3600" },
  });
}

/** @deprecated Compatibility route; Go owns subscription cancellation. */
export function DELETE(request: NextRequest) {
  return proxyCatalogueMutation(request, "/subscription");
}
