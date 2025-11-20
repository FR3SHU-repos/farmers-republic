// app/api/v1/auth/verify-reset-otp/route.tsx

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// helper to reuse ResetToken model (same as your send route)
function getResetTokenModel() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mongoose = require("mongoose");
  if (mongoose.models && mongoose.models.ResetToken) return mongoose.models.ResetToken;

  const ResetTokenSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  });

  return mongoose.model("ResetToken", ResetTokenSchema);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body ?? {};

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // basic password policy
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await mongoDB();

    const ResetToken = getResetTokenModel();

    // find the token for this email
    const tokenDoc = await ResetToken.findOne({ email: email.toLowerCase() });
    if (!tokenDoc) {
      return NextResponse.json({ error: "No reset request found for this email." }, { status: 404 });
    }

    // check expiry
    if (tokenDoc.expiresAt.getTime() < Date.now()) {
      // cleanup expired token
      await ResetToken.deleteMany({ email });
      return NextResponse.json({ error: "OTP expired. Please request a new code." }, { status: 400 });
    }

    // limit attempts
    if (tokenDoc.attempts >= 5) {
      await ResetToken.deleteMany({ email });
      return NextResponse.json({ error: "Too many failed attempts. Request a new OTP." }, { status: 429 });
    }

    // compare OTP
    const isMatch = await bcrypt.compare(String(otp), tokenDoc.otpHash);
    if (!isMatch) {
      tokenDoc.attempts = (tokenDoc.attempts || 0) + 1;
      await tokenDoc.save();
      return NextResponse.json({ error: "Invalid OTP." }, { status: 401 });
    }

    // OTP matched — update user password
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // remove token to avoid reuse for non-existent users
      await ResetToken.deleteMany({ email });
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = newHash;
    await user.save();

    // clean up tokens
    await ResetToken.deleteMany({ email });

    return NextResponse.json({ ok: true, message: "Password reset successfully." });
  } catch (err: any) {
    console.error("reset-password error:", err);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}

