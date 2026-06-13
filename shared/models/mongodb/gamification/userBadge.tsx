import mongoose, { Schema, Model } from "mongoose";
import type { UserBadge } from "@/shared/interfaces/mongodb/gamification/badge";

const UserBadgeSchema = new Schema<UserBadge>(
  {
    userId: { type: Schema.Types.ObjectId as any, required: true, index: true },
    badgeId: { type: String, required: true },
    earnedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const UserBadgeModel: Model<UserBadge> =
  mongoose.models.UserBadge ||
  mongoose.model<UserBadge>("UserBadge", UserBadgeSchema);

export default UserBadgeModel;
