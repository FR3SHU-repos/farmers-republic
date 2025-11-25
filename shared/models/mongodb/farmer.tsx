// shared/models/mongodb/farmer.tsx

// shared/models/mongodb/farmer.ts
import mongoose, { Schema } from "mongoose";
import { Farmer } from "@/shared/interfaces/mongodb/farmer";

const productSchema = new mongoose.Schema(
  {
    id: { type: Schema.Types.Mixed, required: false },
    name: { type: String, required: true },
  },
  { _id: false },
);

const farmerSchema = new mongoose.Schema<Farmer>(
  {
    name: { type: String, required: true, index: true },
    farmName: { type: String },
    farmArea: { type: String },
    category: { type: String },
    place: { type: String },
    phone: { type: String },
    avatar: { type: String }, // public URL
    photoPath: { type: String }, // supabase storage path
    about: { type: String },
  },
  { timestamps: true },
);

const FarmerModel = mongoose.models.Farmer || mongoose.model("Farmer", farmerSchema);
export default FarmerModel;
