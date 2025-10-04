// shared/interfaces/mongodb/farmer.tsx

// shared/interfaces/farmer.ts
export type FarmerProduct = {
  id?: string | number;
  name: string;
};

export type Farmer = {
  id?: string;
  name: string;
  farmName?: string;
  farmArea?: string; // e.g. "2 acres"
  crops: string[]; // crops grown
  products?: FarmerProduct[]; // products produced
  fpo?: string | null;
  swadeshiPercent?: number; // 0-100
  place?: string;
  phone?: string;
  avatar?: string; // public URL
  photoPath?: string; // Supabase path for deletion if needed
  about?: string;
  established?: string; // year
  certifications?: string[];
  last30daysSales?: number;
  createdAt?: Date;
  updatedAt?: Date;
};
