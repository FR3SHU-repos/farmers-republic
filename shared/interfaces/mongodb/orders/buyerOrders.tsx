// Types for clearer enums
export type OrderItemPaymentStatus =
  | "unpaid"
  | "paid"
  | "refund_pending"
  | "refunded"
  | "partially_refunded";

export type OrderItemPaymentMode = "cod" | "online";

export type OrderItemSettlementStatus =
  | "pending"
  | "scheduled"
  | "settled"
  | "on_hold";

// 🔎 Discount line – keeps it flexible (festive, coupon, farmer discount, etc.)
export type OrderItemDiscountLine = {
  type: "festive" | "coupon" | "farmer" | "bulk" | "manual";
  label?: string;             // e.g. "Diwali Offer", "WELCOME10"
  amount: number;             // positive number = discount amount for this item line
};

// 💰 Platform fee line (in case you want multiple types later)
export type OrderItemPlatformFeeLine = {
  type: "service" | "listing" | "payment_gateway" | "other";
  label?: string;
  amount: number;             // positive number = fee charged on this item
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;        // base price per unit (before per-item charges/discounts)
  image?: string;
  qty: number;
  farmerId?: string;

  // ✅ Operational status for this product in the order
  status?: string;            // "pending", "confirmed", "out_for_delivery", "delivered", "cancelled"

  // 🚚 Logistics / extra charges per item
  deliveryCharge?: number;    // e.g. per-item share of delivery
  extraCharge?: number;       // packing/handling/etc.
  serviceCharge?: number;     // legacy field – you can treat as generic extra

  // 💰 Platform fee (per item)
  platformFees?: OrderItemPlatformFeeLine[]; // detailed fees
  platformFeeTotal?: number;                 // sum(platformFees.amount) for quick queries

  // 🎉 Discounts (including festive offers)
  discounts?: OrderItemDiscountLine[];       // each line like { type: "festive", amount: 50 }
  discountTotal?: number;                    // sum(discounts.amount)

  // 💳 Payment per item (can differ from order-level)
  paymentMode?: OrderItemPaymentMode;        // default to order.paymentMode if empty
  paymentStatus?: OrderItemPaymentStatus;    // default to order.paymentStatus
  paidAmount?: number;                       // what buyer actually pays for this item line
  currency?: string;                         // "INR" (future-proof)

  // 🧾 Tax per item
  taxAmount?: number;                        // total GST for this item
  taxBreakup?: {
    cgst?: number;
    sgst?: number;
    igst?: number;
  };

  // 💸 Payout to farmer for this item
  farmerPayoutAmount?: number;               // what farmer should receive for this item
  farmerSettlementStatus?: OrderItemSettlementStatus;
  farmerSettlementAt?: Date | string;
  settlementReferenceId?: string;            // payout id from bank/gateway

  // 🔗 References
  paymentReferenceId?: string;               // PG transaction id if item-level
  shipmentTrackingId?: string;
  shipmentProvider?: string;
  promisedDeliveryDate?: Date | string;
  deliveredAt?: Date | string;
};


export type Order = {
  _id?: string;
  buyerId?: string | null;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  source?: string;
  items: OrderItem[];
  paymentReferenceId?: string;
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryEarning?: number;
  deliveredAt?: Date | string;
  createdAt?: Date;
  updatedAt?: Date;
};
