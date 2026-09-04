import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { SubOrderModel } from "@/shared/models/mongodb/orders/subOrder";
import { goAPIData } from "@/shared/lib/api/server";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid order id"), { status: 400 });
    }

    await mongoDB();

    const order = await OrderModel.findById(id).lean() as any;
    if (!order) return NextResponse.json(failure("Order not found"), { status: 404 });

    const existing = await SubOrderModel.find({ orderId: id }).lean();
    if (existing.length > 0) {
      return NextResponse.json(
        success({ subOrders: existing, count: existing.length }, "Sub-orders already exist"),
      );
    }

    const byFarmer: Record<string, typeof order.items> = {};
    for (const item of order.items ?? []) {
      const fid = item.farmerId ? String(item.farmerId) : "__unknown__";
      if (!byFarmer[fid]) byFarmer[fid] = [];
      byFarmer[fid].push(item);
    }

    const farmerNameCache: Record<string, string> = {};
    const subOrderDocs = await Promise.all(
      Object.entries(byFarmer).map(async ([farmerId, items]) => {
        let farmerName: string | undefined;

        if (farmerId !== "__unknown__" && mongoose.isValidObjectId(farmerId)) {
          if (!farmerNameCache[farmerId]) {
            const farmer = await goAPIData<{ name?: string }>(req, `/farmers/${encodeURIComponent(farmerId)}`).catch(() => null);
            farmerNameCache[farmerId] = farmer?.name ?? "";
          }
          farmerName = farmerNameCache[farmerId];
        }

        const subtotal = (items as any[]).reduce(
          (sum: number, it: any) => sum + (it.price || 0) * (it.qty || 0),
          0,
        );

        return SubOrderModel.create({
          orderId: id,
          farmerId: farmerId !== "__unknown__" ? farmerId : undefined,
          farmerName,
          items: (items as any[]).map((it: any) => ({
            productId: it.productId,
            name: it.name,
            price: it.price,
            qty: it.qty,
            image: it.image,
          })),
          subtotal,
          status: "pending",
        });
      }),
    );

    return NextResponse.json(
      success({ subOrders: subOrderDocs, count: subOrderDocs.length }, "Order split into sub-orders"),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/v1/orders/[id]/split error:", err);
    return NextResponse.json(failure("Failed to split order", err?.message), { status: 500 });
  }
}
