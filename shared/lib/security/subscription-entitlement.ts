export const SUBSCRIPTION_VERIFICATION_ERROR = {
  success: false,
  message: "Subscription activation is temporarily unavailable while payment verification is being completed",
  code: "payment_verification_required",
} as const;

/**
 * Paid entitlement must remain fail-closed until a provider-signed payment or
 * an idempotently processed, verified webhook is available server-side.
 */
export function rejectUnverifiedSubscriptionEntitlement() {
  return SUBSCRIPTION_VERIFICATION_ERROR;
}
