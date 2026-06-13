// shared/interfaces/mongodb/orders/buyerOrders.tsx

// ─── Status enum ─────────────────────────────────────────────
// Full lifecycle from payment through delivery and refund.
// Actor ownership:
//   Farmer:   confirmed, packed
//   Delivery: picked_up, in_transit, out_for_delivery, delivered
//   Buyer:    payment_pending, cancelled, returned
//   System:   refund_initiated, refunded
export type OrderStatusValue =
  | "payment_pending"    // awaiting online payment confirmation
  | "pending"            // payment received / COD order placed
  | "confirmed"          // farmer has acknowledged the order
  | "packed"             // farmer has packed and ready for pickup
  | "picked_up"          // delivery person collected the order
  | "in_transit"         // on the way to the buyer
  | "out_for_delivery"   // last-mile, near the buyer
  | "delivered"          // successfully delivered
  | "cancelled"          // order cancelled before delivery
  | "returned"           // buyer returned after delivery
  | "refund_initiated"   // refund process started
  | "refunded";          // refund completed

// ─── Timeline entry ──────────────────────────────────────────
// One entry is pushed every time the order status changes.
export type OrderTimelineEntry = {
  status: string;
  timestamp: Date | string;
  note?: string;
  actorType?: "farmer" | "delivery" | "buyer" | "system";
  actorId?: string;
  actorName?: string;
};

// ─── Item sub-types ──────────────────────────────────────────

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

export type OrderItemDiscountLine = {
  type: "festive" | "coupon" | "farmer" | "bulk" | "manual";
  label?: string;
  amount: number;
};

export type OrderItemPlatformFeeLine = {
  type: "service" | "listing" | "payment_gateway" | "other";
  label?: string;
  amount: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;

  status?: string;

  deliveryCharge?: number;
  extraCharge?: number;
  serviceCharge?: number;

  platformFees?: OrderItemPlatformFeeLine[];
  platformFeeTotal?: number;

  discounts?: OrderItemDiscountLine[];
  discountTotal?: number;

  paymentMode?: OrderItemPaymentMode;
  paymentStatus?: OrderItemPaymentStatus;
  paidAmount?: number;
  currency?: string;

  taxAmount?: number;
  taxBreakup?: { cgst?: number; sgst?: number; igst?: number };

  farmerPayoutAmount?: number;
  farmerSettlementStatus?: OrderItemSettlementStatus;
  farmerSettlementAt?: Date | string;
  settlementReferenceId?: string;

  paymentReferenceId?: string;
  shipmentTrackingId?: string;
  shipmentProvider?: string;
  promisedDeliveryDate?: Date | string;
  deliveredAt?: Date | string;
};

// ─── Order ───────────────────────────────────────────────────

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

  // Delivery person tracking
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryEarning?: number;
  deliveredAt?: Date | string;

  // Order lifecycle timeline — one entry per status transition
  timeline?: OrderTimelineEntry[];

  createdAt?: Date;
  updatedAt?: Date;
};
