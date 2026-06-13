// app/api/v1/auth/send-reset-otp/route.tsx
//
// Refactored: OTP stored in Redis (not MongoDB), email sent via BullMQ queue.
// Falls back to direct send if queue is unavailable.

import { NextRequest, NextResponse } from "next/server";
import { mongoDB }         from "@/shared/lib/db/mongo";
import UserModel           from "@/shared/models/mongodb/user";
import { storeOtp }        from "@/shared/lib/otp";
import { sendMail }        from "@/shared/lib/mailer";
import { checkRateLimit, limiters, getIP } from "@/shared/lib/rateLimit";
import { emailQueue }      from "@/shared/queues/emailQueue";

const OTP_TTL_SECONDS   = Number(process.env.OTP_EXPIRY_SECONDS || "600");
const OTP_EXPIRY_MINUTES = Math.ceil(OTP_TTL_SECONDS / 60);

export async function POST(req: NextRequest) {
  // ── Rate limit: 3 OTP requests / 10 minutes / IP ─────────────────────────
  const ip      = getIP(req);
  const limited = await checkRateLimit(limiters.otp, ip);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { email } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    await mongoDB();

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: "No account found for this email." }, { status: 404 });
    }

    // Generate OTP and store its hash in Redis with TTL
    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    await storeOtp(email, otp);

    // ── Send via BullMQ queue (preferred) — falls back to direct send ─────
    let provider = "queue";
    try {
      await emailQueue.add("passwordResetOtp", {
        type:          "passwordResetOtp",
        to:            email,
        name:          user.name ?? "",
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
      });
    } catch (queueErr: any) {
      // Queue unavailable — send directly so user is never blocked
      console.warn("[send-reset-otp] Queue unavailable, falling back to direct send:", queueErr?.message);
      provider = await sendMail({
        to:      email,
        subject: `${process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"} — Password reset OTP`,
        html: `
          <p>Hello ${user.name ?? ""},</p>
          <p>Your password reset code is:</p>
          <h2 style="letter-spacing:6px;font-size:32px;font-weight:bold">${otp}</h2>
          <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
        text: `Your password reset code is: ${otp}. Expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      });
    }

    console.log("[send-reset-otp] OTP queued/sent via:", provider);
    return NextResponse.json({ ok: true, provider });
  } catch (err: any) {
    console.error("[send-reset-otp] error:", err);
    return NextResponse.json({ success: false, error: "Failed to send OTP." }, { status: 500 });
  }
}
