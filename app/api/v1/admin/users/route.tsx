import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const type = url.searchParams.get("type")?.trim() ?? "";
    const isActiveParam = url.searchParams.get("isActive");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
    if (type) filter.type = type;
    if (isActiveParam !== null && isActiveParam !== "") {
      filter.isActive = isActiveParam === "true";
    }

    const [total, users] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name email type isActive subscription phoneNumber createdAt")
        .lean(),
    ]);

    const items = users.map((u: any) => ({
      id: String(u._id),
      name: u.name ?? "",
      email: u.email,
      type: u.type ?? "",
      isActive: u.isActive ?? true,
      subscription: u.subscription ?? "Free User",
      phoneNumber: u.phoneNumber ?? "",
      createdAt: u.createdAt,
    }));

    return NextResponse.json(
      success(
        {
          items,
          meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
        },
        "Users fetched",
      ),
    );
  } catch (err: any) {
    console.error("Admin list users error:", err);
    return NextResponse.json(failure("Failed to fetch users", err?.message), { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();
    const { userId, isActive, type, subscription } = body;

    if (!userId) {
      return NextResponse.json(failure("userId is required"), { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (type !== undefined) update.type = type;
    if (subscription !== undefined) update.subscription = subscription;

    const updated = await UserModel.findByIdAndUpdate(userId, update, { new: true })
      .select("name email type isActive subscription phoneNumber createdAt")
      .lean();

    if (!updated) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    return NextResponse.json(success({ user: updated }, "User updated"));
  } catch (err: any) {
    console.error("Admin patch user error:", err);
    return NextResponse.json(failure("Failed to update user", err?.message), { status: 500 });
  }
}
