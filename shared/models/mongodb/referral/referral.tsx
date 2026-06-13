import mongoose, { Schema, Model } from "mongoose";
import type { Referral } from "@/shared/interfaces/mongodb/referral/referral";

const ReferralSchema = new Schema<Referral>(
  {
    referrerId: { type: Schema.Types.ObjectId as any, required: true, index: true },
    referrerName: { type: String },
    referrerCode: { type: String, required: true, index: true },
    refereeId: { type: Schema.Types.ObjectId as any, required: true, unique: true },
    refereeName: { type: String },
    refereeEmail: { type: String },
    status: {
      type: String,
      enum: ["pending", "rewarded", "expired"],
      default: "pending",
    },
    rewardAmount: { type: Number, default: 100 },
    rewardedAt: { type: Date },
  },
  { timestamps: true },
);

const ReferralModel: Model<Referral> =
  mongoose.models.Referral || mongoose.model<Referral>("Referral", ReferralSchema);

export default ReferralModel;
