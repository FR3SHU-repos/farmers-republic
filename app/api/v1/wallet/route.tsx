import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import WalletModel from "@/shared/models/mongodb/wallet/wallet";
import WalletTransactionModel from "@/shared/models/mongodb/wallet/walletTransaction";
import { success, failure } from "@/app/api/v1/utils/responses";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

const CREDIT_TYPES = ["credit", "refund", "referral_reward", "cashback", "subscription_refund"];

/** @deprecated Compatibility route; Go owns wallet balance reads. */
export function GET(request: NextRequest) {
  return proxyCatalogueGET(request, "/wallet");
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();
    const { userId, type, amount, description, orderId } = body;

    if (!userId || !type || amount == null || !description) {
      return NextResponse.json(failure("userId, type, amount, description are required"), {
        status: 400,
      });
    }

    if (amount < 0) {
      return NextResponse.json(failure("Amount must be non-negative"), { status: 400 });
    }

    let updatedWallet;

    if (type === "debit") {
      const existing = await WalletModel.findOne({ userId }).lean();
      if (!existing || (existing as any).balance < amount) {
        return NextResponse.json(failure("Insufficient wallet balance"), { status: 400 });
      }

      updatedWallet = await WalletModel.findOneAndUpdate(
        { userId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true },
      ).lean();

      if (!updatedWallet) {
        return NextResponse.json(failure("Insufficient wallet balance"), { status: 400 });
      }
    } else if (CREDIT_TYPES.includes(type)) {
      updatedWallet = await WalletModel.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount } },
        { upsert: true, new: true },
      ).lean();
    } else {
      return NextResponse.json(failure("Invalid transaction type"), { status: 400 });
    }

    const walletId = String((updatedWallet as any)._id);

    const txData: any = {
      walletId,
      userId,
      type,
      amount,
      description,
      status: "completed",
    };
    if (orderId) txData.orderId = orderId;

    const transaction = await WalletTransactionModel.create(txData);

    return NextResponse.json(
      success({
        transaction: {
          id: String(transaction._id),
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          status: transaction.status,
        },
        newBalance: (updatedWallet as any).balance,
      }),
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(failure("Failed to process transaction", String(err)), {
      status: 500,
    });
  }
}
