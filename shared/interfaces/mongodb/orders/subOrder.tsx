export type SubOrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type SubOrder = {
  _id?: string;
  id?: string;
  orderId: string;
  farmerId: string;
  farmerName?: string;
  items: Array<{ productId: string; name: string; price: number; qty: number; image?: string }>;
  subtotal: number;
  status: SubOrderStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
