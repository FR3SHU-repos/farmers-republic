// app/api/v1/delivery/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

const DELIVERABLE_STATUSES = ["pending", "confirmed", "out_for_delivery"];

// GET /api/v1/delivery/orders?status=pending&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "all";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const query: Record<string, any> =
      status === "all" || !status
        ? { status: { $in: DELIVERABLE_STATUSES } }
        : DELIVERABLE_STATUSES.includes(status)
        ? { status }
        : { status: { $in: DELIVERABLE_STATUSES } };

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      OrderModel.countDocuments(query),
    ]);

    return NextResponse.json(
      success(
        { orders, page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        "Delivery orders fetched"
      ),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("delivery orders GET error:", err);
    return NextResponse.json(failure(err?.message || "Failed to fetch orders"), { status: 500 });
  }
}
