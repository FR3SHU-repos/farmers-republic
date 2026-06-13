import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongoDB } from "@/shared/lib/db/mongo";
import { CommunityGroupModel } from "@/shared/models/mongodb/community/communityGroup";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid group id"), { status: 400 });
    }

    await mongoDB();

    const group = await CommunityGroupModel.findById(id).lean();
    if (!group) return NextResponse.json(failure("Group not found"), { status: 404 });

    return NextResponse.json(
      success({ id: String((group as any)._id), ...group }),
    );
  } catch (err: any) {
    return NextResponse.json(failure("Failed to fetch group", err?.message), { status: 500 });
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
    const allowed = ["name", "description", "location", "pincode", "isActive", "notes"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const updated = await CommunityGroupModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return NextResponse.json(failure("Group not found"), { status: 404 });

    return NextResponse.json(success({ id: String((updated as any)._id), ...updated }));
  } catch (err: any) {
    return NextResponse.json(failure("Failed to update group", err?.message), { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid group id"), { status: 400 });
    }

    await mongoDB();

    const updated = await CommunityGroupModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    ).lean();
    if (!updated) return NextResponse.json(failure("Group not found"), { status: 404 });

    return NextResponse.json(success({ id: String((updated as any)._id), isActive: false }));
  } catch (err: any) {
    return NextResponse.json(failure("Failed to deactivate group", err?.message), { status: 500 });
  }
}
