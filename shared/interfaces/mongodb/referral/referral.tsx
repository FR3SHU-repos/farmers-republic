export type ReferralStatus = "pending" | "rewarded" | "expired";

export type Referral = {
  _id?: string;
  id?: string;
  referrerId: string;
  referrerName?: string;
  referrerCode: string;
  refereeId: string;
  refereeName?: string;
  refereeEmail?: string;
  status: ReferralStatus;
  rewardAmount: number;
  rewardedAt?: Date | string;
  createdAt?: Date | string;
};
