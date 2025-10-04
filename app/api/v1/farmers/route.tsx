// app/api/v1/farmers/route.tsx

// app/api/v1/farmers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses"; // adjust path if needed

// Default page size
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    // Basic validation
    if (!body?.name) {
      return NextResponse.json(failure("Name is required"), { status: 400 });
    }

    // Normalize minimal fields
    const doc = {
      name: body.name,
      farmName: body.farmName,
      farmArea: body.farmArea,
      crops: Array.isArray(body.crops) ? body.crops : (body.crops ? String(body.crops).split(",").map(s=>s.trim()) : []),
      products: body.products || [],
      fpo: body.fpo ?? null,
      swadeshiPercent: body.swadeshiPercent ?? undefined,
      place: body.place,
      phone: body.phone,
      avatar: body.avatar,     // public URL
      photoPath: body.photoPath, // supabase path
      about: body.about,
      established: body.established,
      certifications: body.certifications || [],
      last30daysSales: body.last30daysSales ?? 0,
    };

    const created = await FarmerModel.create(doc);

    return NextResponse.json(success({ id: created._id, ...doc }, "Farmer created"), { status: 201 });
  } catch (err: any) {
    console.error("Create farmer error:", err);
    return NextResponse.json(failure("Failed to create farmer", err?.message || err), { status: 500 });
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
      .select("name farmName avatar about place fpo last30daysSales") // only fields needed for list
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
            avatar: f.avatar,
            about: f.about,
            place: f.place,
            fpo: f.fpo,
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

