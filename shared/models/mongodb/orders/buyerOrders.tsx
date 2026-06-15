// shared/models/mongodb/orders/buyerOrders.ts

import mongoose, { Schema } from "mongoose";
import type { Order } from "@/shared/interfaces/mongodb/orders/buyerOrders";

// 🔹 Sub-schema for per-item discounts (incl. festive)
const orderItemDiscountSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["festive", "coupon", "farmer", "bulk", "manual"],
      default: "manual",
    },
    label: { type: String }, // e.g. "Diwali Offer", "WELCOME10"
    amount: { type: Number, default: 0 }, // positive = discount amount
  },
  { _id: false }
);

// 🔹 Sub-schema for per-item platform fees
const orderItemPlatformFeeSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["service", "listing", "payment_gateway", "other"],
      default: "service",
    },
    label: { type: String }, // e.g. "FR3SH fee", "UPI gateway"
    amount: { type: Number, default: 0 }, // positive = fee amount
  },
  { _id: false }
);

// 🔹 Item schema – each product behaves like a mini-order line
const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true }, // base price per unit
    image:     { type: String },
    qty:       { type: Number, required: true },
    farmerId:  { type: String },

    // ✨ per-item lifecycle + charges
    status: {
      type: String,          // "pending", "confirmed", "out_for_delivery", etc.
      default: "pending",
      index: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    extraCharge: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },

    // 💰 Platform fees per item
    platformFees: {
      type: [orderItemPlatformFeeSchema],
      default: [],
    },
    platformFeeTotal: {
      type: Number,
      default: 0,
    },

    // 🎉 Discounts per item (incl. festive offers, coupons, etc.)
    discounts: {
      type: [orderItemDiscountSchema],
      default: [],
    },
    discountTotal: {
      type: Number,
      default: 0,
    },

    // 💳 Payment per item (overrides order-level when needed)
    paymentMode: {
      type: String, // "cod" | "online" (not enforced here to stay flexible)
    },
    paymentStatus: {
      type: String, // "unpaid", "paid", "refund_pending", "refunded", ...
    },
    paidAmount: {
      type: Number,
      default: 0,   // total actually charged for this item line
    },
    currency: {
      type: String,
      default: "INR",
    },

    // 🧾 Tax per item
    taxAmount: {
      type: Number,
      default: 0,
    },
    taxBreakup: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
    },

    // 💸 Payout to farmer for this item
    farmerPayoutAmount: {
      type: Number,
      default: 0,
    },
    farmerSettlementStatus: {
      type: String,
      enum: ["pending", "scheduled", "settled", "on_hold"],
      default: "pending",
      index: true,
    },
    farmerSettlementAt: {
      type: Date,
    },
    settlementReferenceId: {
      type: String,
    },

    // 🔗 References, logistics
    paymentReferenceId: {
      type: String, // per-item payment ref if you ever need it
    },
    shipmentTrackingId: {
      type: String,
    },
    shipmentProvider: {
      type: String,
    },
    promisedDeliveryDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { _id: false }
);

// 🔹 Timeline entry sub-schema — one doc pushed per status transition
const timelineEntrySchema = new Schema(
  {
    status:    { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note:      { type: String },
    actorType: {
      type: String,
      enum: ["farmer", "delivery", "buyer", "system"],
      default: "system",
    },
    actorId:   { type: String },
    actorName: { type: String },
  },
  { _id: false }
);

// 🔹 Order schema – overall order + array of items
const orderSchema = new Schema<Order>(
  {
    buyerId:    { type: String, index: true },
    buyerName:  { type: String },
    buyerEmail: { type: String },
    buyerPhone: { type: String },

    subtotal:    { type: Number, required: true }, // sum of item base price*qty
    deliveryFee: { type: Number, default: 0 },     // any global delivery fee
    total:       { type: Number, required: true }, // final buyer total

    status:        { type: String, default: "pending", index: true },
    paymentStatus: { type: String, default: "unpaid", index: true },
    paymentMode:   { type: String, default: "cod" },
    source:        { type: String, default: "web" },

    // optional global payment reference if you use a single transaction
    paymentReferenceId: { type: String },

    // delivery person tracking
    deliveryPersonId:   { type: String, index: true },
    deliveryPersonName: { type: String },
    deliveryEarning:    { type: Number, default: 0 },
    deliveredAt:        { type: Date },

    items: { type: [orderItemSchema], required: true },

    // Lifecycle timeline — one entry appended per status change
    timeline: { type: [timelineEntrySchema], default: [] },
  },
  { timestamps: true }
);

// Compound indexes for the most common query patterns
orderSchema.index({ "items.farmerId": 1, createdAt: -1 }); // farmer dashboard orders
orderSchema.index({ buyerId: 1, createdAt: -1 });           // buyer order history
orderSchema.index({ status: 1, createdAt: -1 });            // admin + delivery filters
orderSchema.index({ deliveryPersonId: 1, status: 1 });      // delivery person queue

const OrderModel =
  mongoose.models.Order || mongoose.model<Order>("Order", orderSchema);

export default OrderModel;
