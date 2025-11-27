// shared/interfaces/mongodb/buyer.ts

export type BuyerAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
};

export type Buyer = {
  id?: string;
  profileId?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: BuyerAddress;
  avatar?: string;    // public URL
  photoPath?: string; // Supabase path
  about?: string;     // notes, preferences
  createdAt?: Date;
  updatedAt?: Date;
};
