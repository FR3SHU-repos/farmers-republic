import mongoose, { Schema } from "mongoose";
import { UpcomingHarvest } from "@/shared/interfaces/mongodb/harvests/harvest";

const harvestSchema = new Schema<UpcomingHarvest>(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId as any,
      ref: "Farmer",
      required: true,
      index: true,
    },
    farmerName: { type: String },
    farmerLocation: { type: String },
    crop: { type: String, required: true, index: true },
    variety: { type: String },
    description: { type: String },
    expectedQty: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: "kg" },
    estimatedPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    harvestDate: { type: Date, required: true, index: true },
    preBookDeadline: { type: Date },
    minPreBookQty: { type: Number, default: 1 },
    maxPreBookQty: { type: Number },
    totalPreBooked: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "open", "fully_booked", "harvested", "cancelled"],
      default: "open",
    },
    images: [{ type: String }],
    notes: { type: String },
  },
  { timestamps: true },
);

// Compound index for the public marketplace query: status=open + future harvestDate
harvestSchema.index({ status: 1, harvestDate: 1 });
harvestSchema.index({ farmerId: 1, status: 1 });

export const HarvestModel =
  mongoose.models.Harvest ||
  mongoose.model<UpcomingHarvest>("Harvest", harvestSchema);
