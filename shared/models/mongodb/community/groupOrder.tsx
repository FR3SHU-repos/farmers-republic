import mongoose, { Schema } from "mongoose";
import type { GroupOrder } from "@/shared/interfaces/mongodb/community/groupOrder";

const requestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    userName: { type: String },
    qty: { type: Number, required: true },
  },
  { _id: false },
);

const groupOrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true },
    unit: { type: String },
    pricePerUnit: { type: Number, required: true },
    requests: { type: [requestSchema], default: [] },
    totalQty: { type: Number, default: 0 },
    farmerId: { type: Schema.Types.ObjectId },
  },
  { _id: false },
);

const groupOrderSchema = new Schema(
  {
    communityGroupId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityGroup",
      required: true,
      index: true,
    },
    groupName: { type: String },
    createdByUserId: { type: Schema.Types.ObjectId, required: true },
    createdByName: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    items: { type: [groupOrderItemSchema], default: [] },
    deadline: { type: Date, required: true, index: true },
    deliveryLocation: { type: String },
    deliveryFee: { type: Number, default: 0 },
    totalEstimated: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "closed", "submitted", "delivered", "cancelled"],
      default: "open",
    },
    notes: { type: String },
  },
  { timestamps: true },
);

export const GroupOrderModel =
  mongoose.models.GroupOrder ||
  mongoose.model<GroupOrder>("GroupOrder", groupOrderSchema);
