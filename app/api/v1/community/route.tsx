import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import { CommunityGroupModel } from "@/shared/models/mongodb/community/communityGroup";
import { success, failure } from "@/app/api/v1/utils/responses";

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const exists = await CommunityGroupModel.exists({ joinCode: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique join code");
}

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? "";
    const pincode = url.searchParams.get("pincode") ?? "";
    const q = url.searchParams.get("q") ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "12", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    if (type) filter.type = type;
    if (pincode) filter.pincode = pincode;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    const total = await CommunityGroupModel.countDocuments(filter);
    const docs = await CommunityGroupModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name type description location pincode joinCode adminName memberCount isActive createdAt")
      .lean();

    const items = docs.map((g: any) => ({
      id: String(g._id),
      name: g.name,
      type: g.type,
      description: g.description,
      location: g.location,
      pincode: g.pincode,
      joinCode: g.joinCode,
      adminName: g.adminName,
      memberCount: g.memberCount ?? 1,
      isActive: g.isActive,
      createdAt: g.createdAt,
    }));

    return NextResponse.json(
      success({ items, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } }),
      { status: 200 },
    );
  } catch (err: any) {
    console.error("GET /api/v1/community error:", err);
    return NextResponse.json(failure("Failed to fetch community groups", err?.message), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();
    const { name, type, description, location, pincode, adminUserId, adminName } = body;

    if (!name || !type || !location || !adminUserId) {
      return NextResponse.json(
        failure("name, type, location, and adminUserId are required"),
        { status: 400 },
      );
    }

    const joinCode = await generateUniqueJoinCode();

    const doc = await CommunityGroupModel.create({
      name,
      type,
      description,
      location,
      pincode,
      joinCode,
      adminUserId,
      adminName,
      members: [{ userId: adminUserId, userName: adminName, joinedAt: new Date() }],
      memberCount: 1,
      isActive: true,
    });

    return NextResponse.json(
      success({ id: String(doc._id), ...doc.toObject({ versionKey: false }) }, "Community group created"),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/v1/community error:", err);
    return NextResponse.json(failure("Failed to create community group", err?.message), { status: 500 });
  }
}
