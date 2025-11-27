// app/api/v1/farmers/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    if (!body?.name) {
      return NextResponse.json(failure("Name is required"), { status: 400 });
    }

    const doc = {
      profileId: body.profileId,           // ✅ coming from user?.id
      name: body.name,
      farmName: body.farmName,
      farmArea: body.farmArea,
      category: body.category,
      place: body.place,
      phone: body.phone,
      avatar: body.avatar,
      photoPath: body.photoPath,
      about: body.about,
      delivery: !!body.delivery,          // ✅ normalize to boolean
    };

    const created = await FarmerModel.create(doc);

    return NextResponse.json(
      success(
        {
          id: created._id,
          ...doc,
        },
        "Farmer created",
      ),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Create farmer error:", err);
    return NextResponse.json(
      failure("Failed to create farmer", err?.message || err),
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const pageParam = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limitParam = parseInt(
      url.searchParams.get("limit") ?? String(DEFAULT_LIMIT),
      10,
    );
    const q = (url.searchParams.get("q") ?? "").trim();
    const place = (url.searchParams.get("place") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "createdAt_desc").trim();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, MAX_LIMIT)
        : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { farmName: { $regex: q, $options: "i" } },
        { about: { $regex: q, $options: "i" } },
        { crops: { $in: [new RegExp(q, "i")] } },
      ];
    }
    if (place) {
      filter.place = { $regex: `^${place}`, $options: "i" };
    }

    const [sortField, sortDir] = sort.split("_");
    const sortMap: any = {};
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "last30daysSales") sortMap.last30daysSales = dir;
    else if (sortField === "name") sortMap.name = dir;
    else sortMap.createdAt = dir;

    const total = await FarmerModel.countDocuments(filter);

    const farmers = await FarmerModel.find(filter)
      .sort(sortMap)
      .skip(skip)
      .limit(limit)
      .select(
        "name farmName farmArea category avatar about place phone last30daysSales delivery profileId",
      ) // ✅ include delivery + profileId
      .lean()
      .exec();

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      success(
        {
          items: farmers.map((f: any) => ({
            id: String(f._id ?? f.id),
            profileId: f.profileId,
            name: f.name,
            farmName: f.farmName,
            farmArea: f.farmArea,
            category: f.category || "",
            avatar: f.avatar,
            about: f.about,
            place: f.place,
            phone: f.phone,
            delivery: !!f.delivery,               // ✅ send to frontend
            last30daysSales: f.last30daysSales ?? 0,
          })),
          meta: {
            total,
            page,
            limit,
            totalPages,
          },
        },
        "Farmers fetched",
      ),
    );
  } catch (err: any) {
    console.error("Fetch farmers error:", err);
    return NextResponse.json(
      failure("Failed to fetch farmers", err?.message || err),
      { status: 500 },
    );
  }
}
