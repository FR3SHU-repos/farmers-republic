// shared/models/mongodb/delivery/deliveryEarning.ts

import mongoose, { Schema } from "mongoose";
import type { DeliveryEarning } from "@/shared/interfaces/mongodb/delivery/deliveryEarning";

const deliveryEarningSchema = new Schema<DeliveryEarning>(
  {
    deliveryPersonId:   { type: String, required: true, index: true },
    deliveryPersonName: { type: String },
    orderId:            { type: String, required: true, unique: true, index: true },
    buyerName:          { type: String },
    orderTotal:         { type: Number, required: true, default: 0 },
    deliveryFee:        { type: Number, default: 0 },
    earning:            { type: Number, required: true, default: 30 },
    paymentMode:        { type: String, default: "cod" },
    paymentStatus:      { type: String, default: "unpaid" },
    itemCount:          { type: Number, default: 0 },
    deliveredAt:        { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Compound index for fast per-person date-range queries (used by earnings page)
deliveryEarningSchema.index({ deliveryPersonId: 1, deliveredAt: -1 });

const DeliveryEarningModel =
  mongoose.models.DeliveryEarning ||
  mongoose.model<DeliveryEarning>("DeliveryEarning", deliveryEarningSchema);

export default DeliveryEarningModel;
