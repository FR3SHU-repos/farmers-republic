// app/api/v1/auth/login/route.tsx

// This is for login route

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // For hashing password
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";

// User authentication handler (Login & Registration)
export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoDB();

    // Extract user credentials from request query
    const email = req.nextUrl.searchParams.get("email") || "";
    const password = req.nextUrl.searchParams.get("password") || "";

    // Validate input fields
    if (!email || !password) {
      return NextResponse.json({
        message: "Email, password are required.",
        success: false,
      });
    }

    // Check if the user already exists
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      // Verify password for login
      const isPasswordCorrect = await bcrypt.compare(
        password,
        existingUser.passwordHash,
      );

      if (!isPasswordCorrect) {
        return NextResponse.json({
          message: "Invalid password.",
          success: false,
        });
      }

      // Login successful
      return NextResponse.json({
        message: `Welcome back, ${existingUser.name || "User"}!`,
        success: true,
        userData: {
          name: existingUser.name || "",
          email: existingUser.email,
          phoneNumber: existingUser.phoneNumber,
          id: existingUser._id,
        },
      });
    } else {
      return NextResponse.json({
        message: "User dont exist.",
        success: false,
        error: "User dont exist.",
      });
    }
  } catch (error) {
    return NextResponse.json({
      message: "Error handling request.",
      success: false,
      error: error,
    });
  }
}