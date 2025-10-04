// app/api/v1/auth/login/route.tsx

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { StringValue } from "ms";
import jwt, { SignOptions } from "jsonwebtoken";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import { success, failure } from "../../utils/responses";

// Env variables
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    // ✅ Extract from JSON body (not query)
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(failure("Email and password are required."), {
        status: 400,
      });
    }

    // Find user
    const existingUser = await UserModel.findOne({ email });
    if (!existingUser) {
      return NextResponse.json(failure("User does not exist."), {
        status: 404,
      });
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.passwordHash,
    );

    if (!isPasswordCorrect) {
      return NextResponse.json(failure("Invalid password."), {
        status: 401,
      });
    }

    // ✅ Generate JWT for login session
    const payload = {
      sub: existingUser._id.toString(),
      email: existingUser.email,
      type: existingUser.type,
    };

    const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as StringValue;
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    const token = jwt.sign(payload, JWT_SECRET as jwt.Secret, options);

    // ✅ Prepare response
    const res = NextResponse.json(
      success(
        {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          phoneNumber: existingUser.phoneNumber,
          type: existingUser.type,
        },
        `Welcome back, ${existingUser.name || "User"}!`,
      ),
    );

    // ✅ Set JWT cookie (for automatic session)
    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      failure("Error handling login request.", error.message),
      { status: 500 },
    );
  }
}
