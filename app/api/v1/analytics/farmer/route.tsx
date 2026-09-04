import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { goAPIData } from "@/shared/lib/api/server";
import { success, failure } from "@/app/api/v1/utils/responses";

type Period = "7d" | "30d" | "90d" | "all";

function getStartDate(period: Period): Date {
  const now = new Date();
  return period === "7d"  ? new Date(now.getTime() - 7  * 86400000) :
         period === "30d" ? new Date(now.getTime() - 30 * 86400000) :
         period === "90d" ? new Date(now.getTime() - 90 * 86400000) :
         new Date(0);
}

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const farmerId = url.searchParams.get("farmerId");
    const period = (url.searchParams.get("period") ?? "30d") as Period;

    if (!farmerId) {
      return NextResponse.json(failure("farmerId is required"), { status: 400 });
    }

    let farmerObjectId: mongoose.Types.ObjectId;
    try {
      farmerObjectId = new mongoose.Types.ObjectId(farmerId);
    } catch {
      return NextResponse.json(failure("Invalid farmerId"), { status: 400 });
    }

    const startDate = getStartDate(period);

    const [
      revenueAgg,
      topProducts,
      dailyRevenue,
      orderStatusBreakdown,
      farmer,
    ] = await Promise.all([
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: "$items" },
        { $match: { "items.farmerId": farmerId } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.qty"] },
            },
            orders: { $addToSet: "$_id" },
            totalUnitsSold: { $sum: "$items.qty" },
          },
        },
      ]),

      OrderModel.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            "items.farmerId": farmerId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.qty"] },
            },
            unitsSold: { $sum: "$items.qty" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),

      OrderModel.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            "items.farmerId": farmerId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.qty"] },
            },
            units: { $sum: "$items.qty" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      OrderModel.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            "items.farmerId": farmerId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: { _id: "$status", count: { $sum: 1 } },
        },
      ]),

      goAPIData<{ name: string; farmName?: string; place?: string; rating?: number }>(
        req,
        `/farmers/${encodeURIComponent(farmerId)}`,
      ).catch(() => null),
    ]);

    const rev = revenueAgg[0] ?? { totalRevenue: 0, orders: [], totalUnitsSold: 0 };
    const orderCount = Array.isArray(rev.orders) ? rev.orders.length : 0;
    const totalRevenue = rev.totalRevenue ?? 0;

    return NextResponse.json(
      success({
        period,
        farmer: farmer
          ? {
              name: (farmer as any).name,
              farmName: (farmer as any).farmName,
              location: farmer.place ?? "",
              rating: (farmer as any).rating ?? 0,
            }
          : null,
        core: {
          totalRevenue,
          totalUnitsSold: rev.totalUnitsSold ?? 0,
          orderCount,
          avgRevenuePerOrder:
            orderCount > 0
              ? Math.round((totalRevenue / orderCount) * 100) / 100
              : 0,
        },
        topProducts,
        dailyRevenue: dailyRevenue.map((d: any) => ({
          date: d._id,
          revenue: d.revenue,
          units: d.units,
        })),
        orderStatusBreakdown,
      }),
    );
  } catch (err: any) {
    console.error("Farmer analytics error:", err);
    return NextResponse.json(
      failure("Failed to fetch farmer analytics", err?.message || err),
      { status: 500 },
    );
  }
}
