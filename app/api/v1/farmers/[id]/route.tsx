// app/api/v1/farmers/[id]/route.tsx

// app/api/v1/farmers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses"; // adjust path if needed
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

// Get farmer by ID

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await mongoDB();
    const { id } = params;
    if (!id) return NextResponse.json(failure("Missing id"), { status: 400 });

    // validate ObjectId-like id (if using ObjectId)
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid id"), { status: 400 });
    }

    const farmer = await FarmerModel.findById(id).select("-__v").lean().exec();
    if (!farmer) return NextResponse.json(failure("Farmer not found"), { status: 404 });

    return NextResponse.json(success(farmer, "Farmer fetched"));
  } catch (err: any) {
    console.error("Get farmer error:", err);
    return NextResponse.json(failure("Failed to fetch farmer", err?.message || err), { status: 500 });
  }
}


// Patch (update) farmer by ID
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await mongoDB();
    const { id } = params;
    if (!id) return NextResponse.json(failure("Missing id param"), { status: 400 });

    const body = await req.json();

    const updates: any = {};
    const allowed = [
      "name", "farmName", "farmArea", "crops", "products", "fpo", "swadeshiPercent",
      "place", "phone", "avatar", "photoPath", "about", "established", "certifications", "last30daysSales"
    ];
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }

    // Normalize crops if comma string
    if (updates.crops && !Array.isArray(updates.crops)) {
      updates.crops = String(updates.crops).split(",").map((s) => s.trim());
    }

    const updated = await FarmerModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select("-__v");
    if (!updated) return NextResponse.json(failure("Farmer not found"), { status: 404 });

    return NextResponse.json(success(updated, "Farmer updated"));
  } catch (err: any) {
    console.error("Update farmer error:", err);
    return NextResponse.json(failure("Failed to update farmer", err?.message || err), { status: 500 });
  }
}
