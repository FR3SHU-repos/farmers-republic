// app/api/v1/auth/verify-reset-otp/route.tsx
//
// Refactored: OTP verification uses Redis (via shared/lib/otp.ts).
// MongoDB ResetToken model is no longer used.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { mongoDB }    from "@/shared/lib/db/mongo";
import UserModel      from "@/shared/models/mongodb/user";
import { verifyOtp }  from "@/shared/lib/otp";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body ?? {};

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // ── Verify OTP against Redis ───────────────────────────────────────────
    const otpError = await verifyOtp(email, String(otp));
    if (otpError) {
      const status = otpError.includes("Too many") ? 429
                   : otpError.includes("expired")  ? 400
                   : otpError.includes("Invalid")  ? 401
                   : 404;
      return NextResponse.json({ error: otpError }, { status });
    }

    // ── OTP valid — reset password ─────────────────────────────────────────
    await mongoDB();

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return NextResponse.json({ ok: true, message: "Password reset successfully." });
  } catch (err: any) {
    console.error("[verify-reset-otp] error:", err);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
