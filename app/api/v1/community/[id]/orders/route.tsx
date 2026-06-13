import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongoDB } from "@/shared/lib/db/mongo";
import { GroupOrderModel } from "@/shared/models/mongodb/community/groupOrder";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid group id"), { status: 400 });
    }

    await mongoDB();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "12", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { communityGroupId: id };
    if (status) filter.status = status;

    const total = await GroupOrderModel.countDocuments(filter);
    const docs = await GroupOrderModel.find(filter)
      .sort({ deadline: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = docs.map((o: any) => ({
      id: String(o._id),
      communityGroupId: String(o.communityGroupId),
      groupName: o.groupName,
      createdByUserId: String(o.createdByUserId),
      createdByName: o.createdByName,
      title: o.title,
      description: o.description,
      items: o.items,
      deadline: o.deadline,
      deliveryLocation: o.deliveryLocation,
      deliveryFee: o.deliveryFee,
      totalEstimated: o.totalEstimated,
      status: o.status,
      notes: o.notes,
      createdAt: o.createdAt,
    }));

    return NextResponse.json(
      success({ items, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } }),
    );
  } catch (err: any) {
    return NextResponse.json(failure("Failed to fetch group orders", err?.message), { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid group id"), { status: 400 });
    }

    await mongoDB();

    const body = await req.json();
    const {
      communityGroupId,
      createdByUserId,
      createdByName,
      title,
      description,
      items,
      deadline,
      deliveryLocation,
      deliveryFee = 0,
      notes,
      groupName,
    } = body;

    if (!communityGroupId || !createdByUserId || !title || !deadline) {
      return NextResponse.json(
        failure("communityGroupId, createdByUserId, title, and deadline are required"),
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(failure("At least one item is required"), { status: 400 });
    }

    const processedItems = items.map((item: any) => {
      const totalQty = Array.isArray(item.requests)
        ? item.requests.reduce((sum: number, r: any) => sum + (Number(r.qty) || 0), 0)
        : 0;
      return { ...item, totalQty };
    });

    const totalEstimated =
      processedItems.reduce(
        (sum: number, item: any) => sum + item.totalQty * (item.pricePerUnit || 0),
        0,
      ) + (Number(deliveryFee) || 0);

    const doc = await GroupOrderModel.create({
      communityGroupId: id,
      groupName,
      createdByUserId,
      createdByName,
      title,
      description,
      items: processedItems,
      deadline: new Date(deadline),
      deliveryLocation,
      deliveryFee: Number(deliveryFee) || 0,
      totalEstimated,
      status: "open",
      notes,
    });

    return NextResponse.json(
      success({ id: String(doc._id), ...doc.toObject({ versionKey: false }) }, "Group order created"),
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(failure("Failed to create group order", err?.message), { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid group id"), { status: 400 });
    }

    await mongoDB();

    const body = await req.json();
    const { userId, userName, productId, qty, orderId } = body;

    if (!userId || !productId || qty == null || !orderId) {
      return NextResponse.json(
        failure("userId, productId, qty, and orderId are required"),
        { status: 400 },
      );
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(failure("Invalid orderId"), { status: 400 });
    }

    const order = await GroupOrderModel.findById(orderId);
    if (!order) return NextResponse.json(failure("Group order not found"), { status: 404 });

    const itemIndex = (order.items as any[]).findIndex(
      (item: any) => String(item.productId) === String(productId),
    );

    if (itemIndex === -1) {
      return NextResponse.json(failure("Product not found in this group order"), { status: 404 });
    }

    const item = (order.items as any[])[itemIndex];
    const reqIndex = (item.requests as any[]).findIndex(
      (r: any) => String(r.userId) === String(userId),
    );

    if (reqIndex >= 0) {
      item.requests[reqIndex].qty = Number(qty);
    } else {
      item.requests.push({ userId, userName: userName ?? "", qty: Number(qty) });
    }

    item.totalQty = item.requests.reduce((sum: number, r: any) => sum + (Number(r.qty) || 0), 0);

    order.totalEstimated =
      (order.items as any[]).reduce(
        (sum: number, it: any) => sum + it.totalQty * (it.pricePerUnit || 0),
        0,
      ) + (order.deliveryFee || 0);

    order.markModified("items");
    await order.save();

    return NextResponse.json(
      success({ id: String(order._id), ...order.toObject({ versionKey: false }) }),
    );
  } catch (err: any) {
    return NextResponse.json(failure("Failed to update group order", err?.message), { status: 500 });
  }
}
