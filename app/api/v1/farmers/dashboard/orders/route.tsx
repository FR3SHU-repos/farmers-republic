// api/v1/farmers/dashboard/orders/route.tsx

// app/api/v1/orders/farmer/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/farmerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get("farmerId");

    if (!farmerId) {
      return NextResponse.json(failure("farmerId is required"), {
        status: 400,
      });
    }

    await mongoDB();

    const docs = await OrderModel.find({ farmerId })
      .sort({ createdAt: -1 })
      .select(
        "customerName customerPhone total subtotal deliveryFee status paymentStatus paymentMode source createdAt items"
      )
      .lean()
      .exec();

    const orders = docs.map((o: any) => ({
      id: String(o._id),
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      total: o.total,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMode: o.paymentMode,
      source: o.source,
      createdAt: o.createdAt,
      itemsCount: Array.isArray(o.items) ? o.items.length : 0,
    }));

    return NextResponse.json(
      success({ orders }, "Farmer orders fetched"),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("farmer orders list error:", err);
    return NextResponse.json(
      failure("Failed to fetch farmer orders", err?.message || err),
      { status: 500 }
    );
  }
}
