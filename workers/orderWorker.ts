/**
 * workers/orderWorker.ts
 *
 * Processes the "orders" queue.
 * Start with:  npm run worker:order
 *
 * Handles downstream side-effects triggered by order lifecycle events
 * without blocking the API request that produced them.
 *
 * To add a new side-effect (e.g. loyalty points on delivery):
 *   1. Add a new job type to shared/queues/orderQueue.ts
 *   2. Add a case in the switch below
 *   3. Emit the job from the relevant API route
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Worker, Job } from "bullmq";
import { newBullConnection } from "../shared/lib/redis";
import type { OrderJobData } from "../shared/queues/orderQueue";

async function processOrder(job: Job<OrderJobData>): Promise<void> {
  const data = job.data;
  console.log(`[OrderWorker] Job ${job.id} — type: ${data.type}`);

  switch (data.type) {
    case "order.created":
      // TODO: trigger post-order actions (loyalty points, farmer notification, analytics)
      console.log(
        `[OrderWorker] order.created — #${data.orderId} by buyer ${data.buyerId}, total ₹${data.total}`,
      );
      break;

    case "order.delivered":
      // TODO: trigger post-delivery actions (review request, loyalty points, wallet credit)
      console.log(
        `[OrderWorker] order.delivered — #${data.orderId}, delivery person ${data.deliveryPersonId}, earning ₹${data.earning}`,
      );
      break;

    case "delivery.earning.created":
      // TODO: credit earnings to delivery person's wallet, notify them
      console.log(
        `[OrderWorker] delivery.earning.created — earning ${data.earningId} for person ${data.deliveryPersonId}, ₹${data.amount}`,
      );
      break;

    default:
      console.warn(`[OrderWorker] Unknown type: ${(data as any).type}`);
  }
}

const worker = new Worker<OrderJobData>("orders", processOrder, {
  connection:  newBullConnection(),
  concurrency: 5,
});

worker.on("completed", (job)      => console.log(`[OrderWorker] ✅ ${job.id} done`));
worker.on("failed",    (job, err) => console.error(`[OrderWorker] ❌ ${job?.id} failed:`, err.message));
worker.on("error",     (err)      => console.error("[OrderWorker] worker error:", err.message));

console.log(`[OrderWorker] 🚀 started — listening on queue "orders"`);

async function shutdown() {
  console.log("[OrderWorker] shutting down…");
  await worker.close();
  process.exit(0);
}
process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);
