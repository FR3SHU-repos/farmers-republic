// shared/interfaces/mongodb/user.tsx

// This is for user interface for mongodb

// shared/interfaces/mongodb/user.ts

export interface IUser {
  _id?: string; // MongoDB ObjectId

  // 🔹 Role & access
  type:
    | "Farmer"
    | "Manager"
    | "Admin"
    | "Owner"
    | "Supplier"
    | "Distributor"
    | "Agent"
    | "Retailer"
    | "Wholesaler"
    | "Logistics Provider"
    | "Banker"
    | "Buyer";  // user role

  // 🔹 Core identity
  name: string;
  email: string;            // unique + indexed
  passwordHash: string;     // store hash, never plain password
  phoneNumber?: string;     // personal phone
  companyNumber?: string;   // business phone

  // 🔹 Government ID / KYC
  govId?: {
    type:
      | "Aadhar"
      | "PAN"
      | "Passport"
      | "Driving License"
      | "Tax ID"
      | "Other";
    docUrl?: string;        // link to uploaded file
    verified?: boolean;     // flag after admin checks
  };

  // 🔹 Subscription / plan
  subscription?:
    | "Free"
    | "Premium"
    | "Corporate"
    | "Paid"
    | "No Need"; // flexibility for your business logic
  subscriptionValidUntil?: Date;

  // 🔹 Address info
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };


  // 🔹 Profile / branding
  photo?: string; // profile pic URL

  // 🔹 System
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;

  // 🔹 Security / access management
  isActive?: boolean;     // allow blocking users
  roles?: string[];       // extra RBAC (ex: ["manage_orders", "view_reports"])

  // 🔹 Referral / invite (optional)
    referralCode?: string;  // code given to user for referrals
    inviteCode?: string;    // code used to sign up via invite

}
