// app/api/v1/farmers/[id]/route.tsx

// app/api/v1/farmers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses"; // adjust path if needed
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

// Get farmer by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // <-- note the Promise here
) {
  const { id } = await context.params;
  return proxyCatalogueGET(req, `/farmers/${encodeURIComponent(id)}`);
  /* Legacy direct read is unreachable pending write migration.
  try {
    // await the params promise per Next 15 requirement
    const { params } = context;
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid farmer id"), { status: 400 });
    }

    await mongoDB();

    const farmer = await FarmerModel.findById(id).lean().select("-__v -passwordHash");
    if (!farmer) return NextResponse.json(failure("Not found"), { status: 404 });

    return NextResponse.json(success(farmer));
  } catch (err: any) {
    console.error("Error in GET /api/v1/farmers/[id]:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
  */
}


// Patch (update) farmer by ID
export async function PATCH(req: NextRequest, { params }: { params:Promise< { id: string }> }) {
  try {
    await mongoDB();
    const { id } = await params;
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
