import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const kycStatus = url.searchParams.get("kycStatus")?.trim() ?? "";
    const q = url.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (kycStatus) filter.kycStatus = kycStatus;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { farmName: { $regex: q, $options: "i" } },
        { district: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const [total, farmers] = await Promise.all([
      FarmerModel.countDocuments(filter),
      FarmerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name farmName phone district state kycStatus verified avatar createdAt")
        .lean(),
    ]);

    const items = await Promise.all(
      farmers.map(async (f: any) => {
        const productCount = await ProductModel.countDocuments({ farmerId: f._id });
        return {
          id: String(f._id),
          name: f.name,
          farmName: f.farmName ?? "",
          phone: f.phone ?? "",
          district: f.district ?? "",
          state: f.state ?? "",
          kycStatus: f.kycStatus ?? "pending",
          verified: f.verified ?? false,
          avatar: f.avatar ?? null,
          createdAt: f.createdAt,
          productCount,
        };
      }),
    );

    return NextResponse.json(
      success(
        { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } },
        "Farmers fetched",
      ),
    );
  } catch (err: any) {
    console.error("Admin list farmers error:", err);
    return NextResponse.json(failure("Failed to fetch farmers", err?.message), { status: 500 });
  }
}
