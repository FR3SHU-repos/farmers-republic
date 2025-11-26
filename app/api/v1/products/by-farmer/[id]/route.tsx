// This is for getting products by a specific farmer

// app/api/v1/products/by-farmer/route.tsx

import { NextRequest, NextResponse } from "next/server";
import ProductSchema from "@/shared/models/mongodb/products/products";
import { mongoDB } from "@/shared/lib/db/mongo";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoDB();

    const farmerId = params.id;

    const products = await ProductSchema
      .find({ farmerId })
      .lean()
      .exec();

    return NextResponse.json(
      success({ items: products }, "Products fetched")
    );
  } catch (err: any) {
    console.error("Fetch farmer products error:", err);
    return NextResponse.json(
      failure("Failed to fetch products", err?.message || err),
      { status: 500 }
    );
  }
}
