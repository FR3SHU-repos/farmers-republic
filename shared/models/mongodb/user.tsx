// shared/models/mongodb/user.tsx

// This is for user model for mongodb

// shared/models/user.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "@/shared/interfaces/mongodb/user";

// --- Schema definition ---
const UserSchema = new Schema<IUser>(
  {
    type: {
      type: String,
      enum: [
        "Farmer",
        "Manager",
        "Admin",
        "Owner",
        "Supplier",
        "Distributor",
        "Agent",
        "Retailer",
        "Wholesaler",
        "Logistics Provider",
        "Banker",
        "Buyer",
        "FPO",
      ],
      index: true, // ✅ allows fast role-based queries
    },

    name: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // ✅ fast login lookup
    },

    passwordHash: { type: String, required: true }, // ✅ hashed password

    phoneNumber: { type: String, index: true },
    companyNumber: { type: String },

    govId: {
      type: {
        type: String,
        enum: ["Aadhar", "PAN", "Passport", "Driving License", "Tax ID", "Other"],
      },
      docUrl: { type: String },
      verified: { type: Boolean, default: false },
    },

    subscription: {
      type: String,
      enum: ["Free User", "Premium User", "Corporate User", "Paid", "No Need"],
      default: "Free User",
    },
    subscriptionValidUntil: { type: Date },

    address: {
      line1: String,
      line2: String,
      city: { type: String, index: true },
      state: String,
      postalCode: { type: String, index: true },
      country: { type: String, index: true },
    },


    photo: { type: String }, // profile pic URL
    isActive: { type: Boolean, default: true, index: true },
    roles: { type: [String], default: [] }, // ✅ extra RBAC permissions

    referralCode: { type: String, index: true }, // optional referral code
    inviteCode: { type: String, index: true },   // optional invite code
  },


  { timestamps: true },
);

// --- Indexes ---
UserSchema.index({ type: 1, createdAt: -1 });
UserSchema.index({ subscriptionValidUntil: 1 });

// --- Model export ---
const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
