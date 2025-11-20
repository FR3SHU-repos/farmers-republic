// app/api/v1/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response body
    const res = NextResponse.json({ success: true, message: "Logged out" });

    // Clear the cookie named "token" (change name if your cookie is different)
    res.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // allow localhost
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ success: false, message: "Failed to logout" }, { status: 500 });
  }
}
