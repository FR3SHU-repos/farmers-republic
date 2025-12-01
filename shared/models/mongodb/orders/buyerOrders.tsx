// shared/models/mongodb/orders/buyerOrders.tsx

import mongoose, { Schema } from "mongoose";
import type { Order } from "@/shared/interfaces/mongodb/orders/buyerOrders";

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    qty: { type: Number, required: true },
    farmerId: { type: String },
  },
  { _id: false },
);

const orderSchema = new Schema<Order>(
  {
    buyerId: { type: String, index: true },
    buyerName: { type: String },
    buyerEmail: { type: String },

    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: { type: String, default: "pending", index: true },
    paymentStatus: { type: String, default: "unpaid", index: true },
    paymentMode: { type: String, default: "cod" },
    source: { type: String, default: "web" },

    items: { type: [orderItemSchema], required: true },
  },
  { timestamps: true },
);

const OrderModel =
  mongoose.models.Order || mongoose.model<Order>("Order", orderSchema);

export default OrderModel;
