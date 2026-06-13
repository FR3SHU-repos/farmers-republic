import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim() ?? "";
    const q = url.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { buyerName: { $regex: q, $options: "i" } },
        { buyerId: { $regex: q, $options: "i" } },
      ];
    }

    const [total, orders] = await Promise.all([
      OrderModel.countDocuments(filter),
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("buyerName buyerPhone total status paymentStatus items createdAt")
        .lean(),
    ]);

    const items = orders.map((o: any) => ({
      id: String(o._id),
      buyerName: o.buyerName ?? "—",
      buyerPhone: o.buyerPhone ?? "",
      total: o.total ?? 0,
      status: o.status ?? "pending",
      paymentStatus: o.paymentStatus ?? "unpaid",
      itemCount: Array.isArray(o.items) ? o.items.length : 0,
      createdAt: o.createdAt,
    }));

    return NextResponse.json(
      success(
        { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } },
        "Orders fetched",
      ),
    );
  } catch (err: any) {
    console.error("Admin list orders error:", err);
    return NextResponse.json(failure("Failed to fetch orders", err?.message), { status: 500 });
  }
}
