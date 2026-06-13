import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserBadgeModel from "@/shared/models/mongodb/gamification/userBadge";
import {
  BADGE_DEFINITIONS,
  type BadgeId,
} from "@/shared/interfaces/mongodb/gamification/badge";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(failure("userId is required"), { status: 400 });
    }

    const earnedBadges = await UserBadgeModel.find({ userId }).lean();
    const earnedMap = new Map(
      earnedBadges.map((b: any) => [b.badgeId as string, b]),
    );

    const badges = (Object.keys(BADGE_DEFINITIONS) as BadgeId[]).map((id) => {
      const def = BADGE_DEFINITIONS[id];
      const earned = earnedMap.get(id);
      return {
        id,
        label: def.label,
        description: def.description,
        emoji: def.emoji,
        earned: !!earned,
        earnedAt: earned ? (earned as any).earnedAt : null,
      };
    });

    return NextResponse.json(success({ badges }));
  } catch (err) {
    return NextResponse.json(failure("Failed to fetch badges", String(err)), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const { userId, badgeId } = await req.json();

    if (!userId || !badgeId) {
      return NextResponse.json(failure("userId and badgeId are required"), { status: 400 });
    }

    if (!BADGE_DEFINITIONS[badgeId as BadgeId]) {
      return NextResponse.json(failure("Invalid badgeId"), { status: 400 });
    }

    const existing = await UserBadgeModel.findOne({ userId, badgeId });
    if (existing) {
      return NextResponse.json(failure("Badge already earned"), { status: 409 });
    }

    const earnedAt = new Date();
    await UserBadgeModel.create({ userId, badgeId, earnedAt });

    const def = BADGE_DEFINITIONS[badgeId as BadgeId];

    return NextResponse.json(
      success({
        awarded: true,
        badge: {
          badgeId,
          label: def.label,
          emoji: def.emoji,
          earnedAt,
        },
      }),
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(failure("Failed to award badge", String(err)), { status: 500 });
  }
}
