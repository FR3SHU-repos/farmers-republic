export type BadgeId =
  | "fresh_buyer"
  | "organic_lover"
  | "top_supporter"
  | "farmer_supporter"
  | "community_builder"
  | "loyal_customer"
  | "early_bird"
  | "fr3sh_plus";

export const BADGE_DEFINITIONS: Record<
  BadgeId,
  { label: string; description: string; emoji: string }
> = {
  fresh_buyer: {
    label: "Fresh Buyer",
    description: "Made your first purchase",
    emoji: "🛒",
  },
  organic_lover: {
    label: "Organic Lover",
    description: "Bought 5+ organic products",
    emoji: "🌿",
  },
  top_supporter: {
    label: "Top Supporter",
    description: "Spent ₹5,000 or more",
    emoji: "⭐",
  },
  farmer_supporter: {
    label: "Farmer Supporter",
    description: "Bought from 5+ different farmers",
    emoji: "🧑‍🌾",
  },
  community_builder: {
    label: "Community Builder",
    description: "Joined a community buying group",
    emoji: "🏘️",
  },
  loyal_customer: {
    label: "Loyal Customer",
    description: "Placed 10+ orders",
    emoji: "💚",
  },
  early_bird: {
    label: "Early Bird",
    description: "Among the first 1,000 users on FR3SH",
    emoji: "🐦",
  },
  fr3sh_plus: {
    label: "FR3SH+ Member",
    description: "Active FR3SH Plus subscriber",
    emoji: "✨",
  },
};

export type UserBadge = {
  _id?: string;
  id?: string;
  userId: string;
  badgeId: BadgeId;
  earnedAt: Date | string;
};
