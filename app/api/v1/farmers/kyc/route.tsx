import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const farmerId = url.searchParams.get("farmerId")?.trim();

    if (!farmerId) {
      return NextResponse.json(failure("farmerId is required"), { status: 400 });
    }

    const farmer = await FarmerModel.findById(farmerId)
      .select(
        "aadhaarNumber aadhaarDocUrl panNumber panDocUrl bankAccountHolderName bankAccountNumber bankIFSC bankName fssaiLicense fssaiDocUrl organicCertified kycStatus notes createdAt updatedAt",
      )
      .lean();

    if (!farmer) {
      return NextResponse.json(failure("Farmer not found"), { status: 404 });
    }

    return NextResponse.json(
      success({ kyc: { ...(farmer as any), id: String((farmer as any)._id) } }, "KYC fetched"),
    );
  } catch (err: any) {
    console.error("KYC GET error:", err);
    return NextResponse.json(failure("Failed to fetch KYC", err?.message), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();
    const { farmerId, ...kycFields } = body;

    if (!farmerId) {
      return NextResponse.json(failure("farmerId is required"), { status: 400 });
    }

    const allowedKycFields = [
      "aadhaarNumber",
      "aadhaarDocUrl",
      "panNumber",
      "panDocUrl",
      "bankAccountHolderName",
      "bankAccountNumber",
      "bankIFSC",
      "bankName",
      "fssaiLicense",
      "fssaiDocUrl",
      "landDocUrl",
      "organicCertified",
    ];

    const update: Record<string, unknown> = { kycStatus: "submitted" };
    for (const field of allowedKycFields) {
      if (kycFields[field] !== undefined) update[field] = kycFields[field];
    }

    const updated = await FarmerModel.findByIdAndUpdate(farmerId, update, { new: true })
      .select("kycStatus updatedAt")
      .lean();

    if (!updated) {
      return NextResponse.json(failure("Farmer not found"), { status: 404 });
    }

    return NextResponse.json(
      success(
        { kycStatus: "submitted", updatedAt: (updated as any).updatedAt },
        "KYC submitted successfully",
      ),
    );
  } catch (err: any) {
    console.error("KYC POST error:", err);
    return NextResponse.json(failure("Failed to submit KYC", err?.message), { status: 500 });
  }
}
