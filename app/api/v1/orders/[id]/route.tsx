// app/api/v1/orders/[id]/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import ProductModel from "@/shared/models/mongodb/products/products";
import DeliveryEarningModel from "@/shared/models/mongodb/delivery/deliveryEarning";
import { success, failure } from "@/app/api/v1/utils/responses";

type ParamsContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// Active statuses = reservation is live on these products
const ACTIVE_STATUSES = new Set([
  "pending", "confirmed", "packed", "picked_up", "in_transit", "out_for_delivery",
]);

// Infer the actor type from the status value when not explicitly provided.
function inferActorType(
  status: string
): "farmer" | "delivery" | "buyer" | "system" {
  if (["confirmed", "packed"].includes(status)) return "farmer";
  if (["picked_up", "in_transit", "out_for_delivery", "delivered"].includes(status))
    return "delivery";
  if (["cancelled", "returned"].includes(status)) return "buyer";
  return "system";
}

// ─── Inventory operations ─────────────────────────────────────────────────

type ItemRef = { productId: string; qty: number };

// Called on DELIVERED: physically consume stock.
// stockQty -= qty, reservedQty -= qty, availableQty stays (already decremented at order creation).
async function consumeStock(items: ItemRef[]) {
  await Promise.all(
    items.map(async ({ productId, qty }) => {
      const after = await ProductModel.findByIdAndUpdate(
        productId,
        { $inc: { stockQty: -qty, reservedQty: -qty } },
        { new: true }
      ).lean() as any;
      if (after && after.stockQty <= 0) {
        await ProductModel.findByIdAndUpdate(productId, {
          $set: { inStock: false, status: "out_of_stock" },
        });
      }
    })
  );
  console.log(`[inventory] consumed stock for ${items.length} product(s)`);
}

// Called on CANCELLED or RETURNED: release reservation back to buyers.
// reservedQty -= qty, availableQty += qty. stockQty is unchanged.
async function releaseReservations(items: ItemRef[]) {
  await Promise.all(
    items.map(async ({ productId, qty }) => {
      const after = await ProductModel.findByIdAndUpdate(
        productId,
        { $inc: { reservedQty: -qty, availableQty: qty } },
        { new: true }
      ).lean() as any;
      if (after && after.availableQty > 0) {
        await ProductModel.findByIdAndUpdate(productId, {
          $set: { inStock: true },
        });
        // Re-enable listing only if it was auto-disabled (out_of_stock → active)
        await ProductModel.findOneAndUpdate(
          { _id: productId, status: "out_of_stock" },
          { $set: { status: "active" } }
        );
      }
    })
  );
  console.log(`[inventory] released reservations for ${items.length} product(s)`);
}

// ─── GET ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);

  try {
    await mongoDB();
    const orderDoc = await OrderModel.findById(id).lean().exec();
    if (!orderDoc) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }
    return NextResponse.json(success(orderDoc, "Order fetched"), { status: 200 });
  } catch (err: any) {
    console.error("order GET error:", err);
    return NextResponse.json(failure(err?.message || "Failed to fetch order"), { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────
// Updates status / paymentStatus / delivery person info.
// Appends a timeline entry on every status change.
// Triggers inventory consume or release depending on the status transition.

export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);

  try {
    await mongoDB();

    const body = await req.json();
    const {
      status,
      paymentStatus,
      deliveryPersonId,
      deliveryPersonName,
      deliveryEarning,
      actorType,
      actorId,
      actorName,
      timelineNote,
    } = body || {};

    // ── Fetch current order to capture previous status ────────────────
    // (needed to guard against duplicate inventory ops on repeated PATCHes)
    const currentOrder = await OrderModel.findById(id).lean() as any;
    if (!currentOrder) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }
    const previousStatus: string = currentOrder.status || "pending";

    // ── Build $set for the order ──────────────────────────────────────
    const $set: Record<string, any> = {};

    if (typeof status === "string") {
      $set.status = status;
      if (status === "delivered") $set.deliveredAt = new Date();
    }
    if (typeof paymentStatus === "string")    $set.paymentStatus    = paymentStatus;
    if (typeof deliveryPersonId === "string") $set.deliveryPersonId = deliveryPersonId;
    if (typeof deliveryPersonName === "string") $set.deliveryPersonName = deliveryPersonName;
    if (typeof deliveryEarning === "number")  $set.deliveryEarning  = deliveryEarning;

    if (Object.keys($set).length === 0) {
      return NextResponse.json(failure("Nothing to update"), { status: 400 });
    }

    // ── Build $push for timeline (only on status change) ──────────────
    const updateOp: Record<string, any> = { $set };

    if (typeof status === "string") {
      const resolvedActorType =
        typeof actorType === "string" ? actorType : inferActorType(status);

      const timelineEntry: Record<string, any> = {
        status,
        timestamp: new Date(),
        actorType: resolvedActorType,
      };
      if (timelineNote) timelineEntry.note = timelineNote;
      if (actorId) timelineEntry.actorId = String(actorId);
      if (actorName) timelineEntry.actorName = String(actorName);

      updateOp.$push = { timeline: timelineEntry };
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateOp, {
      new: true,
    }).lean() as any;

    if (!updatedOrder) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }

    // ── Inventory operations (only on genuine status transitions) ─────
    const isStatusChange = typeof status === "string" && status !== previousStatus;
    const wasActive = ACTIVE_STATUSES.has(previousStatus);

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

    // ── DeliveryEarning record when delivered ─────────────────────────
    if ($set.status === "delivered") {
      const dpId   = deliveryPersonId   ?? updatedOrder.deliveryPersonId;
      const dpName = deliveryPersonName ?? updatedOrder.deliveryPersonName;

      const fee     = typeof updatedOrder.deliveryFee === "number" ? updatedOrder.deliveryFee : 0;
      const earning = typeof deliveryEarning === "number"
        ? deliveryEarning
        : (typeof updatedOrder.deliveryEarning === "number" ? updatedOrder.deliveryEarning : null)
          ?? (fee > 0 ? fee : 30);

      if (dpId) {
        const itemCount = (updatedOrder.items || []).reduce(
          (s: number, i: any) => s + (i.qty || 0),
          0
        );

        await DeliveryEarningModel.findOneAndUpdate(
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
              paymentMode:        updatedOrder.paymentMode || "cod",
              paymentStatus:      updatedOrder.paymentStatus || "unpaid",
              itemCount,
              deliveredAt:        $set.deliveredAt,
            },
          },
          { upsert: true, new: true }
        );

        console.log(
          `[delivery-earning] created/updated for order ${id}, person ${dpId}, ₹${earning}`
        );
      } else {
        console.warn(
          `[delivery-earning] order ${id} marked delivered but no deliveryPersonId — skipping earning record`
        );
      }
    }

    return NextResponse.json(
      success(
        {
          orderId:       String(updatedOrder._id),
          status:        updatedOrder.status        || "pending",
          paymentStatus: updatedOrder.paymentStatus || "unpaid",
          timeline:      updatedOrder.timeline      || [],
        },
        "Order updated"
      ),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("order PATCH error:", err);
    return NextResponse.json(failure(err?.message || "Failed to update order"), { status: 500 });
  }
}
