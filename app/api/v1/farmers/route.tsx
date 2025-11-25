// app/api/v1/farmers/route.tsx

// app/api/v1/farmers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses"; // adjust path if needed

// Default page size
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

// app/api/v1/farmers/route.ts (POST)

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    if (!body?.name) {
      return NextResponse.json(failure("Name is required"), { status: 400 });
    }

    const doc = {
      name: body.name,
      farmName: body.farmName,
      farmArea: body.farmArea,
      category: body.category,         // 👈 IMPORTANT
      place: body.place,
      phone: body.phone,
      avatar: body.avatar,             // public URL
      photoPath: body.photoPath,       // supabase storage path
      about: body.about,
      // you can still keep last30daysSales if you add it to schema later
      // last30daysSales: body.last30daysSales ?? 0,
    };

    const created = await FarmerModel.create(doc);

    return NextResponse.json(
      success(
        {
          id: created._id,
          ...doc,
        },
        "Farmer created"
      ),
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Create farmer error:", err);
    return NextResponse.json(
      failure("Failed to create farmer", err?.message || err),
      { status: 500 }
    );
  }
}


// Getting list of farmers with pagination

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const pageParam = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limitParam = parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const q = (url.searchParams.get("q") ?? "").trim();
    const place = (url.searchParams.get("place") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "createdAt_desc").trim(); // e.g. createdAt_desc or last30daysSales_desc

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (q) {
      // text-like search across name, farmName, about and crops
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

    // Sort mapping
    const [sortField, sortDir] = sort.split("_");
    const sortMap: any = {};
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "last30daysSales") sortMap.last30daysSales = dir;
    else if (sortField === "name") sortMap.name = dir;
    else sortMap.createdAt = dir;

    // Count total
    const total = await FarmerModel.countDocuments(filter);

    // Query page
    const farmers = await FarmerModel.find(filter)
  .sort(sortMap)
  .skip(skip)
  .limit(limit)
  .select("name farmName farmArea category avatar about place phone last30daysSales") // 👈 include category + phone
  .lean()
  .exec();

const totalPages = Math.max(1, Math.ceil(total / limit));

return NextResponse.json(
  success(
    {
      items: farmers.map((f) => ({
        id: String(f._id ?? f.id),
        name: f.name,
        farmName: f.farmName,
        farmArea: f.farmArea,
        category: f.category || "",              // 👈 send category
        avatar: f.avatar,
        about: f.about,
        place: f.place,
        phone: f.phone,
        last30daysSales: f.last30daysSales ?? 0,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    },
    "Farmers fetched"
  )
);
  } catch (err: any) {
    console.error("Fetch farmers error:", err);
    return NextResponse.json(failure("Failed to fetch farmers", err?.message || err), { status: 500 });
  }
}

