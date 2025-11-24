// shared/interfaces/mongodb/orders/farmerOrders.ts

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type PaymentMode = "cod" | "online" | "bank-transfer" | "upi";

export type OrderSource = "app" | "voice" | "phone-call" | "whatsapp" | "other";

export interface IOrderItem {
  productId: string;            // Product _id
  productName: string;          // denormalised for quick view
  unit?: string;                // kg, litre, piece, etc.
  quantity: number;             // how many
  pricePerUnit: number;         // price per unit at order time
  lineTotal: number;            // quantity * pricePerUnit
}

export interface IOrder {
  id: string;

  // Farmer side
  farmerId: string;             // Farmer _id
  farmerName?: string;          // denormalised

  // Consumer details
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerCity?: string;

  // Items
  items: IOrderItem[];

  // Money
  subtotal: number;             // sum of lineTotal
  deliveryFee?: number;
  total: number;                // subtotal + deliveryFee

  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  status: OrderStatus;
  source: OrderSource;          // how the order was captured (voice, app, etc.)

  notes?: string;               // any notes from farmer / customer

  createdAt: string;
  updatedAt: string;
}
