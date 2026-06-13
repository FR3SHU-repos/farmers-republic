export type GroupType = "village" | "apartment" | "fpo" | "workplace" | "cooperative";

export type CommunityGroup = {
  _id?: string;
  id?: string;
  name: string;
  type: GroupType;
  description?: string;
  location: string;
  pincode?: string;
  joinCode: string;
  adminUserId: string;
  adminName?: string;
  members: Array<{ userId: string; userName: string; joinedAt: Date | string }>;
  memberCount?: number;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
