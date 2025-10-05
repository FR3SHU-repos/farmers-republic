// shared/interfaces/mongodb/products/product.tsx

// This is for product descriptions

import mongoose, { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
{
name: { type: String, required: true },
image: { type: String }, // main image URL
images: { type: [String], default: [] }, // additional images
price: { type: Number, required: true },
rating: { type: Number, default: 0 },
reviewsCount: { type: Number, default: 0 },
sourceFrom: String,
purchasedLast30Days: { type: Number, default: 0 },
farmer: { type: String, required: false },
swadeshiPercent: { type: Number, default: 0 },
healthBenefits: { type: [String], default: [] },
timeToSupply: String,
tags: { type: [String], default: [] },
fssai: String,
shelfLife: String,
description: String,
category: String,
badge: String,
createdAt: { type: Date, default: Date.now },
},
{ timestamps: true }
);

export default (models.Product as mongoose.Model<any>) || model("Product", ProductSchema);