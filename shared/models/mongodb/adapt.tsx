// Mongoose model for adapted farmers linked to buyers
// shared/models/mongodb/adapt.tsx


import { Schema, model, models } from "mongoose";

export interface AdaptedFarmerDocument {
  buyerId: string;   // can be user _id or some buyer identifier
  farmerId: string;  // the farmer _id or farmer code
  createdAt: Date;
  updatedAt: Date;
}

const AdaptedFarmerSchema = new Schema<AdaptedFarmerDocument>(
  {
    buyerId: {
      type: String,
      required: true,
      index: true,
    },
    farmerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// prevent duplicates for same buyer + farmer
AdaptedFarmerSchema.index({ buyerId: 1, farmerId: 1 }, { unique: true });

export const AdaptedFarmerModel =
  models.AdaptedFarmer ||
  model<AdaptedFarmerDocument>("AdaptedFarmer", AdaptedFarmerSchema);
