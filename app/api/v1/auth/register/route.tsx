// app/api/v1/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import { success, failure } from "../../utils/responses";
import { StringValue } from "ms";
import jwt, { SignOptions } from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    const {
      name,
      email,
      password,
      phoneNumber,
      type,
      referralCode,
      inviteCode,
    } = body;

    if (!email || !password) {
      return NextResponse.json(failure("Email and password are required."), { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(failure("Invalid email format."), { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(failure("Password must be at least 8 characters."), { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(failure("User already exists."), { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userData: Record<string, any> = {
      name,
      email,
      passwordHash,
      phoneNumber,
      type: type || "Retailer",
    };
    if (referralCode) userData.referralCode = referralCode;
    if (inviteCode) userData.inviteCode = inviteCode;

    const newUser = await UserModel.create(userData);

    // --- ensure secret exists ---
    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET env variable");
      throw new Error("JWT_SECRET not set in environment variables");
    }

    // --- Prepare payload and options with explicit types ---
    const payload = {
      sub: newUser._id.toString(), // make sure this is a string
      email: newUser.email,
      type: newUser.type,
    };

    const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as StringValue;
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };


    // jwt.Secret is a union type (string | Buffer | { key: ... } | ...).
    const token = jwt.sign(payload, JWT_SECRET as jwt.Secret, options);

    const res = NextResponse.json(
      success(
        {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          type: newUser.type,
          referralCode: newUser.referralCode || null,
          inviteCode: newUser.inviteCode || null,
          tokenExpiresIn: JWT_EXPIRES_IN,
        },
        "User registered and logged in successfully."
      ),
      { status: 201 }
    );

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
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(failure("Registration failed.", err.message), { status: 500 });
  }
}
