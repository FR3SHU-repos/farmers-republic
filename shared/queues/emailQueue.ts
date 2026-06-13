/**
 * shared/queues/emailQueue.ts
 *
 * BullMQ queue for outbound emails.
 *
 * Add a job from any API route:
 *   import { emailQueue } from "@/shared/queues/emailQueue";
 *   await emailQueue.add("passwordResetOtp", { type: "passwordResetOtp", ... });
 *
 * Jobs are processed by workers/emailWorker.ts running as a separate Node process.
 */

import { Queue } from "bullmq";
import { newBullConnection } from "@/shared/lib/redis";

export type EmailJobData =
  | {
      type: "passwordResetOtp";
      to: string;
      name: string;
      otp: string;
      expiryMinutes: number;
    }
  | {
      type: "orderConfirmation";
      to: string;
      name: string;
      orderId: string;
      total: number;
      items: Array<{ name: string; qty: number; price: number }>;
    }
  | {
      type: "deliveryConfirmation";
      to: string;
      name: string;
      orderId: string;
      deliveredAt: string;
    }
  | {
      type: "generic";
      to: string;
      subject: string;
      html: string;
      text?: string;
    };

const DEFAULT_JOB_OPTIONS = {
  attempts:         3,
  backoff:          { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: true,
  removeOnFail:     false,
} as const;

// Singleton — one Queue instance per process (avoids multiple connections on hot-reload)
const g = globalThis as typeof globalThis & { _emailQueue?: unknown };

function makeEmailQueue(): Queue<EmailJobData> {
  return new Queue<EmailJobData>("email", {
    connection:        newBullConnection(),
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

export const emailQueue: Queue<EmailJobData> =
  (g._emailQueue as Queue<EmailJobData>) ?? makeEmailQueue();

if (process.env.NODE_ENV !== "production") g._emailQueue = emailQueue;
