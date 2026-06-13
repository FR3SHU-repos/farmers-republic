import mongoose, { Schema } from "mongoose";
import type { CommunityGroup } from "@/shared/interfaces/mongodb/community/communityGroup";

const memberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    userName: { type: String },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const communityGroupSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["village", "apartment", "fpo", "workplace", "cooperative"],
      required: true,
    },
    description: { type: String },
    location: { type: String, required: true },
    pincode: { type: String, index: true },
    joinCode: { type: String, required: true, unique: true, index: true },
    adminUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    adminName: { type: String },
    members: { type: [memberSchema], default: [] },
    memberCount: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CommunityGroupModel =
  mongoose.models.CommunityGroup ||
  mongoose.model<CommunityGroup>("CommunityGroup", communityGroupSchema);
