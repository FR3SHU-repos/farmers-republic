import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await mongoDB();
    const { id } = await context.params;

    const [user, orderCount] = await Promise.all([
      UserModel.findById(id)
        .select("-passwordHash")
        .lean(),
      OrderModel.countDocuments({ buyerId: id }),
    ]);

    if (!user) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    return NextResponse.json(
      success({ user: { ...(user as any), id: String((user as any)._id) }, orderCount }, "User fetched"),
    );
  } catch (err: any) {
    console.error("Admin get user error:", err);
    return NextResponse.json(failure("Failed to fetch user", err?.message), { status: 500 });
  }
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
    const allowedFields = ["isActive", "type", "subscription", "subscriptionValidUntil"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    const updated = await UserModel.findByIdAndUpdate(id, update, { new: true })
      .select("-passwordHash")
      .lean();

    if (!updated) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    return NextResponse.json(
      success({ user: { ...(updated as any), id: String((updated as any)._id) } }, "User updated"),
    );
  } catch (err: any) {
    console.error("Admin patch user[id] error:", err);
    return NextResponse.json(failure("Failed to update user", err?.message), { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await mongoDB();
    const { id } = await context.params;

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    )
      .select("_id isActive")
      .lean();

    if (!updated) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    return NextResponse.json(success({ id }, "User deactivated"));
  } catch (err: any) {
    console.error("Admin delete user error:", err);
    return NextResponse.json(failure("Failed to deactivate user", err?.message), { status: 500 });
  }
}
