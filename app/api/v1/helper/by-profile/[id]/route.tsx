// app/api/v1/helper/by-profile/[id]/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await mongoDB();

    const { id } = await context.params; // this is profileId
    const profileId = id;

    console.log("[by-profile] looking for farmer with profileId:", profileId);

    const farmer = await FarmerModel.findOne({ profileId }).lean();

    console.log(
      "[by-profile] query result:",
      farmer ? String((farmer as any)._id) : "NOT FOUND"
    );

    if (!farmer) {
      return NextResponse.json(
        { success: false, message: "Farmer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        farmerId: String((farmer as any)._id),
        farmer,
      },
    });
  } catch (err: any) {
    console.error("[by-profile] error:", err);
    return NextResponse.json(
      { success: false, message: "Error", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
