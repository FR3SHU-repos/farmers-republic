export type GroupOrderStatus = "open" | "closed" | "submitted" | "delivered" | "cancelled";

export type GroupOrderItem = {
  productId: string;
  productName: string;
  unit: string;
  pricePerUnit: number;
  requests: Array<{ userId: string; userName: string; qty: number }>;
  totalQty: number;
  farmerId?: string;
};

export type GroupOrder = {
  _id?: string;
  id?: string;
  communityGroupId: string;
  groupName?: string;
  createdByUserId: string;
  createdByName?: string;
  title: string;
  description?: string;
  items: GroupOrderItem[];
  deadline: Date | string;
  deliveryLocation?: string;
  deliveryFee?: number;
  totalEstimated?: number;
  status: GroupOrderStatus;
  memberCount?: number;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
