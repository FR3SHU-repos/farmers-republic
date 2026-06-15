import { NextRequest, NextResponse } from "next/server";
import { success, failure } from "@/app/api/v1/utils/responses";
import { FPOS } from "@/shared/data/fpos";

// GET /api/v1/fpos/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    void req;
    const resolvedParams = await params;
    const fpoId = resolvedParams.id;
    const raw = FPOS.find(f => f.id === fpoId);

    if (!raw) {
      return NextResponse.json(failure("FPO not found"), { status: 404 });
    }

    const [district, ...stateParts] = raw.place.split(",");
    const fpo = {
      _id: raw.id,
      name: raw.name,
      district: district.trim(),
      state: stateParts.join(",").trim() || undefined,
      description: raw.shortDesc,
      farmerCount: raw.noOfFarmers,
      productCount: raw.products?.length ?? 0,
      established: raw.established,
      certifications: raw.certifications,
      photo: raw.banner,
      crops: raw.crops,
      totalLandArea: raw.totalLandArea,
      organicPercent: raw.organicPercent,
      phone: raw.phone,
      email: raw.email,
    };

    return NextResponse.json(success(fpo, "FPO fetched"), { status: 200 });
  } catch (err: any) {
    return NextResponse.json(failure(err?.message ?? "Failed to fetch FPO"), { status: 500 });
  }
}
