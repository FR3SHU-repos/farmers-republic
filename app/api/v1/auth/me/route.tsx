// app/api/v1/auth/me/route.tsx

// app/api/v1/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import { success, failure } from "../../utils/responses";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const token = req.cookies.get("token")?.value || bearerToken;
    if (!token) return NextResponse.json(failure("Not authenticated"), { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await UserModel.findById(decoded.sub).select("-passwordHash");

    if (!user) return NextResponse.json(failure("User not found"), { status: 404 });

    return NextResponse.json(success(user, "User authenticated"));
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(failure("Invalid token", err.message), { status: 401 });
  }
}
