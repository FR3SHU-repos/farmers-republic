// shared/models/mongodb/farmer.ts
import mongoose, { Schema } from "mongoose";
import { Farmer } from "@/shared/interfaces/mongodb/farmer";

const geoLocationSchema = new Schema(
  {
    lat: { type: Number},
    lng: { type: Number },
  },
  { _id: false },
);

const pickupLocationSchema = new Schema(
  {
    address: { type: String},
    lat: { type: Number },
    lng: { type: Number},
  },
  { _id: false },
);

const socialMediaSchema = new Schema(
  {
    instagram: { type: String },
    youtube: { type: String },
    facebook: { type: String },
    website: { type: String },
  },
  { _id: false },
);

const weeklyAvailabilitySchema = new Schema(
  {
    monday: { type: Boolean },
    tuesday: { type: Boolean },
    wednesday: { type: Boolean },
    thursday: { type: Boolean },
    friday: { type: Boolean},
    saturday: { type: Boolean },
    sunday: { type: Boolean },
  },
  { _id: false },
);

const farmerSchema = new Schema<Farmer>(
  {
    // System / auth
    profileId: { type: String, index: true },

    // Identity
    name: { type: String, required: true, index: true },
    fatherName: { type: String },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    dateOfBirth: { type: String }, // YYYY-MM-DD

    // Contact
    phone: { type: String, index: true },
    alternatePhone: { type: String },
    email: { type: String },
    whatsappNumber: { type: String },

    // Address
    addressLine1: { type: String },
    addressLine2: { type: String },
    village: { type: String },
    mandal: { type: String },
    district: { type: String, index: true },
    state: { type: String, index: true },
    pincode: { type: String, index: true },
    geoLocation: { type: geoLocationSchema },

    // Farm Details
    farmName: { type: String },
    farmArea: { type: String }, // "2 acres"
    totalLandArea: { type: String }, // acres
    ownedLandArea: { type: String },
    leasedLandArea: { type: String },
    irrigationType: {
      type: String,
      enum: ["rainfed", "borewell", "canal", "other"],
      required: false,
    },
    soilType: { type: String },
    waterSource: { type: String },
    organicCertified: { type: Boolean, default: false },
    organicCertificationDetails: { type: String },
    farmingExperienceYears: { type: String },

    // Categories grown
    category: { type: String }, // primary category
    subCategories: [{ type: String }],
    seasonalCrops: [{ type: String }],
    perennialCrops: [{ type: String }],

    // Identification Docs
    aadhaarNumber: { type: String },
    aadhaarDocUrl: { type: String },
    panNumber: { type: String },
    panDocUrl: { type: String },
    bankPassbookUrl: { type: String },

    // Bank Details
    bankAccountHolderName: { type: String },
    bankAccountNumber: { type: String },
    bankIFSC: { type: String },
    bankName: { type: String },
    bankBranch: { type: String },
    upiId: { type: String },

    // Compliance / Licenses
    fssaiLicense: { type: String },
    fssaiDocUrl: { type: String },
    gstNumber: { type: String },
    gstDocUrl: { type: String },

    // Logistics / Delivery
    delivery: { type: Boolean, default: false }, // delivers directly
    deliveryRadiusKm: { type: Number },
    deliveryPinCodes: [{ type: String }],
    pickupLocation: { type: pickupLocationSchema },
    preferredCourierPartners: [{ type: String }],

    // Media
    avatar: { type: String }, // public URL
    photoPath: { type: String }, // storage path
    farmImages: [{ type: String }],
    farmVideos: [{ type: String }],

    // Story & Social
    about: { type: String },
    experienceDescription: { type: String },
    awards: [{ type: String }],
    socialMedia: { type: socialMediaSchema },

    // Ratings & performance
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    onTimeDeliveryRate: { type: Number }, // percentage
    repeatCustomerRate: { type: Number }, // percentage

    // Operational availability
    active: { type: Boolean },
    availableForOrders: { type: Boolean},
    weeklyAvailability: { type: weeklyAvailabilitySchema },

    // Admin
    verified: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: ["pending", "submitted", "verified", "rejected"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true },
);

const FarmerModel =
  mongoose.models.Farmer || mongoose.model<Farmer>("Farmer", farmerSchema);

export default FarmerModel;
