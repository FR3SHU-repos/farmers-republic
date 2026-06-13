/**
 * shared/lib/otp.ts
 *
 * OTP storage and verification backed by Upstash Redis.
 * Replaces the MongoDB ResetToken model.
 *
 * Key layout:
 *   reset_otp:{email}           → { hash, expiresAt } (SHA-256 of the OTP)
 *   reset_otp_attempts:{email}  → attempt counter
 *
 * The raw OTP is never stored — only its SHA-256 hash.
 */

import crypto from "crypto";
import { upstash } from "./upstashRedis";

const OTP_TTL     = Number(process.env.OTP_EXPIRY_SECONDS || "600"); // default 10 min
const MAX_ATTEMPTS = 5;

const otpKey      = (email: string) => `reset_otp:${email.toLowerCase()}`;
const attemptsKey = (email: string) => `reset_otp_attempts:${email.toLowerCase()}`;

type OtpEntry = { hash: string; expiresAt: number };

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Hash and store the OTP in Redis. Resets any previous OTP and attempt counter. */
export async function storeOtp(email: string, otp: string): Promise<void> {
  const entry: OtpEntry = {
    hash:      sha256(otp),
    expiresAt: Date.now() + OTP_TTL * 1000,
  };
  await upstash.set(otpKey(email), JSON.stringify(entry), { ex: OTP_TTL });
  await upstash.del(attemptsKey(email)); // reset attempts on fresh OTP
}

/**
 * Verify an OTP against the stored hash.
 * Returns null on success, or an error string describing the failure.
 * Deletes both keys from Redis on successful verification.
 */
export async function verifyOtp(email: string, otp: string): Promise<string | null> {
  const raw = await upstash.get<string>(otpKey(email));
  if (!raw) return "No reset request found or OTP expired.";

  const entry: OtpEntry = typeof raw === "string" ? JSON.parse(raw) : (raw as OtpEntry);

  if (Date.now() > entry.expiresAt) {
    await upstash.del(otpKey(email));
    return "OTP expired. Please request a new code.";
  }

  const attempts = Number((await upstash.get<string>(attemptsKey(email))) ?? 0);
  if (attempts >= MAX_ATTEMPTS) {
    await upstash.del(otpKey(email));
    await upstash.del(attemptsKey(email));
    return "Too many failed attempts. Request a new OTP.";
  }

  if (sha256(String(otp)) !== entry.hash) {
    await upstash.incr(attemptsKey(email));
    await upstash.expire(attemptsKey(email), OTP_TTL);
    return "Invalid OTP.";
  }

  // ✅ Correct — clean up and return success
  await upstash.del(otpKey(email));
  await upstash.del(attemptsKey(email));
  return null;
}
