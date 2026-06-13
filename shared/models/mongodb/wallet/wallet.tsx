import mongoose, { Schema, Model } from "mongoose";
import type { Wallet } from "@/shared/interfaces/mongodb/wallet/wallet";

const WalletSchema = new Schema<Wallet>(
  {
    userId: { type: Schema.Types.ObjectId as any, required: true, unique: true, index: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true },
);

const WalletModel: Model<Wallet> =
  mongoose.models.Wallet || mongoose.model<Wallet>("Wallet", WalletSchema);

export default WalletModel;
