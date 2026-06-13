import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import UserBadgeModel from "@/shared/models/mongodb/gamification/userBadge";
import { success, failure } from "@/app/api/v1/utils/responses";

const PLANS = {
  monthly: { label: "Monthly", price: 199, days: 30 },
  annual: { label: "Annual", price: 1499, days: 365 },
} as const;

const BENEFITS = [
  "Free delivery on every order",
  "Early access to new harvests",
  "5% cashback on every purchase",
  "Exclusive member discounts",
  "Priority customer support",
  "FR3SH+ badge & profile highlight",
];

export async function GET(req: NextRequest) {
  try {
    await mongoDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(failure("userId is required"), { status: 400 });
    }

    const user = await UserModel.findById(userId)
      .select("subscription subscriptionValidUntil")
      .lean();

    if (!user) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    const now = new Date();
    const validUntil = (user as any).subscriptionValidUntil
      ? new Date((user as any).subscriptionValidUntil)
      : null;

    const isActive =
      (user as any).subscription === "Premium User" &&
      (!validUntil || validUntil > now);

    return NextResponse.json(
      success({
        status: (user as any).subscription,
        validUntil,
        isActive,
        plan: isActive ? "FR3SH Plus" : "Free",
        benefits: BENEFITS,
      }),
    );
  } catch (err) {
    return NextResponse.json(failure("Failed to fetch subscription", String(err)), {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const { userId, plan, paymentRef } = await req.json();

    if (!userId || !plan) {
      return NextResponse.json(failure("userId and plan are required"), { status: 400 });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!planConfig) {
      return NextResponse.json(failure("Invalid plan. Use 'monthly' or 'annual'"), {
        status: 400,
      });
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + planConfig.days * 24 * 60 * 60 * 1000);

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { subscription: "Premium User", subscriptionValidUntil: validUntil },
      { new: true },
    );

    if (!user) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    try {
      await UserBadgeModel.create({
        userId,
        badgeId: "fr3sh_plus",
        earnedAt: now,
      });
    } catch {
      // badge may already exist — ignore duplicate key error
    }

    return NextResponse.json(
      success({
        subscribed: true,
        plan: planConfig.label,
        validUntil,
        amountPaid: planConfig.price,
        paymentRef: paymentRef ?? null,
      }),
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(failure("Failed to subscribe", String(err)), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await mongoDB();
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(failure("userId is required"), { status: 400 });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { subscriptionValidUntil: new Date() },
      { new: true },
    );

    if (!user) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    return NextResponse.json(success({ cancelled: true }));
  } catch (err) {
    return NextResponse.json(failure("Failed to cancel subscription", String(err)), {
      status: 500,
    });
  }
}
