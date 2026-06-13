import mongoose, { Schema, Model } from "mongoose";
import type { WalletTransaction } from "@/shared/interfaces/mongodb/wallet/wallet";

const TRANSACTION_TYPES = [
  "credit",
  "debit",
  "refund",
  "referral_reward",
  "cashback",
  "subscription_refund",
];

const WalletTransactionSchema = new Schema<WalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId as any, ref: "Wallet", required: true, index: true },
    userId: { type: Schema.Types.ObjectId as any, required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId as any },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true },
);

const WalletTransactionModel: Model<WalletTransaction> =
  mongoose.models.WalletTransaction ||
  mongoose.model<WalletTransaction>("WalletTransaction", WalletTransactionSchema);

export default WalletTransactionModel;
