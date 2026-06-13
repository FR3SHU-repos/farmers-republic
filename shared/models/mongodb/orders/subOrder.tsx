import mongoose, { Schema } from "mongoose";
import type { SubOrder } from "@/shared/interfaces/mongodb/orders/subOrder";

const subOrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false },
);

const subOrderSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, required: true, index: true },
    farmerName: { type: String },
    items: { type: [subOrderItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "packed",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const SubOrderModel =
  mongoose.models.SubOrder ||
  mongoose.model<SubOrder>("SubOrder", subOrderSchema);
