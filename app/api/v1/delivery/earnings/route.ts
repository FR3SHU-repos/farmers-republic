// app/api/v1/delivery/earnings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

// GET /api/v1/delivery/earnings?deliveryPersonId=<id>
export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const deliveryPersonId = url.searchParams.get("deliveryPersonId");

    if (!deliveryPersonId) {
      return NextResponse.json(failure("deliveryPersonId is required"), { status: 400 });
    }

    const orders = await OrderModel.find({
      deliveryPersonId,
      status: "delivered",
    })
      .select("_id buyerName total deliveryFee deliveryEarning deliveredAt createdAt items paymentMode paymentStatus")
      .sort({ deliveredAt: -1 })
      .lean()
      .exec();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarnings = 0;
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;

    // daily breakdown for the last 30 days
    const dailyMap: Record<string, number> = {};

    for (const order of orders) {
      const earning = (order as any).deliveryEarning ?? 0;
      const deliveredAt = (order as any).deliveredAt
        ? new Date((order as any).deliveredAt)
        : new Date((order as any).createdAt);

      totalEarnings += earning;

      if (deliveredAt >= startOfToday) todayEarnings += earning;
      if (deliveredAt >= startOfWeek) weekEarnings += earning;
      if (deliveredAt >= startOfMonth) monthEarnings += earning;

      // daily bucket for chart (last 30 days)
      const dayKey = deliveredAt.toISOString().split("T")[0]; // "2024-06-01"
      dailyMap[dayKey] = (dailyMap[dayKey] ?? 0) + earning;
    }

    // build last-30-days array
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
          totalDeliveries: orders.length,
          daily,
          orders: orders.map((o: any) => ({
            _id: String(o._id),
            buyerName: o.buyerName || "Customer",
            total: o.total,
            deliveryFee: o.deliveryFee,
            deliveryEarning: o.deliveryEarning ?? 0,
            paymentMode: o.paymentMode,
            paymentStatus: o.paymentStatus,
            itemCount: (o.items || []).reduce((s: number, i: any) => s + i.qty, 0),
            deliveredAt: o.deliveredAt ?? o.createdAt,
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
