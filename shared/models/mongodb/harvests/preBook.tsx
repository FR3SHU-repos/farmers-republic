import mongoose, { Schema } from "mongoose";
import { PreBook } from "@/shared/interfaces/mongodb/harvests/preBook";

const preBookSchema = new Schema<PreBook>(
  {
    harvestId: {
      type: mongoose.Schema.Types.ObjectId as any,
      ref: "Harvest",
      required: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId as any,
      ref: "Farmer",
      required: true,
      index: true,
    },
    cropName: { type: String },
    harvestDate: { type: Date },
    buyerId: { type: mongoose.Schema.Types.ObjectId as any },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String },
    buyerPhone: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unit: { type: String },
    priceAtBooking: { type: Number, required: true },
    estimatedTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "fulfilled", "cancelled"],
      default: "pending",
    },
    note: { type: String },
  },
  { timestamps: true },
);

export const PreBookModel =
  mongoose.models.PreBook ||
  mongoose.model<PreBook>("PreBook", preBookSchema);
