/**
 * shared/queues/orderQueue.ts
 *
 * BullMQ queue for order lifecycle events.
 * Processed by workers/orderWorker.ts.
 *
 * Add new event types here as the business logic grows:
 *   - order.refundInitiated
 *   - order.disputeRaised
 *   - harvest.prebookFulfilled
 */

import { Queue } from "bullmq";
import { newBullConnection } from "@/shared/lib/redis";

export type OrderJobData =
  | {
      type: "order.created";
      orderId:   string;
      buyerId:   string;
      farmerId?: string;
      total:     number;
    }
  | {
      type: "order.delivered";
      orderId:          string;
      deliveryPersonId: string;
      earning:          number;
    }
  | {
      type: "delivery.earning.created";
      earningId:        string;
      orderId:          string;
      deliveryPersonId: string;
      amount:           number;
    };

const DEFAULT_JOB_OPTIONS = {
  attempts:         3,
  backoff:          { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: true,
  removeOnFail:     false,
} as const;

const g = globalThis as typeof globalThis & { _orderQueue?: unknown };

function makeOrderQueue(): Queue<OrderJobData> {
  return new Queue<OrderJobData>("orders", {
    connection:        newBullConnection(),
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

export const orderQueue: Queue<OrderJobData> =
  (g._orderQueue as Queue<OrderJobData>) ?? makeOrderQueue();

if (process.env.NODE_ENV !== "production") g._orderQueue = orderQueue;
