import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

/**
 * @deprecated Compatibility route; Go owns order-detail reads (GET
 * /api/v1/orders/{id}, which already allows Admin as a viewer). The response
 * is no longer wrapped in an `order` key — callers now read `data` directly.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyCatalogueGET(_req, `/orders/${encodeURIComponent(id)}`);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await mongoDB();
    const { id } = await context.params;
    const body = await req.json();

    const update: Record<string, unknown> = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.paymentStatus !== undefined) update.paymentStatus = body.paymentStatus;
    if (body.adminNote !== undefined) update.adminNote = body.adminNote;

    const updated = await OrderModel.findByIdAndUpdate(id, update, { new: true }).lean();

    if (!updated) {
      return NextResponse.json(failure("Order not found"), { status: 404 });
    }

    return NextResponse.json(
      success(
        { order: { ...(updated as any), id: String((updated as any)._id) } },
        "Order updated",
      ),
    );
  } catch (err: any) {
    console.error("Admin patch order error:", err);
    return NextResponse.json(failure("Failed to update order", err?.message), { status: 500 });
  }
}
