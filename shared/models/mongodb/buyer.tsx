// This is for buyer profile

// shared/interfaces/mongodb/buyer.tsx

// shared/models/mongodb/buyer.ts
import mongoose, { Schema } from "mongoose";
import { Buyer } from "@/shared/interfaces/mongodb/buyer";

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const buyerSchema = new mongoose.Schema<Buyer>(
  {
    profileId: { type: String, index: true },

    name: { type: String, required: true, index: true },

    phone: { type: String },
    email: { type: String },

    address: { type: addressSchema },

    avatar: { type: String },     // Public URL from Supabase
    photoPath: { type: String },  // Supabase storage path

    about: { type: String },
  },
  {
    timestamps: true,
  }
);

const BuyerModel =
  mongoose.models.Buyer || mongoose.model<Buyer>("Buyer", buyerSchema);

export default BuyerModel;
