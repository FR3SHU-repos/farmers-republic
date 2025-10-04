// app/api/v1/utils/verifyToken.ts
// This is for verifying JWT token
/*

    1. Extract token from request cookies
    2. Verify token using secret key
    3. Return user info if valid, else error

*/

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function verifyToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return payload; // contains user info
  } catch (err) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
