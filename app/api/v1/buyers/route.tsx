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

// 🔧 PATCH buyer profile (update)
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();

    const update: any = {};

    if (typeof body.name === "string") update.name = body.name;
    if (typeof body.phone === "string") update.phone = body.phone;
    if (typeof body.email === "string") update.email = body.email;
    if (typeof body.about === "string") update.about = body.about;
    if (typeof body.avatar === "string") update.avatar = body.avatar;
    if (typeof body.photoPath === "string") update.photoPath = body.photoPath;

    if (body.address) {
      update.address = {};
      if (typeof body.address.line1 === "string") update.address.line1 = body.address.line1;
      if (typeof body.address.line2 === "string") update.address.line2 = body.address.line2;
      if (typeof body.address.city === "string") update.address.city = body.address.city;
      if (typeof body.address.state === "string") update.address.state = body.address.state;
      if (typeof body.address.pincode === "string") update.address.pincode = body.address.pincode;
    }

    const query: any = {};
    if (id) query._id = id;
    if (profileId) query.profileId = profileId;

    const buyer = await BuyerModel.findOneAndUpdate(query, update, {
      new: true,
    }).lean();

    if (!buyer) {
      return NextResponse.json(
        { success: false, message: "Buyer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Buyer updated successfully",
        data: {
          buyerId: String((buyer as any)._id),
          buyer,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH /api/v1/buyers error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to update buyer",
      },
      { status: 500 }
    );
  }
}