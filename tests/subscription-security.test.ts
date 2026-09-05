import assert from "node:assert/strict";
import test from "node:test";

import { rejectUnverifiedSubscriptionEntitlement } from "../shared/lib/security/subscription-entitlement";

test("fabricated payment references cannot grant subscription entitlement", () => {
  const result = rejectUnverifiedSubscriptionEntitlement();

  assert.equal(result.success, false);
  assert.equal(result.code, "payment_verification_required");
  assert.equal("subscribed" in result, false);
  assert.equal("paymentRef" in result, false);
});
