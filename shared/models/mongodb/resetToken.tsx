// shared/models/mongodb/resetToken.tsx

import mongoose, { Document, Model } from "mongoose";
import { IResetToken } from "@/shared/interfaces/resetToken";

export interface ResetTokenDocument extends IResetToken, Document {}

const ResetTokenSchema = new mongoose.Schema<ResetTokenDocument>(
  {
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "resettokens",
  }
);

// TTL index: mongoose will automatically remove documents after expiresAt (expireAfterSeconds: 0)
ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Avoid model overwrite errors in dev / Next.js hot reload
const ResetTokenModel: Model<ResetTokenDocument> =
  (mongoose.models.ResetToken as Model<ResetTokenDocument>) ||
  mongoose.model<ResetTokenDocument>("ResetToken", ResetTokenSchema);

export default ResetTokenModel;
