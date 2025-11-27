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
