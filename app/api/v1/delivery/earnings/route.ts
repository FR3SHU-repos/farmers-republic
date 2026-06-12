// app/api/v1/delivery/earnings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import DeliveryEarningModel from "@/shared/models/mongodb/delivery/deliveryEarning";
import { success, failure } from "@/app/api/v1/utils/responses";

// ── GET /api/v1/delivery/earnings?deliveryPersonId=<id> ───────
// Returns aggregated earnings stats + history from the dedicated
// DeliveryEarning collection (not the orders collection).
export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const deliveryPersonId = url.searchParams.get("deliveryPersonId");

    if (!deliveryPersonId) {
      return NextResponse.json(failure("deliveryPersonId is required"), { status: 400 });
    }

    const records = await DeliveryEarningModel.find({ deliveryPersonId })
      .sort({ deliveredAt: -1 })
      .lean()
      .exec();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarnings = 0;
    let todayEarnings = 0;
    let weekEarnings  = 0;
    let monthEarnings = 0;

    const dailyMap: Record<string, number> = {};

    for (const r of records) {
      const earning    = (r as any).earning ?? 0;
      const deliveredAt = r.deliveredAt
        ? new Date(r.deliveredAt as string)
        : now;

      totalEarnings += earning;
      if (deliveredAt >= startOfToday) todayEarnings += earning;
      if (deliveredAt >= startOfWeek)  weekEarnings  += earning;
      if (deliveredAt >= startOfMonth) monthEarnings += earning;

      const dayKey = deliveredAt.toISOString().split("T")[0];
      dailyMap[dayKey] = (dailyMap[dayKey] ?? 0) + earning;
    }

    // Build last-30-days array for the chart
    const daily: { date: string; earning: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      daily.push({ date: key, earning: dailyMap[key] ?? 0 });
    }

    return NextResponse.json(
      success(
        {
          totalEarnings,
          todayEarnings,
          weekEarnings,
          monthEarnings,
          totalDeliveries: records.length,
          daily,
          orders: records.map((r: any) => ({
            _id:             String(r._id),
            orderId:         r.orderId,
            buyerName:       r.buyerName || "Customer",
            total:           r.orderTotal,
            deliveryFee:     r.deliveryFee,
            deliveryEarning: r.earning,
            paymentMode:     r.paymentMode,
            paymentStatus:   r.paymentStatus,
            itemCount:       r.itemCount,
            deliveredAt:     r.deliveredAt,
          })),
        },
        "Earnings fetched"
      ),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("delivery earnings GET error:", err);
    return NextResponse.json(failure(err?.message || "Failed to fetch earnings"), { status: 500 });
  }
}

// ── POST /api/v1/delivery/earnings ───────────────────────────
// Manually record an earning (called by the delivery UI if the
// automatic PATCH-route creation didn't fire).
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
