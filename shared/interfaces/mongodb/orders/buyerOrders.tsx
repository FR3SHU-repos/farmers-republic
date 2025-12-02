export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;

  // ✨ NEW per-item fields
  status?: string;          // "pending", "confirmed", etc. (defaults to order.status)
  deliveryCharge?: number;  // delivery charge for THIS item
  extraCharge?: number;     // any extra (packing, handling)
  serviceCharge?: number;   // platform/service fee for this item
};

export type Order = {
  _id?: string;
  buyerId?: string | null;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string; // if you ever add it
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;        // overall order status
  paymentStatus: string; // "unpaid", "paid"
  paymentMode: string;   // "cod", "online"
  source?: string;       // "web", "app", "voice"
  items: OrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
};
