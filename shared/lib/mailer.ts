/**
 * shared/lib/mailer.ts
 *
 * Reusable email sender.
 * Provider chain: Zoho SMTP → Brevo SMTP → Brevo HTTP API.
 * Used by both API routes (direct fallback) and email workers (primary path).
 */

import nodemailer from "nodemailer";

export type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

// ── Brevo HTTP API fallback ───────────────────────────────────────────────────
async function sendViaBrevoApi(opts: MailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not set");

  const senderEmail =
    (process.env.EMAIL_FROM?.match(/<(.+)>/) || [])[1] ||
    process.env.EMAIL_FROM ||
    "no-reply@localhost";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key":      apiKey,
      accept:         "application/json",
    },
    body: JSON.stringify({
      sender:       { email: senderEmail, name: process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic" },
      to:           [{ email: opts.to }],
      subject:      opts.subject,
      htmlContent:  opts.html,
      textContent:  opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }
}

// ── Primary sender ────────────────────────────────────────────────────────────
export async function sendMail(opts: MailOptions): Promise<string> {
  // 1. Zoho SMTP
  if (process.env.ZOHO_USER && process.env.ZOHO_PASS) {
    const transport = nodemailer.createTransport({
      host:  process.env.ZOHO_HOST  || "smtp.zoho.com",
      port:  Number(process.env.ZOHO_PORT || 587),
      secure: false,
      auth:  { user: process.env.ZOHO_USER, pass: process.env.ZOHO_PASS },
      tls:   { rejectUnauthorized: true },
      socketTimeout:   20_000,
      greetingTimeout: 20_000,
    });
    try {
      await transport.sendMail({ from: process.env.EMAIL_FROM, ...opts });
      return "zoho";
    } catch (err: any) {
      console.warn("[Mailer] Zoho SMTP failed:", err?.message);
    }
  }

  // 2. Brevo SMTP
  if (process.env.BREVO_USER && process.env.BREVO_PASS) {
    const transport = nodemailer.createTransport({
      host:  process.env.BREVO_HOST  || "smtp-relay.brevo.com",
      port:  Number(process.env.BREVO_PORT || 587),
      secure: false,
      auth:  { user: process.env.BREVO_USER, pass: process.env.BREVO_PASS },
      tls:   { rejectUnauthorized: true },
      socketTimeout:   20_000,
      greetingTimeout: 20_000,
    });
    try {
      await transport.sendMail({ from: process.env.EMAIL_FROM, ...opts });
      return "brevo-smtp";
    } catch (err: any) {
      console.warn("[Mailer] Brevo SMTP failed:", err?.message);
    }
  }

  // 3. Brevo HTTP API
  await sendViaBrevoApi(opts);
  return "brevo-api";
}
