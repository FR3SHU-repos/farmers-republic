import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import { HarvestModel } from "@/shared/models/mongodb/harvests/harvest";
import { success, failure } from "@/app/api/v1/utils/responses";
import mongoose from "mongoose";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid harvest id"), { status: 400 });
    }

    await mongoDB();

    const h = await HarvestModel.findById(id).lean() as any;
    if (!h) {
      return NextResponse.json(failure("Harvest not found"), { status: 404 });
    }

    const remainingQty = Math.max(0, (h.expectedQty ?? 0) - (h.totalPreBooked ?? 0));

    return NextResponse.json(
      success({
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
        remainingQty,
        status: h.status,
        images: h.images ?? [],
        notes: h.notes,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      }),
    );
  } catch (err: any) {
    console.error("GET /api/v1/harvests/[id] error:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid harvest id"), { status: 400 });
    }

    await mongoDB();

    const body = await req.json();

    const allowed = [
      "crop", "variety", "description", "expectedQty", "unit",
      "estimatedPrice", "harvestDate", "preBookDeadline", "minPreBookQty",
      "maxPreBookQty", "status", "images", "notes", "farmerLocation",
    ];

    const update: any = {};
    for (const field of allowed) {
      if (body[field] !== undefined) {
        if (field === "harvestDate" || field === "preBookDeadline") {
          update[field] = new Date(body[field]);
        } else if (["expectedQty", "estimatedPrice", "minPreBookQty", "maxPreBookQty"].includes(field)) {
          update[field] = Number(body[field]);
        } else {
          update[field] = body[field];
        }
      }
    }

    const current = await HarvestModel.findById(id).lean() as any;
    if (!current) {
      return NextResponse.json(failure("Harvest not found"), { status: 404 });
    }

    const newExpectedQty = update.expectedQty ?? current.expectedQty;
    const totalBooked = current.totalPreBooked ?? 0;

    if (totalBooked >= newExpectedQty && update.status !== "cancelled" && update.status !== "harvested") {
      update.status = "fully_booked";
    }

    const updated = await HarvestModel.findByIdAndUpdate(id, update, { new: true }).lean() as any;
    if (!updated) {
      return NextResponse.json(failure("Harvest not found"), { status: 404 });
    }

    return NextResponse.json(
      success({
        id: String(updated._id),
        farmerId: String(updated.farmerId),
        farmerName: updated.farmerName,
        farmerLocation: updated.farmerLocation,
        crop: updated.crop,
        variety: updated.variety,
        description: updated.description,
        expectedQty: updated.expectedQty,
        unit: updated.unit,
        estimatedPrice: updated.estimatedPrice,
        currency: updated.currency,
        harvestDate: updated.harvestDate,
        preBookDeadline: updated.preBookDeadline,
        minPreBookQty: updated.minPreBookQty,
        maxPreBookQty: updated.maxPreBookQty,
        totalPreBooked: updated.totalPreBooked ?? 0,
        status: updated.status,
        images: updated.images ?? [],
        notes: updated.notes,
        updatedAt: updated.updatedAt,
      }, "Harvest updated"),
    );
  } catch (err: any) {
    console.error("PATCH /api/v1/harvests/[id] error:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid harvest id"), { status: 400 });
    }

    await mongoDB();

    const updated = await HarvestModel.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true },
    ).lean() as any;

    if (!updated) {
      return NextResponse.json(failure("Harvest not found"), { status: 404 });
    }

    return NextResponse.json(
      success({ id: String(updated._id), status: "cancelled" }, "Harvest cancelled"),
    );
  } catch (err: any) {
    console.error("DELETE /api/v1/harvests/[id] error:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}
