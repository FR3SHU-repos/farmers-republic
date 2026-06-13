import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import WalletModel from "@/shared/models/mongodb/wallet/wallet";
import WalletTransactionModel from "@/shared/models/mongodb/wallet/walletTransaction";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));

    if (!userId) {
      return NextResponse.json(failure("userId is required"), { status: 400 });
    }

    const wallet = await WalletModel.findOneAndUpdate(
      { userId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    const filter: Record<string, unknown> = { userId };
    if (type) filter.type = type;

    const [total, transactions] = await Promise.all([
      WalletTransactionModel.countDocuments(filter),
      WalletTransactionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      success({
        wallet: {
          balance: (wallet as any).balance,
          currency: (wallet as any).currency,
        },
        transactions: transactions.map((t: any) => ({
          id: String(t._id),
          walletId: String(t.walletId),
          userId: String(t.userId),
          type: t.type,
          amount: t.amount,
          description: t.description,
          orderId: t.orderId ? String(t.orderId) : undefined,
          status: t.status,
          createdAt: t.createdAt,
        })),
        meta: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      }),
    );
  } catch (err) {
    return NextResponse.json(failure("Failed to fetch transactions", String(err)), {
      status: 500,
    });
  }
}
