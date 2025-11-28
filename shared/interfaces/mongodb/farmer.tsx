export interface Farmer {
  // System IDs
  id?: string;
  profileId?: string;            // Auth user ID
  createdAt?: Date;
  updatedAt?: Date;

  // Basic Identity
  name: string;                  // Farmer name
  fatherName?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;          // YYYY-MM-DD

  // Contact
  phone?: string;
  alternatePhone?: string;
  email?: string;
  whatsappNumber?: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;
  geoLocation?: {
    lat: number;
    lng: number;
  };

  // Farm Details
  farmName?: string;
  farmArea?: string;              // "2 acres"
  totalLandArea?: String;         // acres
  ownedLandArea?: String;
  leasedLandArea?: String;
  irrigationType?: "rainfed" | "borewell" | "canal" | "other";
  soilType?: string;              // red soil, black soil, etc.
  waterSource?: string;           // borewell, canal, tank water, etc.
  organicCertified?: boolean;
  organicCertificationDetails?: string;
  farmingExperienceYears?: String;

  // Categories grown
  category?: string;              // primary category (fruits, vegetables)
  subCategories?: string[];       // mangoes, leafy greens, millets
  seasonalCrops?: string[];
  perennialCrops?: string[];

  // Identification Documents
  aadhaarNumber?: string;
  aadhaarDocUrl?: string;
  panNumber?: string;
  panDocUrl?: string;
  bankPassbookUrl?: string;

  // Bank Details (for payouts)
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  bankBranch?: string;
  upiId?: string;                 // farmer@upi

  // Compliance / Licenses
  fssaiLicense?: string;
  fssaiDocUrl?: string;
  gstNumber?: string;
  gstDocUrl?: string;

  // Logistics / Delivery
  delivery?: boolean;             // farmer delivers directly
  deliveryRadiusKm?: number;
  deliveryPinCodes?: string[];
  pickupLocation?: {
    address: string;
    lat: number;
    lng: number;
  };
  preferredCourierPartners?: string[];

  // Farm Media
  avatar?: string;                // profile photo
  photoPath?: string;             // storage path
  farmImages?: string[];          // farm photos
  farmVideos?: string[];          // farm videos / reels

  // Story & Social
  about?: string;                 // long description
  experienceDescription?: string; // their farming journey
  awards?: string[];              // awards / recognitions
  socialMedia?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    website?: string;
  };

  // Ratings & Performance
  rating?: number;                // average rating
  reviewsCount?: number;
  onTimeDeliveryRate?: number;    // %
  repeatCustomerRate?: number;    // %

  // Operational Availability
  active?: boolean;
  availableForOrders?: boolean;
  weeklyAvailability?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };

  // Internal Admin
  verified?: boolean;             // KYC / manual verification
  kycStatus?: "pending" | "submitted" | "verified" | "rejected";
  notes?: string;                 // internal admin notes
}
