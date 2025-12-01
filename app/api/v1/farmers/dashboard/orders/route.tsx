// app/api/v1/farmers/dashboard/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

// Types for the lean() order docs
type MongoOrderItem = {
  productId?: string;
  name?: string;
  price?: number;
  image?: string;
  qty?: number;
  farmerId?: string;
};

type MongoOrder = {
  _id: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string; // if you ever add it
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  status?: string;
  paymentStatus?: string;
  paymentMode?: string;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
  items?: MongoOrderItem[];
};

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const farmerId = searchParams.get("farmerId");
    const pageParam = searchParams.get("page") ?? "1";
    const limitParam = searchParams.get("limit") ?? "20";

    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.max(1, Number(limitParam) || 20);

    console.log("[farmer orders] fetching for farmerId:", farmerId, "page:", page);

    if (!farmerId) {
      return NextResponse.json(
        failure("farmerId query parameter is required"),
        { status: 400 },
      );
    }

    const filter = { "items.farmerId": farmerId };

    // 1️⃣ Get paginated orders + total count
    const [ordersRaw, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec() as Promise<MongoOrder[]>,
      OrderModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // 2️⃣ Transform to dashboard shape
    const orders = (ordersRaw || []).map((o: MongoOrder) => {
      const itemsForFarmer: MongoOrderItem[] = (o.items || []).filter(
        (it: MongoOrderItem) => String(it.farmerId) === String(farmerId),
      );

      const itemsCount = itemsForFarmer.reduce(
        (sum: number, it: MongoOrderItem) => sum + (it.qty ?? 0),
        0,
      );

      const subtotalForFarmer = itemsForFarmer.reduce(
        (sum: number, it: MongoOrderItem) =>
          sum + (it.price ?? 0) * (it.qty ?? 0),
        0,
      );

      const totalForFarmer = subtotalForFarmer; // no delivery split yet

      return {
        id: String(o._id),
        
        buyerId: o.buyerId || "—",
        customerName: o.buyerName || "—",
        customerPhone: (o as any).buyerPhone || "",
        subtotal: subtotalForFarmer,
        deliveryFee: 0,
        total: totalForFarmer,
        status: o.status || "pending",
        paymentStatus: o.paymentStatus || "unpaid",
        paymentMode: o.paymentMode || "cod",
        source: o.source || "web",
        createdAt: o.createdAt
          ? new Date(o.createdAt).toISOString()
          : new Date().toISOString(),
        itemsCount,
      };
    });

    return NextResponse.json(
      success(
        {
          orders,
          page,
          limit,
          total,
          totalPages,
        },
        "Farmer orders fetched",
      ),
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Farmer dashboard orders error:", err);
    return NextResponse.json(
      failure("Failed to fetch farmer orders", err?.message || err),
      { status: 500 },
    );
  }
}
