// This is for adapted farmers routes
// app/api/v1/farmers/adapted/route.ts

import { NextRequest, NextResponse } from "next/server";
import { AdaptedFarmerModel } from "@/shared/models/mongodb/adapt";
import { mongoDB } from "@/shared/lib/db/mongo";
import  FarmerModel  from "@/shared/models/mongodb/farmer";

type AdaptedFarmerLean = {
  _id: any;
  buyerId: string;
  farmerId: string;
};

type FarmerLean = {
  _id: any;
  name: string;
  farmName?: string;
  farmArea?: string;
  category?: string;
  avatar?: string;
  about?: string;
  place?: string;
  phone?: string;
  last30daysSales?: number;
};

export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const { buyerId, farmerId } = await req.json();

    if (!buyerId || !farmerId) {
      return NextResponse.json(
        { message: "buyerId and farmerId are required" },
        { status: 400 }
      );
    }

    try {
      const created = await AdaptedFarmerModel.create({ buyerId, farmerId });

      return NextResponse.json(
        {
          message: "Farmer adapted successfully",
          adaptedFarmer: {
            id: created._id.toString(),
            buyerId: created.buyerId,
            farmerId: created.farmerId,
          },
        },
        { status: 201 }
      );
    } catch (err: any) {
      // Duplicate key error from unique index
      if (err.code === 11000) {
        const existing = await AdaptedFarmerModel.findOne({ buyerId, farmerId })
          .lean<AdaptedFarmerLean | null>();

        return NextResponse.json(
          {
            message: "Farmer already adapted for this buyer",
            adaptedFarmer: existing
              ? {
                  id: existing._id.toString(),
                  buyerId: existing.buyerId,
                  farmerId: existing.farmerId,
                }
              : null,
          },
          { status: 200 }
        );
      }

      throw err;
    }
  } catch (error) {
    console.error("Error adapting farmer:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// app/api/v1/farmers/adapted/route.ts

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");

    if (!buyerId) {
      return NextResponse.json(
        { message: "buyerId query parameter is required" },
        { status: 400 }
      );
    }

    // 1) Get adapted farmer links for this buyer
    const links = await AdaptedFarmerModel.find({ buyerId }).lean<AdaptedFarmerLean[]>();

    if (links.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const farmerIds = links.map((l) => l.farmerId);

    // 2) ✅ Fetch farmers from FarmerModel, not AdaptedFarmerModel
    const farmers = await FarmerModel.find({ _id: { $in: farmerIds } })
      .select("name farmName farmArea category avatar about place phone last30daysSales")
      .lean<FarmerLean[]>();

    // 3) Index farmers by id
    const farmerById = new Map<string, FarmerLean>(
      farmers.map((f) => [String(f._id), f])
    );

    // 4) Build response
    const result = links.map((link) => {
      const f = farmerById.get(String(link.farmerId));

      return {
        id: String(link._id),
        buyerId: link.buyerId,
        farmerId: link.farmerId,
        farmer: f
          ? {
              id: String(f._id),
              name: f.name,
              farmName: f.farmName ?? "",
              farmArea: f.farmArea ?? "",
              category: f.category ?? "",
              avatar: f.avatar ?? "",
              about: f.about ?? "",
              place: f.place ?? "",
              phone: f.phone ?? "",
              last30daysSales: f.last30daysSales ?? 0,
            }
          : null,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching adapted farmers:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

