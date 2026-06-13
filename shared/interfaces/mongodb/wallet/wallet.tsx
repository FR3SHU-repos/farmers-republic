export type WalletTransactionType =
  | "credit"
  | "debit"
  | "refund"
  | "referral_reward"
  | "cashback"
  | "subscription_refund";

export type WalletTransactionStatus = "pending" | "completed" | "failed";

export type WalletTransaction = {
  _id?: string;
  id?: string;
  walletId: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  orderId?: string;
  status: WalletTransactionStatus;
  createdAt?: Date | string;
};

export type Wallet = {
  _id?: string;
  id?: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
