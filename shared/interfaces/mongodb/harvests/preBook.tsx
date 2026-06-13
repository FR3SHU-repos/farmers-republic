export type PreBookStatus = "pending" | "confirmed" | "fulfilled" | "cancelled";

export type PreBook = {
  _id?: string;
  id?: string;
  harvestId: string;
  farmerId: string;
  cropName?: string;
  harvestDate?: Date | string;
  buyerId?: string;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone: string;
  qty: number;
  unit?: string;
  priceAtBooking: number;
  estimatedTotal: number;
  status: PreBookStatus;
  note?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
