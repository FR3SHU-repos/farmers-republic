// app/api/v1/orders/[id]/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import DeliveryEarningModel from "@/shared/models/mongodb/delivery/deliveryEarning";
import { success, failure } from "@/app/api/v1/utils/responses";

type ParamsContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// GET – fetch one full buyer order
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

// PATCH – update status / paymentStatus / delivery person info
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
    } = body || {};

    // ── Build $set for the order ────────────────────────────
    const $set: Record<string, any> = {};

    if (typeof status === "string") {
      $set.status = status;
      if (status === "delivered") $set.deliveredAt = new Date();
    }
    if (typeof paymentStatus === "string") $set.paymentStatus = paymentStatus;
    if (typeof deliveryPersonId === "string") $set.deliveryPersonId = deliveryPersonId;
    if (typeof deliveryPersonName === "string") $set.deliveryPersonName = deliveryPersonName;
    if (typeof deliveryEarning === "number") $set.deliveryEarning = deliveryEarning;

    if (Object.keys($set).length === 0) {
      return NextResponse.json(failure("Nothing to update"), { status: 400 });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      { $set },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }

    // ── Create DeliveryEarning record when delivered ────────
    if ($set.status === "delivered") {
      const o = updatedOrder as any;

      // Use delivery person info from request body first, then fall back to
      // what was already stored on the order (set during the pickup step).
      const dpId   = deliveryPersonId   ?? o.deliveryPersonId;
      const dpName = deliveryPersonName ?? o.deliveryPersonName;

      // Earning = delivery fee; minimum ₹30 for free-shipping orders.
      const fee     = typeof o.deliveryFee === "number" ? o.deliveryFee : 0;
      const earning = typeof deliveryEarning === "number"
        ? deliveryEarning
        : (typeof o.deliveryEarning === "number" ? o.deliveryEarning : null)
          ?? (fee > 0 ? fee : 30);

      if (dpId) {
        const itemCount = (o.items || []).reduce(
          (s: number, i: any) => s + (i.qty || 0),
          0
        );

        await DeliveryEarningModel.findOneAndUpdate(
          { orderId: String(id) },         // unique constraint — no duplicate per order
          {
            $setOnInsert: { orderId: String(id) },
            $set: {
              deliveryPersonId:   String(dpId),
              deliveryPersonName: dpName || "",
              buyerName:          o.buyerName || "Customer",
              orderTotal:         o.total || 0,
              deliveryFee:        fee,
              earning,
              paymentMode:        o.paymentMode || "cod",
              paymentStatus:      o.paymentStatus || "unpaid",
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
          orderId: String((updatedOrder as any)._id),
          status:        (updatedOrder as any).status        || "pending",
          paymentStatus: (updatedOrder as any).paymentStatus || "unpaid",
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
