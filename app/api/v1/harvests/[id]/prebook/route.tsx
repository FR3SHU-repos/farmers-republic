import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import { HarvestModel } from "@/shared/models/mongodb/harvests/harvest";
import { PreBookModel } from "@/shared/models/mongodb/harvests/preBook";
import { success, failure } from "@/app/api/v1/utils/responses";
import mongoose from "mongoose";

export async function POST(
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
    const { buyerName, buyerPhone, buyerEmail, qty, buyerId, note } = body;

    if (!buyerName || !buyerPhone || qty == null) {
      return NextResponse.json(
        failure("buyerName, buyerPhone and qty are required"),
        { status: 400 },
      );
    }

    const qtyNum = Number(qty);
    if (isNaN(qtyNum) || qtyNum < 1) {
      return NextResponse.json(failure("qty must be a positive number"), { status: 400 });
    }

    const harvest = await HarvestModel.findById(id).lean() as any;
    if (!harvest) {
      return NextResponse.json(failure("Harvest not found"), { status: 404 });
    }

    if (harvest.status !== "open") {
      return NextResponse.json(failure("This harvest is not open for pre-booking"), { status: 400 });
    }

    const minQty = harvest.minPreBookQty ?? 1;
    if (qtyNum < minQty) {
      return NextResponse.json(
        failure(`Minimum pre-book quantity is ${minQty} ${harvest.unit}`),
        { status: 400 },
      );
    }

    const totalBooked = harvest.totalPreBooked ?? 0;
    const remaining = harvest.expectedQty - totalBooked;

    if (qtyNum > remaining) {
      return NextResponse.json(
        failure(`Only ${remaining} ${harvest.unit} available`),
        { status: 400 },
      );
    }

    const updatedHarvest = await HarvestModel.findOneAndUpdate(
      { _id: id, status: "open" },
      { $inc: { totalPreBooked: qtyNum } },
      { new: true },
    ).lean() as any;

    if (!updatedHarvest) {
      return NextResponse.json(failure("Harvest is no longer available for pre-booking"), { status: 409 });
    }

    const priceAtBooking = harvest.estimatedPrice;
    const estimatedTotal = qtyNum * priceAtBooking;

    let buyerObjectId: mongoose.Types.ObjectId | undefined;
    if (buyerId) {
      try {
        buyerObjectId = new mongoose.Types.ObjectId(buyerId);
      } catch {
        // ignore invalid buyerId
      }
    }

    const preBook = await PreBookModel.create({
      harvestId: new mongoose.Types.ObjectId(id),
      farmerId: harvest.farmerId,
      cropName: harvest.crop,
      harvestDate: harvest.harvestDate,
      buyerId: buyerObjectId,
      buyerName,
      buyerEmail,
      buyerPhone,
      qty: qtyNum,
      unit: harvest.unit,
      priceAtBooking,
      estimatedTotal,
      status: "pending",
      note,
    });

    const newTotal = updatedHarvest.totalPreBooked ?? 0;
    const maxQty = harvest.maxPreBookQty;
    if (maxQty != null && newTotal >= maxQty) {
      await HarvestModel.findByIdAndUpdate(id, { status: "fully_booked" });
    } else if (newTotal >= harvest.expectedQty) {
      await HarvestModel.findByIdAndUpdate(id, { status: "fully_booked" });
    }

    return NextResponse.json(
      success(
        {
          preBookId: String(preBook._id),
          harvestId: id,
          crop: harvest.crop,
          qty: qtyNum,
          estimatedTotal,
          status: "pending",
        },
        "Pre-booking confirmed",
      ),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/v1/harvests/[id]/prebook error:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}
