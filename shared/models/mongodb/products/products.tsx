// shared/models/mongodb/products/products.ts

import mongoose, { Schema, model, models } from "mongoose";
import type { Product } from "@/shared/interfaces/mongodb/products/product";

const dimensionsSchema = new Schema(
  {
    length: { type: Number, required: true }, // cm
    width: { type: Number, required: true },  // cm
    height: { type: Number, required: true }, // cm
  },
  { _id: false },
);

const ProductSchema = new Schema<Product>(
  {
    // Identity / basic
    name: { type: String, required: true, index: true },
    slug: { type: String, index: true, unique: false }, // you can make this unique later
    sku: { type: String },

    // Media
    image: { type: String },
    images: { type: [String], default: [] },
    videoUrl: { type: String },

    // Pricing
    price: { type: Number, required: true },
    mrp: { type: Number },
    currency: { type: String, default: "INR" },

    unit: { type: String }, // e.g. "kg", "litre", "packet"
    unitQuantity: { type: Number }, // e.g. 1, 0.5

    // Quantity / purchase rules
    minOrderQty: { type: Number, default: 1 },
    maxOrderQty: { type: Number },
    stepQty: { type: Number, default: 1 },

    // Inventory
    stockQty: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },

    // Ratings / social proof
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    // Farmer / source
    sourceFrom: { type: String },
    purchasedLast30Days: { type: Number, default: 0 },
    farmer: { type: String },
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: false },

    // Category & merchandising
    category: { type: String },
    subCategory: { type: String },
    tags: { type: [String], default: [] },
    badge: { type: String }, // e.g. "Bestseller"
    label: { type: String }, // e.g. "Festive", "Limited"
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "out_of_stock", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    sortPriority: { type: Number, default: 0 },

    // Health / story / quality
    swadeshiPercent: { type: Number, default: 0 },
    healthBenefits: { type: [String], default: [] },
    timeToSupply: { type: String },
    shelfLife: { type: String },
    storageInstructions: { type: String },
    ingredients: { type: [String], default: [] },
    originCountry: { type: String, default: "India" },
    isOrganic: { type: Boolean, default: false },
    certifications: { type: [String], default: [] },

    // Content
    description: { type: String },
    shortDescription: { type: String },

    // Tax (GST meta)
    hsnCode: { type: String },
    gstRate: { type: Number }, // e.g. 0, 5, 12
    gstIncludedInPrice: { type: Boolean, default: true },

    // Logistics / shipping
    productType: {
      type: String,
      enum: ["physical", "digital", "service"],
      default: "physical",
    },
    weightGrams: { type: Number }, // net weight for shipping
    dimensionsCm: { type: dimensionsSchema },
    fragile: { type: Boolean, default: false },
    perishable: { type: Boolean, default: false },
    codAvailable: { type: Boolean, default: true },

    // SEO / search
    seoTitle: { type: String },
    seoDescription: { type: String },
    searchKeywords: { type: [String], default: [] },

    // Flexible attributes
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

const ProductModel =
  (models.Product as mongoose.Model<Product>) || model<Product>("Product", ProductSchema);

export default ProductModel;
