// app/shared/interfaces/mongodb/orders/buyerOrders.tsx

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  farmerId?: string;
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
  status: string;        // "pending", "confirmed", etc.
  paymentStatus: string; // "unpaid", "paid"
  paymentMode: string;   // "cod", "online"
  source?: string;       // "web", "app", "voice"
  items: OrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
};
