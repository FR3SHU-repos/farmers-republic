import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import UserModel from "@/shared/models/mongodb/user";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses";
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from "@/shared/lib/cache";

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
    const url = new URL(req.url);
    const period = (url.searchParams.get("period") ?? "30d") as Period;

    const cacheKey = CacheKeys.analyticsAdmin(period);
    const cached = await cacheGet<ReturnType<typeof success>>(cacheKey);
    if (cached) return NextResponse.json(cached);

    await mongoDB();

    const startDate = getStartDate(period);

    const [
      coreStats,
      ordersByStatus,
      dailyRevenue,
      topProducts,
      topFarmers,
      newUsers,
      paymentModes,
      repeatCustomers,
      totalUsers,
      totalFarmers,
      verifiedFarmers,
    ] = await Promise.all([
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            gmv: { $sum: "$total" },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["delivered", "out_for_delivery"]] },
                  "$total",
                  0,
                ],
              },
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
            deliveredCount: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            avgOrderValue: { $avg: "$total" },
          },
        },
      ]),

      OrderModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["delivered", "out_for_delivery"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $nin: ["cancelled"] },
          },
        },
        { $unwind: "$items" },
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
        { $limit: 10 },
      ]),

      OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: "delivered",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.farmerId",
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.qty"] },
            },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),

      UserModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      OrderModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: "$paymentMode",
            count: { $sum: 1 },
            total: { $sum: "$total" },
          },
        },
      ]),

      OrderModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$buyerId", orderCount: { $sum: 1 } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            repeat: {
              $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] },
            },
          },
        },
      ]),

      UserModel.countDocuments(),
      FarmerModel.countDocuments(),
      FarmerModel.countDocuments({ verified: true }),
    ]);

    const core = coreStats[0] ?? {
      totalOrders: 0,
      gmv: 0,
      revenue: 0,
      cancelledCount: 0,
      deliveredCount: 0,
      avgOrderValue: 0,
    };

    const rc = repeatCustomers[0] ?? { total: 0, repeat: 0 };

    const responseBody = success({
        period,
        core: {
          totalOrders: core.totalOrders ?? 0,
          gmv: core.gmv ?? 0,
          revenue: core.revenue ?? 0,
          cancelledCount: core.cancelledCount ?? 0,
          deliveredCount: core.deliveredCount ?? 0,
          avgOrderValue: Math.round((core.avgOrderValue ?? 0) * 100) / 100,
          cancellationRate:
            core.totalOrders > 0
              ? Math.round((core.cancelledCount / core.totalOrders) * 10000) / 100
              : 0,
          deliveryRate:
            core.totalOrders > 0
              ? Math.round((core.deliveredCount / core.totalOrders) * 10000) / 100
              : 0,
        },
        ordersByStatus,
        dailyRevenue: dailyRevenue.map((d: any) => ({
          date: d._id,
          revenue: d.revenue,
          orders: d.orders,
        })),
        topProducts,
        topFarmers,
        newUsers: newUsers.map((u: any) => ({ date: u._id, count: u.count })),
        paymentModes,
        repeatCustomers: {
          total: rc.total,
          repeat: rc.repeat,
          repeatRate:
            rc.total > 0
              ? Math.round((rc.repeat / rc.total) * 10000) / 100
              : 0,
        },
        totalUsers,
        totalFarmers,
        verifiedFarmers,
      });

    await cacheSet(cacheKey, responseBody, CacheTTL.analyticsAdmin);
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("Admin analytics error:", err);
    return NextResponse.json(
      failure("Failed to fetch analytics", err?.message || err),
      { status: 500 },
    );
  }
}
