export type HarvestStatus = "draft" | "open" | "fully_booked" | "harvested" | "cancelled";

export type UpcomingHarvest = {
  _id?: string;
  id?: string;
  farmerId: string;
  farmerName?: string;
  farmerLocation?: string;
  crop: string;
  variety?: string;
  description?: string;
  expectedQty: number;
  unit: string;
  estimatedPrice: number;
  currency?: string;
  harvestDate: Date | string;
  preBookDeadline?: Date | string;
  minPreBookQty?: number;
  maxPreBookQty?: number;
  totalPreBooked?: number;
  status: HarvestStatus;
  images?: string[];
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
