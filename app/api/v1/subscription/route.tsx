import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import { success, failure } from "@/app/api/v1/utils/responses";
import { rejectUnverifiedSubscriptionEntitlement } from "@/shared/lib/security/subscription-entitlement";

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
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  console.warn(JSON.stringify({
    level: "warn",
    event: "subscription_entitlement_rejected",
    reason: "provider_verification_unavailable",
    requestId,
  }));
  return NextResponse.json(rejectUnverifiedSubscriptionEntitlement(), {
    status: 503,
    headers: { "X-Request-ID": requestId, "Retry-After": "3600" },
  });
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
