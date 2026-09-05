// app/api/v1/orders/[id]/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB }             from "@/shared/lib/db/mongo";
import OrderModel              from "@/shared/models/mongodb/orders/buyerOrders";
import ProductModel            from "@/shared/models/mongodb/products/products";
import DeliveryEarningModel    from "@/shared/models/mongodb/delivery/deliveryEarning";
import { success, failure }    from "@/app/api/v1/utils/responses";
import { emailQueue }          from "@/shared/queues/emailQueue";
import { notificationQueue }   from "@/shared/queues/notificationQueue";
import { orderQueue }          from "@/shared/queues/orderQueue";
import { proxyCatalogueGET }   from "@/shared/lib/api/catalogue-proxy";

type ParamsContext = {
  params: { id: string } | Promise<{ id: string }>;
};

const ACTIVE_STATUSES = new Set([
  "pending", "confirmed", "packed", "picked_up", "in_transit", "out_for_delivery",
]);

function inferActorType(status: string): "farmer" | "delivery" | "buyer" | "system" {
  if (["confirmed", "packed"].includes(status)) return "farmer";
  if (["picked_up", "in_transit", "out_for_delivery", "delivered"].includes(status)) return "delivery";
  if (["cancelled", "returned"].includes(status)) return "buyer";
  return "system";
}

type ItemRef = { productId: string; qty: number };

async function consumeStock(items: ItemRef[]) {
  await Promise.all(
    items.map(async ({ productId, qty }) => {
      const after = await ProductModel.findByIdAndUpdate(
        productId,
        { $inc: { stockQty: -qty, reservedQty: -qty } },
        { new: true },
      ).lean() as any;
      if (after && after.stockQty <= 0) {
        await ProductModel.findByIdAndUpdate(productId, {
          $set: { inStock: false, status: "out_of_stock" },
        });
      }
    }),
  );
  console.log(`[inventory] consumed stock for ${items.length} product(s)`);
}

async function releaseReservations(items: ItemRef[]) {
  await Promise.all(
    items.map(async ({ productId, qty }) => {
      const after = await ProductModel.findByIdAndUpdate(
        productId,
        { $inc: { reservedQty: -qty, availableQty: qty } },
        { new: true },
      ).lean() as any;
      if (after && after.availableQty > 0) {
        await ProductModel.findByIdAndUpdate(productId, { $set: { inStock: true } });
        await ProductModel.findOneAndUpdate(
          { _id: productId, status: "out_of_stock" },
          { $set: { status: "active" } },
        );
      }
    }),
  );
  console.log(`[inventory] released reservations for ${items.length} product(s)`);
}

// ── Safely enqueue — errors are logged but never break the response ───────────
async function safeEnqueue(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
  } catch (err: any) {
    console.error(`[Queue] failed to enqueue ${label}:`, err?.message);
  }
}

// ─── GET (deprecated compatibility route; Go owns order-detail reads) ─────────
export async function GET(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  return proxyCatalogueGET(req, `/orders/${encodeURIComponent(id)}`);
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);

  try {
    await mongoDB();

    const body = await req.json();
    const {
      status, paymentStatus,
      deliveryPersonId, deliveryPersonName, deliveryEarning,
      actorType, actorId, actorName, timelineNote,
    } = body || {};

    const currentOrder = await OrderModel.findById(id).lean() as any;
    if (!currentOrder) return NextResponse.json(failure("Order not found"), { status: 404 });
    const previousStatus: string = currentOrder.status || "pending";

    const $set: Record<string, any> = {};
    if (typeof status === "string") {
      $set.status = status;
      if (status === "delivered") $set.deliveredAt = new Date();
    }
    if (typeof paymentStatus    === "string") $set.paymentStatus    = paymentStatus;
    if (typeof deliveryPersonId === "string") $set.deliveryPersonId = deliveryPersonId;
    if (typeof deliveryPersonName === "string") $set.deliveryPersonName = deliveryPersonName;
    if (typeof deliveryEarning  === "number")  $set.deliveryEarning  = deliveryEarning;

    if (Object.keys($set).length === 0) {
      return NextResponse.json(failure("Nothing to update"), { status: 400 });
    }

    const updateOp: Record<string, any> = { $set };
    if (typeof status === "string") {
      const resolvedActorType = typeof actorType === "string" ? actorType : inferActorType(status);
      const timelineEntry: Record<string, any> = {
        status,
        timestamp: new Date(),
        actorType: resolvedActorType,
      };
      if (timelineNote) timelineEntry.note    = String(timelineNote);
      if (actorId)      timelineEntry.actorId = String(actorId);
      if (actorName)    timelineEntry.actorName = String(actorName);
      updateOp.$push = { timeline: timelineEntry };
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateOp, { new: true }).lean() as any;
    if (!updatedOrder) return NextResponse.json(failure("Order not found"), { status: 404 });

    // ── Inventory operations ──────────────────────────────────────────────
    const isStatusChange = typeof status === "string" && status !== previousStatus;
    const wasActive      = ACTIVE_STATUSES.has(previousStatus);

    if (isStatusChange && wasActive) {
      const itemRefs: ItemRef[] = (updatedOrder.items || [])
        .filter((i: any) => i.productId && (i.qty || 0) > 0)
        .map((i: any) => ({ productId: String(i.productId), qty: Number(i.qty) }));

      if (status === "delivered") {
        await consumeStock(itemRefs);
      } else if (["cancelled", "returned"].includes(status)) {
        await releaseReservations(itemRefs);
      }
    }

    // ── DeliveryEarning record ────────────────────────────────────────────
    let earningDoc: any = null;
    if ($set.status === "delivered") {
      const dpId   = deliveryPersonId   ?? updatedOrder.deliveryPersonId;
      const dpName = deliveryPersonName ?? updatedOrder.deliveryPersonName;
      const fee    = typeof updatedOrder.deliveryFee === "number" ? updatedOrder.deliveryFee : 0;
      const earning = typeof deliveryEarning === "number"
        ? deliveryEarning
        : (typeof updatedOrder.deliveryEarning === "number" ? updatedOrder.deliveryEarning : null)
          ?? (fee > 0 ? fee : 30);

      if (dpId) {
        const itemCount = (updatedOrder.items || []).reduce(
          (s: number, i: any) => s + (i.qty || 0), 0,
        );
        earningDoc = await DeliveryEarningModel.findOneAndUpdate(
          { orderId: String(id) },
          {
            $setOnInsert: { orderId: String(id) },
            $set: {
              deliveryPersonId:   String(dpId),
              deliveryPersonName: dpName || "",
              buyerName:          updatedOrder.buyerName || "Customer",
              orderTotal:         updatedOrder.total || 0,
              deliveryFee:        fee,
              earning,
              paymentMode:        updatedOrder.paymentMode  || "cod",
              paymentStatus:      updatedOrder.paymentStatus || "unpaid",
              itemCount,
              deliveredAt:        $set.deliveredAt,
            },
          },
          { upsert: true, new: true },
        );
        console.log(`[delivery-earning] created/updated for order ${id}, person ${dpId}, ₹${earning}`);

        // ── Queue: order delivered + delivery earning ─────────────────────
        await safeEnqueue(
          () => orderQueue.add("order.delivered", {
            type:             "order.delivered",
            orderId:          String(id),
            deliveryPersonId: String(dpId),
            earning,
          }),
          "order.delivered",
        );

        if (earningDoc?._id) {
          await safeEnqueue(
            () => orderQueue.add("delivery.earning.created", {
              type:             "delivery.earning.created",
              earningId:        String(earningDoc._id),
              orderId:          String(id),
              deliveryPersonId: String(dpId),
              amount:           earning,
            }),
            "delivery.earning.created",
          );
        }

        // ── Queue: delivery confirmation email to buyer ───────────────────
        if (updatedOrder.buyerEmail) {
          await safeEnqueue(
            () => emailQueue.add("deliveryConfirmation", {
              type:        "deliveryConfirmation",
              to:          updatedOrder.buyerEmail,
              name:        updatedOrder.buyerName || "Customer",
              orderId:     String(id),
              deliveredAt: new Date().toLocaleDateString("en-IN"),
            }),
            "email.deliveryConfirmation",
          );
        }

        // ── Queue: notify buyer about delivery ────────────────────────────
        if (updatedOrder.buyerId) {
          await safeEnqueue(
            () => notificationQueue.add("notify.buyer", {
              type:     "notify.buyer",
              buyerId:  String(updatedOrder.buyerId),
              orderId:  String(id),
              status:   "delivered",
            }),
            "notify.buyer",
          );
        }
      } else {
        console.warn(`[delivery-earning] order ${id} delivered but no deliveryPersonId — skipping`);
      }
    }

    // ── Queue: status change notification to buyer ────────────────────────
    if (isStatusChange && status !== "delivered" && updatedOrder.buyerId) {
      await safeEnqueue(
        () => notificationQueue.add("notify.buyer", {
          type:    "notify.buyer",
          buyerId: String(updatedOrder.buyerId),
          orderId: String(id),
          status,
        }),
        "notify.buyer.status",
      );
    }

    return NextResponse.json(
      success(
        {
          orderId:       String(updatedOrder._id),
          status:        updatedOrder.status        || "pending",
          paymentStatus: updatedOrder.paymentStatus || "unpaid",
          timeline:      updatedOrder.timeline      || [],
        },
        "Order updated",
      ),
      { status: 200 },
    );
  } catch (err: any) {
    console.error("order PATCH error:", err);
    return NextResponse.json(failure(err?.message || "Failed to update order"), { status: 500 });
  }
}
