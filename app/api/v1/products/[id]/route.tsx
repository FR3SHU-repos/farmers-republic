// app/api/v1/products/[id]/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses"; // adjust path if needed
import mongoose from "mongoose";

// Get product by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // <-- note the Promise here
) {
  try {
    // await the params promise per Next 15 requirement
    const { params } = context;
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid product id"), { status: 400 });
    }

    await mongoDB();

    const product = await ProductModel.findById(id).lean().select("-__v");
    if (!product) return NextResponse.json(failure("Not found"), { status: 404 });
    
    return NextResponse.json(success(product));
  } catch (err: any) {
    console.error("Error in GET /api/v1/products/[id]:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}

// Patch (update) product by ID
export async function PATCH(req: NextRequest, { params }: { params:Promise< { id: string }> }) {
  try {
    await mongoDB();
    const { id } = await params;
    if (!id) return NextResponse.json(failure("Missing id param"), { status: 400 });

    const body = await req.json();

    const updates: any = {};
    const allowed = [
      "name", "image", "images", "price", "rating", "reviewsCount", "sourceFrom",
      "purchasedLast30Days", "farmer", "swadeshiPercent", "healthBenefits",
      "timeToSupply", "tags", "fssai", "shelfLife", "description", "category", "badge"
    ];
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }

    // Normalize healthBenefits and tags if comma string
    if (updates.healthBenefits && !Array.isArray(updates.healthBenefits)) {
      updates.healthBenefits = String(updates.healthBenefits).split(",").map((s) => s.trim());
    }
    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = String(updates.tags).split(",").map((s) => s.trim());
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(id, updates, { new: true }).lean().select("-__v");
    if (!updatedProduct) return NextResponse.json(failure("Not found"), { status: 404 });

    return NextResponse.json(success(updatedProduct));
  } catch (err: any) {
    console.error("Error in PATCH /api/v1/products/[id]:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}