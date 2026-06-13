import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import { HarvestModel } from "@/shared/models/mongodb/harvests/harvest";
import { success, failure } from "@/app/api/v1/utils/responses";
import mongoose from "mongoose";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const farmerId = url.searchParams.get("farmerId") ?? "";
    const crop = url.searchParams.get("crop") ?? "";
    const statusParam = url.searchParams.get("status") ?? "open";
    const pageParam = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limitParam = parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (farmerId) {
      try {
        filter.farmerId = new mongoose.Types.ObjectId(farmerId);
      } catch {
        filter.farmerId = farmerId;
      }
    }

    if (crop) {
      filter.crop = { $regex: crop, $options: "i" };
    }

    if (statusParam) {
      filter.status = statusParam;
    }

    if (statusParam === "open") {
      filter.harvestDate = { $gte: new Date() };
    }

    const total = await HarvestModel.countDocuments(filter);
    const docs = await HarvestModel.find(filter)
      .sort({ harvestDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const items = docs.map((h: any) => ({
      id: String(h._id),
      farmerId: String(h.farmerId),
      farmerName: h.farmerName,
      farmerLocation: h.farmerLocation,
      crop: h.crop,
      variety: h.variety,
      description: h.description,
      expectedQty: h.expectedQty,
      unit: h.unit,
      estimatedPrice: h.estimatedPrice,
      currency: h.currency,
      harvestDate: h.harvestDate,
      preBookDeadline: h.preBookDeadline,
      minPreBookQty: h.minPreBookQty,
      maxPreBookQty: h.maxPreBookQty,
      totalPreBooked: h.totalPreBooked ?? 0,
      status: h.status,
      images: h.images ?? [],
      notes: h.notes,
      createdAt: h.createdAt,
    }));

    return NextResponse.json(
      success(
        {
          items,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        },
        "Harvests fetched",
      ),
    );
  } catch (err: any) {
    console.error("GET /api/v1/harvests error:", err);
    return NextResponse.json(failure("Failed to fetch harvests", err?.message), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    if (!body?.farmerId || !body?.crop || body?.expectedQty == null || !body?.harvestDate || body?.estimatedPrice == null) {
      return NextResponse.json(
        failure("farmerId, crop, expectedQty, harvestDate and estimatedPrice are required"),
        { status: 400 },
      );
    }

    let farmerObjectId: mongoose.Types.ObjectId;
    try {
      farmerObjectId = new mongoose.Types.ObjectId(body.farmerId);
    } catch {
      return NextResponse.json(failure("Invalid farmerId"), { status: 400 });
    }

    const doc: any = {
      farmerId: farmerObjectId,
      farmerName: body.farmerName,
      farmerLocation: body.farmerLocation,
      crop: body.crop,
      variety: body.variety,
      description: body.description,
      expectedQty: Number(body.expectedQty),
      unit: body.unit || "kg",
      estimatedPrice: Number(body.estimatedPrice),
      currency: body.currency || "INR",
      harvestDate: new Date(body.harvestDate),
      preBookDeadline: body.preBookDeadline ? new Date(body.preBookDeadline) : undefined,
      minPreBookQty: body.minPreBookQty != null ? Number(body.minPreBookQty) : 1,
      maxPreBookQty: body.maxPreBookQty != null ? Number(body.maxPreBookQty) : undefined,
      status: body.status || "open",
      images: Array.isArray(body.images) ? body.images : [],
      notes: body.notes,
    };

    const created = await HarvestModel.create(doc);

    return NextResponse.json(
      success(
        {
          id: String(created._id),
          ...created.toObject({ versionKey: false }),
        },
        "Harvest announced",
      ),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/v1/harvests error:", err);
    return NextResponse.json(failure("Failed to create harvest", err?.message), { status: 500 });
  }
}
