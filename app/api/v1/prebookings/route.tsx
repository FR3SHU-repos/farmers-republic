import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import { PreBookModel } from "@/shared/models/mongodb/harvests/preBook";
import { success, failure } from "@/app/api/v1/utils/responses";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const buyerId = url.searchParams.get("buyerId") ?? "";
    const buyerPhone = url.searchParams.get("buyerPhone") ?? "";
    const status = url.searchParams.get("status") ?? "";

    if (!buyerId && !buyerPhone) {
      return NextResponse.json(failure("buyerId or buyerPhone is required"), { status: 400 });
    }

    const filter: any = {};

    if (buyerId && mongoose.isValidObjectId(buyerId)) {
      filter.buyerId = new mongoose.Types.ObjectId(buyerId);
    } else if (buyerPhone) {
      filter.buyerPhone = buyerPhone;
    }

    if (status) {
      filter.status = status;
    }

    const docs = await PreBookModel.find(filter).sort({ createdAt: -1 }).lean().exec();

    const items = docs.map((p: any) => ({
      id: String(p._id),
      harvestId: String(p.harvestId),
      cropName: p.cropName,
      harvestDate: p.harvestDate,
      farmerId: String(p.farmerId),
      qty: p.qty,
      unit: p.unit,
      priceAtBooking: p.priceAtBooking,
      estimatedTotal: p.estimatedTotal,
      status: p.status,
      note: p.note,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(success({ items, meta: { total: items.length } }, "Pre-bookings fetched"));
  } catch (err: any) {
    console.error("GET /api/v1/prebookings error:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}
