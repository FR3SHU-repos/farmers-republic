// app/api/v1/user/photo/route.tsx

// app/api/v1/user/photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import jwt from "jsonwebtoken";
import { success, failure } from "@/app/api/v1/utils/responses"; // adjust path if needed

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(req: NextRequest) {
  try {
    await mongoDB();

    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json(failure("Unauthorized"), { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    const userId = decoded.sub;

    const body = await req.json();
    const { photoUrl, photoPath } = body;
    if (!photoUrl) return NextResponse.json(failure("photoUrl required"), { status: 400 });

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { photo: photoUrl, photoPath },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updated) return NextResponse.json(failure("User not found"), { status: 404 });

    return NextResponse.json(success(
      {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        phoneNumber: updated.phoneNumber,
        type: updated.type,
        photo: updated.photo
      },
      "Photo updated"
    ));
  } catch (err: any) {
    console.error("Update photo error:", err);
    return NextResponse.json(failure("Failed to update photo", err?.message ?? err), { status: 500 });
  }
}
