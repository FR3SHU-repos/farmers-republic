// app/api/v1/delivery/earnings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import DeliveryEarningModel from "@/shared/models/mongodb/delivery/deliveryEarning";
import { success, failure } from "@/app/api/v1/utils/responses";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

// ── GET /api/v1/delivery/earnings?deliveryPersonId=<id> ───────
// Deprecated compatibility route; Go owns the delivery-earnings read
// (GET /api/v1/delivery/earnings, authenticated, role- and self-scoped —
// the legacy route trusted a client-supplied deliveryPersonId with no check).
export async function GET(req: NextRequest) {
  return proxyCatalogueGET(req, "/delivery/earnings");
}

// ── POST /api/v1/delivery/earnings ───────────────────────────
// Manually record an earning (called by the delivery UI if the automatic
// PATCH-route creation didn't fire). Still on the legacy writer — this write
// is tied to the order-status state machine (phase 7d) and moves with it.
export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();
    const {
      deliveryPersonId,
      deliveryPersonName,
      orderId,
      buyerName,
      orderTotal,
      deliveryFee,
      earning,
      paymentMode,
      paymentStatus,
      itemCount,
      deliveredAt,
    } = body || {};

    if (!deliveryPersonId || !orderId) {
      return NextResponse.json(
        failure("deliveryPersonId and orderId are required"),
        { status: 400 }
      );
    }

    const fee = typeof deliveryFee === "number" ? deliveryFee : 0;
    const earnAmount =
      typeof earning === "number" ? earning : fee > 0 ? fee : 30;

    const record = await DeliveryEarningModel.findOneAndUpdate(
      { orderId: String(orderId) },
      {
        $setOnInsert: { orderId: String(orderId) },
        $set: {
          deliveryPersonId:   String(deliveryPersonId),
          deliveryPersonName: deliveryPersonName || "",
          buyerName:          buyerName || "Customer",
          orderTotal:         typeof orderTotal === "number" ? orderTotal : 0,
          deliveryFee:        fee,
          earning:            earnAmount,
          paymentMode:        paymentMode || "cod",
          paymentStatus:      paymentStatus || "unpaid",
          itemCount:          typeof itemCount === "number" ? itemCount : 0,
          deliveredAt:        deliveredAt ? new Date(deliveredAt) : new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(success(record, "Earning recorded"), { status: 201 });
  } catch (err: any) {
    console.error("delivery earnings POST error:", err);
    return NextResponse.json(failure(err?.message || "Failed to record earning"), { status: 500 });
  }
}
