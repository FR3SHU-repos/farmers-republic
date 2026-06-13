/**
 * workers/notificationWorker.ts
 *
 * Processes the "notifications" queue.
 * Start with:  npm run worker:notification
 *
 * Currently logs notifications. Wire up Firebase FCM / Twilio SMS here
 * when push notification infrastructure is ready.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Worker, Job } from "bullmq";
import { newBullConnection } from "../shared/lib/redis";
import type { NotificationJobData } from "../shared/queues/notificationQueue";

async function processNotification(job: Job<NotificationJobData>): Promise<void> {
  const data = job.data;
  console.log(`[NotificationWorker] Job ${job.id} — type: ${data.type}`);

  switch (data.type) {
    case "notify.farmer":
      // TODO: send push/SMS to farmer about new order
      console.log(
        `[NotificationWorker] → Farmer ${data.farmerId}: new order #${data.orderId} from ${data.buyerName} (₹${data.total})`,
      );
      break;

    case "notify.buyer":
      // TODO: send push/SMS to buyer about order status update
      console.log(
        `[NotificationWorker] → Buyer ${data.buyerId}: order #${data.orderId} is now "${data.status}"`,
      );
      break;

    case "notify.delivery":
      // TODO: send push/SMS to delivery person about new assignment
      console.log(
        `[NotificationWorker] → Delivery person ${data.deliveryPersonId}: assigned to order #${data.orderId}`,
      );
      break;

    default:
      console.warn(`[NotificationWorker] Unknown type: ${(data as any).type}`);
  }
}

const worker = new Worker<NotificationJobData>(
  "notifications",
  processNotification,
  {
    connection:  newBullConnection(),
    concurrency: 10,
  },
);

worker.on("completed", (job)      => console.log(`[NotificationWorker] ✅ ${job.id} done`));
worker.on("failed",    (job, err) => console.error(`[NotificationWorker] ❌ ${job?.id} failed:`, err.message));
worker.on("error",     (err)      => console.error("[NotificationWorker] worker error:", err.message));

console.log(`[NotificationWorker] 🚀 started — listening on queue "notifications"`);

async function shutdown() {
  console.log("[NotificationWorker] shutting down…");
  await worker.close();
  process.exit(0);
}
process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);
