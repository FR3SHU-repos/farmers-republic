import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel from "@/shared/models/mongodb/user";
import ReferralModel from "@/shared/models/mongodb/referral/referral";
import WalletModel from "@/shared/models/mongodb/wallet/wallet";
import WalletTransactionModel from "@/shared/models/mongodb/wallet/walletTransaction";
import { success, failure } from "@/app/api/v1/utils/responses";

const BASE_URL = "https://farmersrepublic.in";
const REWARD_AMOUNT = 100;

export async function GET(req: NextRequest) {
  try {
    await mongoDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(failure("userId is required"), { status: 400 });
    }

    const user = await UserModel.findById(userId).select("referralCode name").lean();
    if (!user) {
      return NextResponse.json(failure("User not found"), { status: 404 });
    }

    const referralCode = (user as any).referralCode ?? null;

    const [totalReferrals, rewardedCount, totalEarnedAgg, recentReferrals] = await Promise.all([
      ReferralModel.countDocuments({ referrerId: userId }),
      ReferralModel.countDocuments({ referrerId: userId, status: "rewarded" }),
      ReferralModel.aggregate([
        { $match: { referrerId: userId, status: "rewarded" } },
        { $group: { _id: null, total: { $sum: "$rewardAmount" } } },
      ]),
      ReferralModel.find({ referrerId: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const totalEarned = totalEarnedAgg[0]?.total ?? 0;

    return NextResponse.json(
      success({
        referralCode,
        referralLink: referralCode ? `${BASE_URL}/join?ref=${referralCode}` : null,
        stats: {
          totalReferrals,
          rewardedCount,
          totalEarned,
        },
        recentReferrals: recentReferrals.map((r: any) => ({
          id: String(r._id),
          refereeName: r.refereeName,
          refereeEmail: r.refereeEmail,
          status: r.status,
          rewardAmount: r.rewardAmount,
          rewardedAt: r.rewardedAt,
          createdAt: r.createdAt,
        })),
      }),
    );
  } catch (err) {
    return NextResponse.json(failure("Failed to fetch referral info", String(err)), {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const { refereeId, refereeEmail, refereeName, referralCode } = await req.json();

    if (!refereeId || !referralCode) {
      return NextResponse.json(failure("refereeId and referralCode are required"), { status: 400 });
    }

    const referrer = await UserModel.findOne({ referralCode }).select("_id name").lean();
    if (!referrer) {
      return NextResponse.json(failure("Invalid referral code"), { status: 400 });
    }

    const existing = await ReferralModel.findOne({ refereeId });
    if (existing) {
      return NextResponse.json(failure("User has already been referred"), { status: 409 });
    }

    const referral = await ReferralModel.create({
      referrerId: (referrer as any)._id,
      referrerName: (referrer as any).name,
      referrerCode: referralCode,
      refereeId,
      refereeName,
      refereeEmail,
      status: "pending",
      rewardAmount: REWARD_AMOUNT,
    });

    return NextResponse.json(
      success({
        referralId: String(referral._id),
        referrerId: String((referrer as any)._id),
        message: "Referral recorded",
      }),
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(failure("Failed to record referral", String(err)), { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await mongoDB();
    const { refereeId } = await req.json();

    if (!refereeId) {
      return NextResponse.json(failure("refereeId is required"), { status: 400 });
    }

    const referral = await ReferralModel.findOneAndUpdate(
      { refereeId, status: "pending" },
      { status: "rewarded", rewardedAt: new Date() },
      { new: true },
    );

    if (!referral) {
      return NextResponse.json(failure("No pending referral found for this user"), { status: 404 });
    }

    const referrerId = String(referral.referrerId);

    const updatedWallet = await WalletModel.findOneAndUpdate(
      { userId: referrerId },
      { $inc: { balance: REWARD_AMOUNT } },
      { upsert: true, new: true },
    );

    await WalletTransactionModel.create({
      walletId: String(updatedWallet._id),
      userId: referrerId,
      type: "referral_reward",
      amount: REWARD_AMOUNT,
      description: `Referral reward for inviting ${referral.refereeName ?? referral.refereeEmail ?? "a friend"}`,
      status: "completed",
    });

    return NextResponse.json(success({ rewarded: true, amount: REWARD_AMOUNT }));
  } catch (err) {
    return NextResponse.json(failure("Failed to reward referral", String(err)), { status: 500 });
  }
}
