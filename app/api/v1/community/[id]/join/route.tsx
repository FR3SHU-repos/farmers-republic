import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongoDB } from "@/shared/lib/db/mongo";
import { CommunityGroupModel } from "@/shared/models/mongodb/community/communityGroup";
import { success, failure } from "@/app/api/v1/utils/responses";

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
    const { joinCode, userId, userName } = body;

    if (!joinCode || !userId) {
      return NextResponse.json(failure("joinCode and userId are required"), { status: 400 });
    }

    const group = await CommunityGroupModel.findById(id);
    if (!group) return NextResponse.json(failure("Group not found"), { status: 404 });
    if (!group.isActive) return NextResponse.json(failure("Group is not active"), { status: 400 });

    if (group.joinCode !== joinCode.toUpperCase()) {
      return NextResponse.json(failure("Invalid join code"), { status: 400 });
    }

    const alreadyMember = (group.members as any[]).some(
      (m) => String(m.userId) === String(userId),
    );
    if (alreadyMember) {
      return NextResponse.json(failure("Already a member of this group"), { status: 409 });
    }

    group.members.push({ userId, userName: userName ?? "", joinedAt: new Date() });
    group.memberCount = (group.memberCount ?? 0) + 1;
    await group.save();

    return NextResponse.json(
      success({
        joined: true,
        groupId: String(group._id),
        groupName: group.name,
        memberCount: group.memberCount,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(failure("Failed to join group", err?.message), { status: 500 });
  }
}

export async function DELETE(
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(failure("userId is required"), { status: 400 });
    }

    const group = await CommunityGroupModel.findById(id);
    if (!group) return NextResponse.json(failure("Group not found"), { status: 404 });

    const before = (group.members as any[]).length;
    group.members = (group.members as any[]).filter(
      (m) => String(m.userId) !== String(userId),
    ) as typeof group.members;
    const after = (group.members as any[]).length;

    if (before === after) {
      return NextResponse.json(failure("User is not a member"), { status: 404 });
    }

    group.memberCount = Math.max(0, (group.memberCount ?? before) - 1);
    await group.save();

    return NextResponse.json(success({ left: true }));
  } catch (err: any) {
    return NextResponse.json(failure("Failed to leave group", err?.message), { status: 500 });
  }
}
