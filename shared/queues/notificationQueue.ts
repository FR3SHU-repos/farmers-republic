/**
 * shared/queues/notificationQueue.ts
 *
 * BullMQ queue for in-app push/SMS notifications.
 * Processed by workers/notificationWorker.ts.
 *
 * Future: wire up to Firebase Cloud Messaging, Twilio SMS, or WebSockets here.
 */

import { Queue } from "bullmq";
import { newBullConnection } from "@/shared/lib/redis";

export type NotificationJobData =
  | {
      type: "notify.farmer";
      farmerId:  string;
      orderId:   string;
      buyerName: string;
      total:     number;
    }
  | {
      type: "notify.buyer";
      buyerId:  string;
      orderId:  string;
      status:   string;
    }
  | {
      type: "notify.delivery";
      deliveryPersonId: string;
      orderId:          string;
    };

const DEFAULT_JOB_OPTIONS = {
  attempts:         3,
  backoff:          { type: "exponential" as const, delay: 3_000 },
  removeOnComplete: true,
  removeOnFail:     false,
} as const;

const g = globalThis as typeof globalThis & { _notificationQueue?: unknown };

function makeNotificationQueue(): Queue<NotificationJobData> {
  return new Queue<NotificationJobData>("notifications", {
    connection:        newBullConnection(),
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

export const notificationQueue: Queue<NotificationJobData> =
  (g._notificationQueue as Queue<NotificationJobData>) ?? makeNotificationQueue();

if (process.env.NODE_ENV !== "production") g._notificationQueue = notificationQueue;
