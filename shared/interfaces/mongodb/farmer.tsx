// shared/interfaces/mongodb/farmer.ts

export type FarmerProduct = {
  id?: string | number;
  name: string;
};

export type Farmer = {
  id?: string;
  profileId?: string;       // auth user id (user?.id)
  name: string;
  farmName?: string;
  farmArea?: string;        // e.g. "2 acres"
  category?: string;        // e.g. "Fruits"
  place?: string;
  phone?: string;
  avatar?: string;          // public URL
  photoPath?: string;       // Supabase path for deletion if needed
  about?: string;
  delivery?: boolean;       // ✅ whether farmer delivers directly
  createdAt?: Date;
  updatedAt?: Date;
};
