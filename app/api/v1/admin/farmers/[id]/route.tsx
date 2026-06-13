import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await mongoDB();
    const { id } = await context.params;

    const farmer = await FarmerModel.findById(id).lean();

    if (!farmer) {
      return NextResponse.json(failure("Farmer not found"), { status: 404 });
    }

    return NextResponse.json(
      success({ farmer: { ...(farmer as any), id: String((farmer as any)._id) } }, "Farmer fetched"),
    );
  } catch (err: any) {
    console.error("Admin get farmer error:", err);
    return NextResponse.json(failure("Failed to fetch farmer", err?.message), { status: 500 });
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

    if (body.kycStatus !== undefined) {
      update.kycStatus = body.kycStatus;
      if (body.kycStatus === "verified") update.verified = true;
      if (body.kycStatus === "rejected") update.verified = false;
    }
    if (body.verified !== undefined) update.verified = body.verified;
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.isActive !== undefined) update.active = body.isActive;

    const updated = await FarmerModel.findByIdAndUpdate(id, update, { new: true }).lean();

    if (!updated) {
      return NextResponse.json(failure("Farmer not found"), { status: 404 });
    }

    return NextResponse.json(
      success(
        { farmer: { ...(updated as any), id: String((updated as any)._id) } },
        "Farmer updated",
      ),
    );
  } catch (err: any) {
    console.error("Admin patch farmer error:", err);
    return NextResponse.json(failure("Failed to update farmer", err?.message), { status: 500 });
  }
}
