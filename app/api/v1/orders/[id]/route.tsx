// app/api/v1/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

// keep same pattern as farmer route if Next wraps params in a Promise
type ParamsContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// minimal shape we care about
type MongoOrder = {
  _id: unknown;
  status?: string;
  paymentStatus?: string;
};


// GET – fetch one full buyer order
export async function GET(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  const orderId = id;

  console.log("🧾 ORDER GET API HIT", orderId);

  try {
    await mongoDB();

    const orderDoc = await OrderModel.findById(orderId).lean().exec();

    if (!orderDoc) {
      return NextResponse.json(
        failure("Order not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      success(orderDoc, "Order fetched"),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("order GET error:", err);
    return NextResponse.json(
      failure(err?.message || "Failed to fetch order"),
      { status: 500 }
    );
  }
}


export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  const orderId = id;

  console.log("🧾 ORDER PATCH API HIT", orderId);

  try {
    await mongoDB();

    const body = await req.json();
    const { status, paymentStatus, deliveryPersonId, deliveryPersonName, deliveryEarning } = body || {};

    const $set: Record<string, any> = {};

    if (typeof status === "string") {
      $set.status = status;
      if (status === "delivered") $set.deliveredAt = new Date();
    }
    if (typeof paymentStatus === "string") {
      $set.paymentStatus = paymentStatus;
    }
    if (typeof deliveryPersonId === "string") {
      $set.deliveryPersonId = deliveryPersonId;
    }
    if (typeof deliveryPersonName === "string") {
      $set.deliveryPersonName = deliveryPersonName;
    }
    if (typeof deliveryEarning === "number") {
      $set.deliveryEarning = deliveryEarning;
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json(
        failure("Nothing to update (status / paymentStatus)"),
        { status: 400 },
      );
    }

    const updatedDoc = await OrderModel.findByIdAndUpdate(
      orderId,
      { $set },
      { new: true },
    ).lean();

    const updated = updatedDoc as MongoOrder | null; // ✅ explicit cast

    if (!updated) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }

    return NextResponse.json(
      success(
        {
          orderId: String(updated._id),
          status: updated.status || "pending",
          paymentStatus: updated.paymentStatus || "unpaid",
        },
        "Order updated",
      ),
      { status: 200 },
    );
  } catch (err: any) {
    console.error("order PATCH error:", err);
    return NextResponse.json(
      failure(err?.message || "Failed to update order"),
      { status: 500 },
    );
  }
}
