// app/api/v1/products/by-farmer/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import ProductModel from "@/shared/models/mongodb/products/products";
import { mongoDB } from "@/shared/lib/db/mongo";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }   // 👈 note the Promise here
) {
  try {
    await mongoDB();

    const { id: farmerId } = await context.params;  // 👈 await params

    const products = await ProductModel.find({ farmerId })
      .select("name price image farmerId")
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
