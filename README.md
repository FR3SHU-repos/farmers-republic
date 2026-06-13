# Farmers Republic (FR3SH)

A direct-to-consumer agricultural marketplace for India. Farmers list produce and announce upcoming harvests, buyers discover and order or pre-book, community groups split orders, FPOs are profiled with live sales data, delivery persons fulfil orders, and low-tech farmers can capture orders by voice.

Brand tagline: *"Pick fresh. Eat fresh."*

---

## 1) Tech Stack

### Core Framework
- **Next.js 16 (App Router, Turbopack)** for pages, layouts, and API routes.
- **React 19 + TypeScript 5** for typed component-driven UI.
- **Tailwind CSS v4** for styling via a semantic design-token system.

### Backend & Data
- **MongoDB + Mongoose 8** for persistent domain data.
- **JWT + bcryptjs** for auth/session primitives (httpOnly cookie, 7-day expiry).
- **Supabase Storage** for media upload/storage (avatars bucket, product-images bucket).

### UX & Utilities
- **react-hot-toast** for notifications.
- **framer-motion** for UI animations.
- **lucide-react** for all iconography (no inline SVGs).
- **Nodemailer** for transactional email (Brevo SMTP primary, Zoho fallback).
- **OpenAI SDK** for voice order transcription (Whisper) and AI extensions.

---

## 2) User Roles

Values are **always capitalised** in the database and in comparisons.

| Role | `user.type` value | Description |
|---|---|---|
| Farmer | `"Farmer"` | Lists products, announces harvests, views buyer orders |
| Buyer | `"Buyer"` | Browses products, places orders, pre-books harvests |
| Delivery Person | `"Logistics Provider"` | Picks up and delivers orders, tracks earnings |
| FPO | `"FPO"` | Farmer Producer Organisation profile |
| Admin | `"Admin"` | Platform admin — KYC review, order/product/user management |

> Never compare against lowercase values. `user.type === "Farmer"` ✓  `user.type === "farmer"` ✗

---

## 3) Design Token System

All colors are defined as semantic tokens in `app/globals.css` using Tailwind v4's `@theme {}` directive. Raw palette classes like `bg-green-600` or `text-stone-500` are **never** used in app pages.

```css
@theme {
  --color-primary: #065f46;
  --color-primary-hover: #022c22;
  --color-primary-foreground: #ffffff;
  --color-secondary: #bef264;
  --color-secondary-subtle: #d9f99d;
  --color-secondary-foreground: #022c22;
  --color-surface: #eff6e8;
  --color-surface-card: #ffffff;
  --color-foreground-heading: #022c22;
  --color-foreground-body: #44403c;
  --color-foreground-muted: #78716c;
  --color-brand: #047857;
  --color-border: #d1ead9;
  --color-border-focus: #6ee7b7;
  --color-status-warning: #b45309;   --color-status-warning-surface: #fffbeb;
  --color-status-info: #1d4ed8;      --color-status-info-surface: #eff6ff;
  --color-status-success: #15803d;   --color-status-success-surface: #f0fdf4;
  --color-status-danger: #b91c1c;    --color-status-danger-surface: #fef2f2;
}
```

Every button, input, badge, and card uses one of these tokens. New colors must be added here as named tokens — never hardcode hex values or raw Tailwind palette classes.

---

## 4) High-Level Architecture

```
App Router Pages (app/**/page.tsx)
  ├─ shared templates/components for UI composition
  ├─ shared context (UserContext, CartContext) for cross-page state
  ├─ API routes (/api/v1/*) for all CRUD operations
  └─ API routes → MongoDB via Mongoose models
                → Supabase for media
```

---

## 5) Pages & Routes

### Authentication
| Route | Description |
|---|---|
| `/login` | Login + register (split-layout). Role dropdown includes all types |
| `/forgot-password` | Send OTP email |
| `/reset-password` | Enter OTP + new password |

### Shopping
| Route | Description |
|---|---|
| `/` | Homepage / landing |
| `/shop` | Buyer-facing product discovery |
| `/products/create` | Create a new product (tabbed form, image drop-zone, completion checklist) |
| `/products/[id]` | Product detail — gallery, characteristics, add to cart / buy now |
| `/products/[id]/edit` | Edit existing product — redesigned with design tokens, sticky save bar |
| `/cart` | Cart review + checkout |

### Harvests (Harvest-Based Commerce)
| Route | Description |
|---|---|
| `/harvests` | Public marketplace — countdown badges, crop search, date filter pills, pre-booking CTA, link to My Pre-bookings |
| `/harvests/[id]` | Harvest detail — freshness timeline, sticky pre-book form, success state, fully-booked guard |
| `/farmers/harvests` | Farmer dashboard — stats cards, list of all own harvest announcements, status filter tabs, Mark Harvested quick action |
| `/farmers/harvests/new` | Announce a new harvest — live preview card, UNIT_OPTIONS |
| `/farmers/harvests/[id]` | Farmer manage — inline edit toggle, pre-bookings table with confirm/fulfill/cancel per booking |
| `/profile/prebookings` | Buyer's pre-bookings list — status filter tabs, summary stats, link back to harvest detail |

### Farmers
| Route | Description |
|---|---|
| `/farmers` | Farmer list |
| `/farmers/create` | Create farmer profile |
| `/farmers/[id]` | Farmer public profile |
| `/farmers/edit/[id]` | Edit farmer profile — redesigned with design tokens, 8 section tabs, sticky save bar, avatar upload |
| `/farmers/dashboard` | Farmer dashboard with stats |
| `/farmers/orders` | Farmer orders list — buyer orders containing this farmer's products, stat cards, status filters |
| `/farmers/orders/[id]` | Farmer order detail — buyer info, per-item management, earnings summary |
| `/farmers/kyc` | KYC document submission for farmers |
| `/farmers/analytics` | Farmer analytics — revenue, orders, top products, bar chart dashboard |
| `/farmers/adapted` | Adopted/followed farmers list |

### Community Buying
| Route | Description |
|---|---|
| `/community` | Community groups list — search by location/pincode |
| `/community/new` | Create a community group (village, apartment, FPO, workplace, cooperative) |
| `/community/[id]` | Group detail — members, active group orders, join with code |

### Buyers
| Route | Description |
|---|---|
| `/buyers/create` | Create buyer profile |
| `/buyers/profile/[id]` | Buyer public profile |
| `/buyers/edit/[id]` | Edit buyer profile |

### Delivery Persons
| Route | Description |
|---|---|
| `/delivery` | Delivery dashboard — available orders, filter pills, stat cards, quick pickup/deliver buttons |
| `/delivery/[id]` | Delivery order detail — tap-to-call, items, COD banner, action buttons |
| `/delivery/earnings` | Earnings dashboard — lifetime total, 4 stat tiles, 14-day bar chart, delivery history |

### Admin Panel
| Route | Description |
|---|---|
| `/admin` | Admin overview — platform stats (users, orders, farmers, GMV), recent orders |
| `/admin/analytics` | Business intelligence — 11 aggregations with period filter (7d/30d/90d/all), bar charts |
| `/admin/farmers` | Farmer management — KYC review workflow (pending/verified/rejected) |
| `/admin/orders` | Platform order management |
| `/admin/products` | Product moderation |
| `/admin/users` | User management |

### Growth Features
| Route | Description |
|---|---|
| `/wallet` | Wallet dashboard — balance, transaction history, top-up/withdraw |
| `/referral` | Referral programme — share link, track referrals, ₹100 reward auto-credited |
| `/profile/badges` | Gamification badges — 8 badge types, earned/locked state |
| `/frsh-plus` | FR3SH Plus subscription — monthly ₹199 / annual ₹1,499 |

### FPOs & Orders
| Route | Description |
|---|---|
| `/fpos` | FPO listing |
| `/fpos/[id]` | FPO detail — stats, products, farmers, land, activity timeline |
| `/orders/[id]` | Buyer order history |
| `/orders/details/[id]` | Single buyer order detail |
| `/orders/farmerOrders` | Farmer voice/phone order capture form |
| `/orders/voice` | Voice order capture UI |

### Account
| Route | Description |
|---|---|
| `/profile` | User profile — avatar upload, account details, role-based quick links |
| `/policies/*` | Privacy, refund, return, shipping, T&C |

---

## 6) Navigation

### Desktop navbar
- **Primary nav pills**: Farmers, FPOs, Shop, Harvests, Community
- **More dropdown** (role-aware sections):
  - *Buyers*: My Pre-bookings, Referral
  - *Farmers*: My Harvests, Analytics, Announce Harvest, Add Product
  - *Admins*: Admin Panel, Analytics
  - *All*: Adopted Farmers

### Mobile bottom nav
- **Bottom bar tabs**: Home, Shop, **Harvests** (direct tab), More, Cart, Profile
- **More popover** (scrollable, 4-column icon grid, role-aware sections):
  - *Discover*: Harvests, Community, Farmers, Products
  - *My Account (buyers)*: My Orders, Pre-bookings, Referral
  - *Farmer Tools*: My Harvests, Analytics, New Harvest, Referral
  - *Admin*: Admin Panel, Analytics

---

## 7) API Surface (`/api/v1`)

All handlers: `await mongoDB()` → validate → query/mutate → return `{ success, message, data }`.

### Auth
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Create user account |
| `/api/v1/auth/login` | POST | Issue JWT cookie |
| `/api/v1/auth/logout` | POST | Clear JWT cookie |
| `/api/v1/auth/me` | GET | Return current user from cookie |
| `/api/v1/auth/send-reset-otp` | POST | Email OTP for password reset |
| `/api/v1/auth/verify-reset-otp` | POST | Validate OTP |

### Core CRUD
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/farmers` | GET, POST, PATCH | Farmer CRUD. GET supports `?profileId=` to resolve userId → farmerId |
| `/api/v1/buyers` | GET, POST, PATCH | Buyer CRUD |
| `/api/v1/products` | GET, POST | Product list + create |
| `/api/v1/products/[id]` | GET, PATCH, DELETE | Single product |
| `/api/v1/user/update` | PATCH | Update user profile fields |
| `/api/v1/user/photo` | PATCH | Upload avatar to Supabase |

### Orders
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/orders/[id]` | GET, PATCH | Fetch / update buyer order. PATCH creates `DeliveryEarning` on `"delivered"` |
| `/api/v1/orders/[id]/split` | POST | Split order into per-farmer SubOrders |
| `/api/v1/farmers/dashboard/orders` | GET | Buyer orders filtered by `items.farmerId` |
| `/api/v1/farmers/orders/[id]` | GET, PATCH | Single farmer-view order detail + per-item updates |

### Harvests
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/harvests` | GET, POST | List open harvests (with crop/status/farmerId filters) + create |
| `/api/v1/harvests/[id]` | GET, PATCH, DELETE | Get detail, update fields/status, soft-delete (sets `cancelled`) |
| `/api/v1/harvests/[id]/prebook` | POST | Atomic pre-book — validates open status, checks remainingQty, `$inc totalPreBooked` |
| `/api/v1/harvests/[id]/prebookings` | GET, PATCH | List prebookings for a harvest (farmer view) + update per-booking status |
| `/api/v1/prebookings` | GET | All prebookings for a buyer (`?buyerId=` or `?buyerPhone=`) |

### Community
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/community` | GET, POST | List groups (filter by pincode/location) + create |
| `/api/v1/community/[id]` | GET, PATCH | Group detail + update |
| `/api/v1/community/[id]/join` | POST | Join group with joinCode |
| `/api/v1/community/[id]/orders` | GET, POST | List group orders + create new group order |

### Delivery
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/delivery/orders` | GET | Deliverable orders with pagination |
| `/api/v1/delivery/earnings` | GET, POST | GET aggregated stats + history. POST create manual record |

### Admin
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/admin/stats` | GET | Platform overview — totalUsers, totalFarmers, totalOrders, GMV, pendingKYC, ordersByStatus |
| `/api/v1/admin/farmers` | GET | All farmers with KYC status filter |
| `/api/v1/admin/farmers/[id]` | GET, PATCH | Farmer detail + KYC review (sets `kycStatus`, auto-syncs `verified`) |
| `/api/v1/admin/orders` | GET | Platform orders list |
| `/api/v1/admin/orders/[id]` | GET, PATCH | Order detail + status override |
| `/api/v1/admin/products` | GET | All products |
| `/api/v1/admin/users` | GET | All users |
| `/api/v1/admin/users/[id]` | GET, PATCH | User detail + role management |

### Analytics
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/analytics/admin` | GET | 11 parallel aggregations — revenue, orders, GMV, top farmers, top products, by status, by period (7d/30d/90d/all) |
| `/api/v1/analytics/farmer` | GET | Per-farmer — revenue, orders, top products (all filtered by `items.farmerId`) |

### Growth
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/wallet` | GET, POST, PATCH | GET balance + transactions. POST top-up. PATCH debit (atomic, guards negative balance) |
| `/api/v1/wallet/transactions` | GET | Transaction history |
| `/api/v1/referral` | GET, POST, PATCH | GET stats. POST record referral. PATCH reward (auto-credits ₹100 to wallet) |
| `/api/v1/badges` | GET, POST | GET user badges. POST award badge (idempotent via compound unique index) |
| `/api/v1/subscription` | GET, POST | GET subscription status. POST subscribe (monthly ₹199 / annual ₹1,499) |
| `/api/v1/farmers/kyc` | POST, PATCH | Submit KYC documents (farmer), update KYC status (admin) |

### Helpers
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/helper/by-profile/[userId]` | GET | Resolve auth `user.id` → `farmerId` (Mongoose `_id`) |

---

## 8) Data Models

All models: `shared/models/mongodb/`. Each uses `mongoose.models.X || mongoose.model(...)`.

| Model | File | Key fields |
|---|---|---|
| `UserModel` | `user.tsx` | `type` (role enum), `email` (unique), `passwordHash`, `subscription` |
| `FarmerModel` | `farmer.tsx` | `profileId` (→ User._id), `name`, `district`, KYC fields, `verified`, `kycStatus` |
| `BuyerModel` | `buyer.tsx` | `profileId` (→ User._id), `name`, `address` |
| `ProductModel` | `products/products.tsx` | `farmerId`, `name`, `price`, `stockQty`, `category` |
| `OrderModel` | `orders/buyerOrders.tsx` | `buyerId`, `items[]`, `subtotal`, `total`, `deliveryPersonId`, `deliveryEarning`, `deliveredAt` |
| `FarmerOrderModel` | `orders/farmerOrders.tsx` | `farmerId`, `customerName/Phone/Address`, `items[]`, `source` |
| `SubOrderModel` | `orders/subOrder.tsx` | `orderId`, `farmerId`, `items[]`, `subtotal`, `status` — per-farmer split of a BuyerOrder |
| `DeliveryEarningModel` | `delivery/deliveryEarning.ts` | `deliveryPersonId`, `orderId` (unique), `earning`, `deliveredAt` |
| `HarvestModel` | `harvests/harvest.tsx` | `farmerId`, `crop`, `expectedQty`, `totalPreBooked`, `harvestDate`, `status`, `estimatedPrice` |
| `PreBookModel` | `harvests/preBook.tsx` | `harvestId`, `farmerId`, `buyerId`, `buyerPhone`, `qty`, `estimatedTotal`, `status` |
| `CommunityGroupModel` | `community/communityGroup.tsx` | `name`, `type`, `location`, `joinCode` (unique), `adminUserId`, `members[]` |
| `GroupOrderModel` | `community/groupOrder.tsx` | `communityGroupId`, `items[]`, `deadline`, `status` |
| `WalletModel` | `wallet/wallet.tsx` | `userId` (unique), `balance` (min 0) |
| `WalletTransactionModel` | `wallet/walletTransaction.tsx` | `userId`, `type`, `amount`, `description`, `balanceAfter` |
| `UserBadgeModel` | `gamification/userBadge.tsx` | `userId`, `badgeId` — compound unique index prevents duplicates |
| `AdaptModel` | `adapt.tsx` | `buyerId`, `farmerId` |
| `ResetTokenModel` | `resetToken.tsx` | OTP-based password reset tokens |

### Harvest status flow
```
draft → open → fully_booked → harvested | cancelled
```

### PreBook status flow
```
pending → confirmed → fulfilled | cancelled
```

### Community group types
```
"village" | "apartment" | "fpo" | "workplace" | "cooperative"
```

### Gamification badge IDs
```
"first_order" | "five_orders" | "loyal_buyer" | "big_spender" |
"early_adopter" | "referral_champion" | "harvest_explorer" | "community_member"
```

---

## 9) Delivery Earning Flow

1. Driver taps **Mark Delivered** on `/delivery/[id]`
2. UI calls `PATCH /api/v1/orders/[id]` with `{ status: "delivered", deliveryPersonId, deliveryPersonName, deliveryEarning }`
3. Route updates Order document + `findOneAndUpdate` (upsert) on `DeliveryEarning`
4. `/delivery/earnings` queries the dedicated `DeliveryEarning` collection

Earning = `deliveryFee > 0 ? deliveryFee : 30` (minimum ₹30).

---

## 10) Harvest Pre-booking Flow

1. Farmer creates harvest at `/farmers/harvests/new` → `POST /api/v1/harvests`
2. Buyer finds it at `/harvests` marketplace → clicks → `/harvests/[id]`
3. Buyer fills pre-book form → `POST /api/v1/harvests/[id]/prebook`
4. API atomically: `findOneAndUpdate({ _id, status: "open" }, { $inc: { totalPreBooked: qty } })` — prevents overselling
5. Auto-marks `fully_booked` when `totalPreBooked >= expectedQty`
6. Farmer manages pre-bookings at `/farmers/harvests/[id]` — can confirm/fulfill/cancel each

---

## 11) Key Component Patterns

### Standard input
```tsx
const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm " +
  "text-foreground-heading placeholder:text-foreground-muted " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
```

### Status badge
```tsx
const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-status-warning-surface text-status-warning",
  confirmed: "bg-status-info-surface text-status-info",
  delivered: "bg-status-success-surface text-status-success",
  cancelled: "bg-status-danger-surface text-status-danger",
};
```

### Card wrapper
```tsx
"rounded-2xl border border-border bg-surface-card p-5"
```

### Sticky save bar (edit pages)
```tsx
<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-card/95 px-4 py-4 backdrop-blur-sm">
```

### Conditional classNames
```tsx
import { cx } from "@/shared/lib/utils";
cx("base-class", isActive && "active-class")
```

---

## 12) Next.js 16 Gotchas

### Route params are a Promise
```ts
// Server page
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// Client page
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
}

// API route handler
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
}
```

### Schema generics cause TS2322 with ObjectId fields
```ts
// WRONG — TS2322 when interface has string but schema uses ObjectId
new Schema<MyType>({ farmerId: { type: Schema.Types.ObjectId } })

// CORRECT — remove generic
new Schema({ farmerId: { type: Schema.Types.ObjectId } })
```

---

## 13) Project Structure

```
farmers-republic/
├── app/
│   ├── (auth)/                    # login, forgot-password, reset-password
│   ├── admin/                     # Admin panel (sidebar layout)
│   │   ├── layout.tsx             # AdminSidebarLayout wrapper
│   │   ├── page.tsx               # Overview + stats
│   │   ├── analytics/             # BI dashboard with period filter
│   │   ├── farmers/               # KYC review workflow
│   │   ├── orders/                # Platform order management
│   │   ├── products/              # Product moderation
│   │   └── users/                 # User management
│   ├── api/v1/
│   │   ├── admin/                 # stats, farmers, orders, products, users
│   │   ├── analytics/             # admin + farmer analytics
│   │   ├── auth/                  # register, login, logout, me, OTP reset
│   │   ├── badges/                # Gamification badges
│   │   ├── buyers/                # Buyer CRUD
│   │   ├── community/             # Community groups + group orders + join
│   │   ├── delivery/              # orders + earnings
│   │   ├── farmers/               # CRUD, dashboard/orders, orders/[id], kyc, adapted
│   │   ├── harvests/              # CRUD + [id]/prebook + [id]/prebookings
│   │   ├── orders/                # buyer orders [id] + [id]/split
│   │   ├── prebookings/           # Buyer pre-bookings list
│   │   ├── products/              # Product CRUD
│   │   ├── referral/              # Referral programme
│   │   ├── subscription/          # FR3SH Plus
│   │   ├── user/                  # Profile update + photo
│   │   ├── wallet/                # Wallet + transactions
│   │   └── utils/                 # responses, verifyToken
│   ├── cart/
│   ├── community/                 # List + new + [id] detail
│   ├── delivery/                  # Dashboard, [id], earnings
│   ├── farmers/
│   │   ├── analytics/             # Farmer analytics dashboard
│   │   ├── edit/[id]/             # Edit profile (redesigned)
│   │   ├── harvests/              # Dashboard, new, [id] manage
│   │   ├── kyc/                   # KYC document submission
│   │   └── orders/                # List + [id] detail
│   ├── fpos/
│   ├── frsh-plus/                 # Subscription page
│   ├── harvests/                  # Marketplace + [id] detail
│   ├── orders/                    # Buyer orders + voice + farmerOrders
│   ├── products/                  # List, [id], [id]/edit, create
│   ├── profile/
│   │   ├── badges/                # Gamification badges
│   │   └── prebookings/           # Buyer pre-bookings
│   ├── referral/
│   ├── shop/
│   ├── wallet/
│   ├── globals.css                # Design tokens + Tailwind base
│   ├── layout.tsx                 # Root layout + providers
│   └── page.tsx                   # Homepage
│
├── shared/
│   ├── components/
│   │   ├── layouts/
│   │   │   └── AdminSidebarLayout.tsx  # Fixed sidebar + mobile hamburger
│   │   ├── templates/             # navbar, bottomNav, productCard, productDetail
│   │   └── molecules/             # FarmerCard, ProductGridClient, etc.
│   ├── context/                   # UserContext, CartContext
│   ├── interfaces/mongodb/
│   │   ├── community/             # communityGroup, groupOrder
│   │   ├── delivery/              # deliveryEarning
│   │   ├── gamification/          # badge (BADGE_DEFINITIONS constant)
│   │   ├── harvests/              # harvest, preBook
│   │   ├── orders/                # buyerOrders, farmerOrders, subOrder
│   │   └── wallet/                # wallet, walletTransaction
│   ├── lib/                       # mongo.tsx, supabase/client.tsx, utils.tsx
│   └── models/mongodb/
│       ├── community/             # CommunityGroupModel, GroupOrderModel
│       ├── delivery/              # DeliveryEarningModel
│       ├── gamification/          # UserBadgeModel
│       ├── harvests/              # HarvestModel, PreBookModel
│       ├── orders/                # OrderModel, FarmerOrderModel, SubOrderModel
│       └── wallet/                # WalletModel, WalletTransactionModel
│
├── public/                        # Static assets
├── instructions.md                # AI agent reference document
└── README.md                      # This file
```

---

## 14) Local Setup

```bash
npm install
npm run dev     # http://localhost:3000 (Turbopack)
npm run build
npm run start
```

Copy `info.env.txt` → `.env.local` and populate all secrets.

### Required environment variables

```env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_SUPABASE_BUCKET=avatars

OPENAI_API_KEY=

BREVO_HOST=
BREVO_PORT=
BREVO_USER=
BREVO_PASS=

ZOHO_USER=
ZOHO_PASS=

NEXT_PUBLIC_APP_NAME=FR3SH
```

---

## 15) Developer Onboarding

1. Read `instructions.md` for the full agent/developer reference.
2. Open `app/globals.css` to understand the color token system before touching any styles.
3. Start with `app/layout.tsx` to understand global providers.
4. Trace one vertical flow end-to-end — recommended:
   - Harvest flow: `/farmers/harvests/new` → `POST /api/v1/harvests` → `/harvests` → `POST /api/v1/harvests/[id]/prebook` → `/farmers/harvests/[id]`
   - Delivery flow: `/delivery/[id]` → `PATCH /api/v1/orders/[id]` → `DeliveryEarningModel` → `GET /api/v1/delivery/earnings`
5. Before adding any color, check the token table in `instructions.md` — never hardcode hex values or raw Tailwind palette classes.
