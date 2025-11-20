// app/api/v1/auth/send-reset-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";

const OTP_TTL_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS || "300");
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// Helper: create or reuse a Mongoose model named ResetToken
function getResetTokenModel() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mongoose = require("mongoose");

  if (mongoose.models && mongoose.models.ResetToken) {
    return mongoose.models.ResetToken;
  }

  const ResetTokenSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  });

  return mongoose.model("ResetToken", ResetTokenSchema);
}

/** Send via Brevo HTTP API (fallback) */
async function sendViaBrevoApi({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string; }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not set");

  const senderEmail = (process.env.EMAIL_FROM?.match(/<(.*)>/) || [])[1] || process.env.EMAIL_FROM || "no-reply@localhost";
  const payload = {
    sender: { email: senderEmail, name: process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic" },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey, accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }
  return res.json();
}

/** Try SMTP providers (Zoho -> Brevo SMTP), then fallback to Brevo API */
async function sendWithZohoOrBrevo(to: string, subject: string, html: string, text?: string) {
  // --- Zoho SMTP transport (app password recommended) ---
  const zohoTransporter = (process.env.ZOHO_USER && process.env.ZOHO_PASS)
    ? nodemailer.createTransport({
        host: process.env.ZOHO_HOST || "smtp.zoho.com",
        port: Number(process.env.ZOHO_PORT || 587),
        secure: false,
        auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_PASS },
        tls: { rejectUnauthorized: true },
        socketTimeout: 20000,
        greetingTimeout: 20000,
      })
    : null;

  if (zohoTransporter) {
    try {
      await zohoTransporter.verify();
      const info = await zohoTransporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html, text });
      return { ok: true, provider: "zoho", info };
    } catch (e: any) {
      console.warn("Zoho SMTP failed:", e?.message || e);
      // continue to Brevo
    }
  } else {
    console.warn("Zoho SMTP not configured (ZOHO_USER/ZOHO_PASS missing)");
  }

  // --- Brevo SMTP transport ---
  const brevoTransporter = (process.env.BREVO_USER && process.env.BREVO_PASS)
    ? nodemailer.createTransport({
        host: process.env.BREVO_HOST || "smtp-relay.brevo.com",
        port: Number(process.env.BREVO_PORT || 587),
        secure: false,
        auth: { user: process.env.BREVO_USER, pass: process.env.BREVO_PASS },
        tls: { rejectUnauthorized: true },
        socketTimeout: 20000,
        greetingTimeout: 20000,
      })
    : null;

  if (brevoTransporter) {
    try {
      await brevoTransporter.verify();
      const info = await brevoTransporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html, text });
      return { ok: true, provider: "brevo-smtp", info };
    } catch (e: any) {
      console.warn("Brevo SMTP failed:", e?.message || e, "code:", e?.code);
      // If auth or socket errors OR no BREVO_API_KEY, rethrow; otherwise try API fallback
      const shouldApiFallback = process.env.BREVO_API_KEY && (e?.code === "EAUTH" || e?.code === "ESOCKET" || /ETIMEDOUT|ENOTFOUND|ECONNREFUSED/i.test(String(e)));
      if (!shouldApiFallback) {
        // if it's some other error, we'll still try API fallback when available
      }
    }
  } else {
    console.warn("Brevo SMTP not configured (BREVO_USER/BREVO_PASS missing)");
  }

  // --- Brevo HTTP API fallback (recommended) ---
  try {
    const apiRes = await sendViaBrevoApi({ to, subject, html, text });
    return { ok: true, provider: "brevo-api", info: apiRes };
  } catch (apiErr: any) {
    console.error("Brevo API fallback failed:", apiErr?.message || apiErr);
    throw new Error("All mail providers failed");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // connect to MongoDB
    await mongoDB();

    // check user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      // to avoid user enumeration you might return 200 here. For now keep 404 as before
      return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

    const ResetToken = getResetTokenModel();
    await ResetToken.deleteMany({ email });
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await ResetToken.create({ email, otpHash, expiresAt });

    // prepare email
    const subject = `${process.env.NEXT_PUBLIC_APP_NAME || "Your App"} — Password reset OTP`;
    const html = `
      <p>Hello ${user.name ?? ""},</p>
      <p>Your password reset code is:</p>
      <h2 style="letter-spacing:6px">${otp}</h2>
      <p>This code expires in ${Math.floor(OTP_TTL_SECONDS / 60)} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;
    const text = `Your password reset code is: ${otp}. Expires in ${Math.floor(OTP_TTL_SECONDS / 60)} minutes.`;

    // send (Zoho -> Brevo SMTP -> Brevo API)
    const sendResult = await sendWithZohoOrBrevo(email, subject, html, text);
    console.log("OTP email sent via:", sendResult.provider);

    return NextResponse.json({ ok: true, provider: sendResult.provider });
  } catch (err: any) {
    console.error("send-reset-otp error:", err);
    return NextResponse.json({ error: "Failed to send OTP." }, { status: 500 });
  }
}
