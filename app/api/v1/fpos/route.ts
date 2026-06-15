import { NextRequest, NextResponse } from "next/server";
import { success, failure } from "@/app/api/v1/utils/responses";
import { FPOS } from "@/shared/data/fpos";

// GET /api/v1/fpos
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";

    const filtered = FPOS.filter(f =>
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.place.toLowerCase().includes(q)
    );

    const fpos = filtered.map(f => {
      const [district, ...stateParts] = f.place.split(",");
      return {
        _id: f.id,
        name: f.name,
        district: district.trim(),
        state: stateParts.join(",").trim() || undefined,
        description: f.shortDesc,
        farmerCount: f.noOfFarmers,
        productCount: f.products?.length ?? 0,
        established: f.established,
        certifications: f.certifications,
        photo: f.banner,
      };
    });

    return NextResponse.json(
      success({ fpos, total: fpos.length }, "FPOs fetched"),
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(failure(err?.message ?? "Failed to fetch FPOs"), { status: 500 });
  }
}
