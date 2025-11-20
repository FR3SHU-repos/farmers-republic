// shared/models/mongodb/resetToken.tsx


export interface IResetToken {
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts?: number;
  createdAt?: Date;
}
