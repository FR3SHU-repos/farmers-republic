import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongoDB } from "@/shared/lib/db/mongo";
import { GroupOrderModel } from "@/shared/models/mongodb/community/groupOrder";
import { success, failure } from "@/app/api/v1/utils/responses";

type Ctx = { params: Promise<{ id: string; orderId: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  try {
    const { orderId } = await context.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(failure("Invalid order id"), { status: 400 });
    }

    await mongoDB();

    const order = await GroupOrderModel.findById(orderId).lean();
    if (!order) return NextResponse.json(failure("Group order not found"), { status: 404 });

    return NextResponse.json(
      success({ id: String((order as any)._id), ...order }),
    );
  } catch (err: any) {
    return NextResponse.json(failure("Failed to fetch group order", err?.message), { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    const { orderId } = await context.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(failure("Invalid order id"), { status: 400 });
    }

    await mongoDB();

    const body = await req.json();
    const allowed = ["title", "description", "deadline", "deliveryLocation", "deliveryFee", "notes", "status", "items"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (update.deadline) update.deadline = new Date(update.deadline as string);

    const updated = await GroupOrderModel.findByIdAndUpdate(
      orderId,
      update,
      { new: true, runValidators: true },
    ).lean();
    if (!updated) return NextResponse.json(failure("Group order not found"), { status: 404 });

    return NextResponse.json(
      success({ id: String((updated as any)._id), ...updated }),
    );
  } catch (err: any) {
    return NextResponse.json(failure("Failed to update group order", err?.message), { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: Ctx) {
  try {
    const { orderId } = await context.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(failure("Invalid order id"), { status: 400 });
    }

    await mongoDB();

    const deleted = await GroupOrderModel.findByIdAndDelete(orderId).lean();
    if (!deleted) return NextResponse.json(failure("Group order not found"), { status: 404 });

    return NextResponse.json(success({ deleted: true, id: orderId }));
  } catch (err: any) {
    return NextResponse.json(failure("Failed to delete group order", err?.message), { status: 500 });
  }
}
