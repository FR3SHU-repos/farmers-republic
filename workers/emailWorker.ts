/**
 * workers/emailWorker.ts
 *
 * Long-running BullMQ worker that processes the "email" queue.
 * Start with:  npm run worker:email
 *
 * Each job retries up to 3 times with exponential backoff.
 * A failed job does NOT crash the worker — errors are logged and the job
 * is kept in the "failed" set for inspection.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Worker, Job } from "bullmq";
import { newBullConnection } from "../shared/lib/redis";
import { sendMail } from "../shared/lib/mailer";
import type { EmailJobData } from "../shared/queues/emailQueue";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic";

async function processEmail(job: Job<EmailJobData>): Promise<void> {
  const data = job.data;
  console.log(`[EmailWorker] Job ${job.id} — type: ${data.type}`);

  if (data.type === "passwordResetOtp") {
    await sendMail({
      to:      data.to,
      subject: `${APP_NAME} — Password reset OTP`,
      html: `
        <p>Hello ${data.name || ""},</p>
        <p>Your password reset code is:</p>
        <h2 style="letter-spacing:6px;font-size:32px;font-weight:bold">${data.otp}</h2>
        <p>This code expires in <strong>${data.expiryMinutes} minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
      text: `Your password reset code is: ${data.otp}. Expires in ${data.expiryMinutes} minutes.`,
    });

  } else if (data.type === "orderConfirmation") {
    const rows = data.items
      .map((i) => `<li>${i.name} × ${i.qty} — ₹${i.price}</li>`)
      .join("");
    await sendMail({
      to:      data.to,
      subject: `Order Confirmed — #${data.orderId}`,
      html: `
        <p>Hello ${data.name},</p>
        <p>Your order <strong>#${data.orderId}</strong> has been confirmed.</p>
        <ul>${rows}</ul>
        <p>Total: <strong>₹${data.total}</strong></p>
        <p>Thank you for shopping with ${APP_NAME}!</p>
      `,
    });

  } else if (data.type === "deliveryConfirmation") {
    await sendMail({
      to:      data.to,
      subject: `Delivered — Order #${data.orderId}`,
      html: `
        <p>Hello ${data.name},</p>
        <p>Your order <strong>#${data.orderId}</strong> was delivered on ${data.deliveredAt}.</p>
        <p>Thank you for shopping with ${APP_NAME}!</p>
      `,
    });

  } else if (data.type === "generic") {
    await sendMail({ to: data.to, subject: data.subject, html: data.html, text: data.text });

  } else {
    console.warn(`[EmailWorker] Unknown job type: ${(data as any).type}`);
  }
}

const worker = new Worker<EmailJobData>("email", processEmail, {
  connection:  newBullConnection(),
  concurrency: 5,
});

worker.on("completed", (job)       => console.log(`[EmailWorker] ✅ ${job.id} done`));
worker.on("failed",    (job, err)  => console.error(`[EmailWorker] ❌ ${job?.id} failed:`, err.message));
worker.on("error",     (err)       => console.error("[EmailWorker] worker error:", err.message));

console.log(`[EmailWorker] 🚀 started — listening on queue "email"`);

// Graceful shutdown
async function shutdown() {
  console.log("[EmailWorker] shutting down…");
  await worker.close();
  process.exit(0);
}
process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);
