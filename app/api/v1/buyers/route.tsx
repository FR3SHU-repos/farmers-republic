// This is for creating profile for buyers

// app/api/v1/buyers/route.tsx

import { NextRequest, NextResponse } from "next/server";
import BuyerModel from "@/shared/models/mongodb/buyer";
import { mongoDB } from "@/shared/lib/db/mongo";

export async function POST(req: NextRequest) {
  try {
    mongoDB();

    const body = await req.json();

    // Basic required fields check
    if (!body.name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );
    }

    // Optional: enforce minimal address structure
    if (
      !body.address ||
      !body.address.line1 ||
      !body.address.city ||
      !body.address.pincode
    ) {
      return NextResponse.json(
        {
          message:
            "Address with line1, city and pincode is required for buyer profile",
        },
        { status: 400 },
      );
    }

    const buyer = await BuyerModel.create({
      profileId: body.profileId, // if you're passing auth user id, etc
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: {
        line1: body.address.line1,
        line2: body.address.line2,
        city: body.address.city,
        state: body.address.state,
        pincode: body.address.pincode,
      },
      avatar: body.avatar,
      photoPath: body.photoPath,
      about: body.about,
    });

    return NextResponse.json(
      {
        message: "Buyer created successfully",
        data: buyer,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/v1/buyers error:", err);
    return NextResponse.json(
      {
        message: err?.message || "Failed to create buyer",
      },
      { status: 500 },
    );
  }
}


// ✅ GET buyer profile
// Supports either:
//   /api/v1/buyers?profileId=<auth-user-id>   (most useful)
// or
//   /api/v1/buyers?id=<buyer-mongo-id>
export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const id = searchParams.get("id");
    const profileId = searchParams.get("profileId");

    if (!id && !profileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Either id or profileId query parameter is required",
        },
        { status: 400 }
      );
    }

    const query: any = {};
    if (id) query._id = id;
    if (profileId) query.profileId = profileId;

    const buyer = await BuyerModel.findOne(query).lean();

    if (!buyer) {
      return NextResponse.json(
        { success: false, message: "Buyer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          buyerId: String((buyer as any)._id),
          buyer,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/v1/buyers error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch buyer",
      },
      { status: 500 }
    );
  }
}