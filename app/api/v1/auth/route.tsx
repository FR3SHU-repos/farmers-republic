// app/api/v1/auth/logout/route.tsx

// app/api/v1/auth/logout/route.ts
import { NextResponse } from "next/server";
import { success } from "../utils/responses";

export async function POST() {
  const res = NextResponse.json(success(null, "Logged out successfully"));

  // Clear the auth cookie
  res.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expire immediately
  });

  return res;
}
