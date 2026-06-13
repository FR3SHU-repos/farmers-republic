import { NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import FarmerModel from "@/shared/models/mongodb/farmer";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET() {
  try {
    await mongoDB();

    const [
      totalUsers,
      totalFarmers,
      totalOrders,
      totalProducts,
      pendingKYC,
      recentOrders,
      ordersByStatus,
      gmvResult,
    ] = await Promise.all([
      UserModel.countDocuments(),
      FarmerModel.countDocuments(),
      OrderModel.countDocuments(),
      ProductModel.countDocuments(),
      FarmerModel.countDocuments({ kycStatus: "submitted" }),
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
            totalFarmers,
            totalOrders,
            totalProducts,
            pendingKYC,
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
