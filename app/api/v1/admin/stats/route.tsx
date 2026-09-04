import { NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import { goAPIData } from "@/shared/lib/api/server";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: import("next/server").NextRequest) {
  try {
    await mongoDB();

    const [
      totalUsers,
	  farmerStats,
      totalOrders,
      totalProducts,
      recentOrders,
      ordersByStatus,
      gmvResult,
    ] = await Promise.all([
      UserModel.countDocuments(),
	  goAPIData<{ total: number; pendingKYC: number }>(req, "/admin/farmers/stats"),
      OrderModel.countDocuments(),
      ProductModel.countDocuments(),
      OrderModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      OrderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      OrderModel.aggregate([
        { $match: { status: { $nin: ["cancelled", "returned"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const gmv = gmvResult[0]?.total ?? 0;
    const aov = totalOrders > 0 ? Math.round(gmv / totalOrders) : 0;

    const ordersByStatusFormatted = ordersByStatus.map((s: any) => ({
      status: s._id ?? "unknown",
      count: s.count,
    }));

    const recentOrdersFormatted = recentOrders.map((o: any) => ({
      id: String(o._id),
      buyerName: o.buyerName ?? "—",
      total: o.total ?? 0,
      status: o.status ?? "pending",
      createdAt: o.createdAt,
    }));

    return NextResponse.json(
      success(
        {
          stats: {
            totalUsers,
			totalFarmers: farmerStats.total,
            totalOrders,
            totalProducts,
			pendingKYC: farmerStats.pendingKYC,
            gmv,
            aov,
          },
          ordersByStatus: ordersByStatusFormatted,
          recentOrders: recentOrdersFormatted,
        },
        "Stats fetched",
      ),
    );
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      failure("Failed to fetch stats", err?.message),
      { status: 500 },
    );
  }
}
