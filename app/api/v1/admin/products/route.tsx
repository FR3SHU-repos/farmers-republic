import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import ProductModel from "@/shared/models/mongodb/products/products";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim() ?? "";
    const category = url.searchParams.get("category")?.trim() ?? "";
    const q = url.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const [total, products] = await Promise.all([
      ProductModel.countDocuments(filter),
      ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name farmerId price stockQty status category isFeatured image createdAt")
        .lean(),
    ]);

    const items = await Promise.all(
      products.map(async (p: any) => {
        let farmerName = "";
        if (p.farmerId) {
          const farmer = await FarmerModel.findById(p.farmerId).select("name").lean();
          farmerName = (farmer as any)?.name ?? "";
        }
        return {
          id: String(p._id),
          name: p.name,
          farmerId: p.farmerId ? String(p.farmerId) : "",
          farmerName,
          price: p.price ?? 0,
          stockQty: p.stockQty ?? 0,
          status: p.status ?? "draft",
          category: p.category ?? "",
          isFeatured: p.isFeatured ?? false,
          image: p.image ?? null,
          createdAt: p.createdAt,
        };
      }),
    );

    return NextResponse.json(
      success(
        { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } },
        "Products fetched",
      ),
    );
  } catch (err: any) {
    console.error("Admin list products error:", err);
    return NextResponse.json(failure("Failed to fetch products", err?.message), { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();
    const { productId, status, isFeatured } = body;

    if (!productId) {
      return NextResponse.json(failure("productId is required"), { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (status !== undefined) update.status = status;
    if (isFeatured !== undefined) update.isFeatured = isFeatured;

    const updated = await ProductModel.findByIdAndUpdate(productId, update, { new: true })
      .select("name status isFeatured price stockQty category")
      .lean();

    if (!updated) {
      return NextResponse.json(failure("Product not found"), { status: 404 });
    }

    return NextResponse.json(
      success({ product: { ...(updated as any), id: String((updated as any)._id) } }, "Product updated"),
    );
  } catch (err: any) {
    console.error("Admin patch product error:", err);
    return NextResponse.json(failure("Failed to update product", err?.message), { status: 500 });
  }
}
