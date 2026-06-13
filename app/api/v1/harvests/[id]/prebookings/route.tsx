import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import { PreBookModel } from "@/shared/models/mongodb/harvests/preBook";
import { success, failure } from "@/app/api/v1/utils/responses";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid harvest id"), { status: 400 });
    }

    await mongoDB();

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") ?? "";
    const farmerId = url.searchParams.get("farmerId") ?? "";

    const filter: any = { harvestId: new mongoose.Types.ObjectId(id) };

    if (farmerId) {
      try {
        filter.farmerId = new mongoose.Types.ObjectId(farmerId);
      } catch {
        filter.farmerId = farmerId;
      }
    }

    if (statusFilter) {
      filter.status = statusFilter;
    }

    const docs = await PreBookModel.find(filter).sort({ createdAt: -1 }).lean().exec();
    const total = docs.length;

    const items = docs.map((p: any) => ({
      id: String(p._id),
      buyerName: p.buyerName,
      buyerPhone: p.buyerPhone,
      buyerEmail: p.buyerEmail,
      qty: p.qty,
      unit: p.unit,
      priceAtBooking: p.priceAtBooking,
      estimatedTotal: p.estimatedTotal,
      status: p.status,
      note: p.note,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(
      success({ items, meta: { total } }, "Pre-bookings fetched"),
    );
  } catch (err: any) {
    console.error("GET /api/v1/harvests/[id]/prebookings error:", err);
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
    const { preBookId, status } = body;

    if (!preBookId || !status) {
      return NextResponse.json(failure("preBookId and status are required"), { status: 400 });
    }

    const validStatuses = ["confirmed", "fulfilled", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(failure("Invalid status"), { status: 400 });
    }

    if (!mongoose.isValidObjectId(preBookId)) {
      return NextResponse.json(failure("Invalid preBookId"), { status: 400 });
    }

    const updated = await PreBookModel.findOneAndUpdate(
      { _id: preBookId, harvestId: new mongoose.Types.ObjectId(id) },
      { status },
      { new: true },
    ).lean() as any;

    if (!updated) {
      return NextResponse.json(failure("Pre-booking not found"), { status: 404 });
    }

    return NextResponse.json(
      success(
        {
          id: String(updated._id),
          status: updated.status,
          buyerName: updated.buyerName,
          qty: updated.qty,
          estimatedTotal: updated.estimatedTotal,
        },
        "Pre-booking updated",
      ),
    );
  } catch (err: any) {
    console.error("PATCH /api/v1/harvests/[id]/prebookings error:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}
