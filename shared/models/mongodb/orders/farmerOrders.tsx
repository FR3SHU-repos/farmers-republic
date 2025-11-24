// shared/models/mongodb/orders/farmerOrders.ts
import mongoose, { Schema, model, models } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    // Farmer
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
      index: true,
    },
    farmerName: String, // denormalised for quick listing

    // Consumer
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: String,
    customerAddress: {
      type: String,
      required: true,
    },
    customerCity: String,

    // Items
    items: {
      type: [OrderItemSchema],
      default: [],
    },

    // Amounts
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // Status
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMode: {
      type: String,
      enum: ["cod", "online", "bank-transfer", "upi"],
      default: "cod",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    source: {
      type: String,
      enum: ["app", "voice", "phone-call", "whatsapp", "other"],
      default: "app",
    },

    notes: String,

    // free-form extra info if needed later
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default (models.Order as mongoose.Model<any>) || model("Order", OrderSchema);
