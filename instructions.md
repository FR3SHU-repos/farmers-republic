# FR3SH — AI Agent Instructions

This document gives any AI agent a complete picture of the project so it can work effectively without reading every file.

---

## What This Project Is

**FR3SH** (codebase name: `farmers-republic`) is a direct-to-consumer agricultural marketplace built for India. It connects farmers to buyers, supports FPOs, enables delivery persons to fulfil orders, allows community groups to place bulk orders, supports harvest pre-booking, and includes voice-based order capture for low-tech farmer users.

Brand tagline: *"Pick fresh. Eat fresh."*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | MongoDB Atlas via Mongoose 8 |
| File Storage | Supabase (avatars bucket, product-images bucket) |
| Auth | JWT (httpOnly cookies) + bcryptjs |
| Email | Brevo SMTP (primary) / Zoho SMTP (fallback) via Nodemailer |
| AI / Voice | OpenAI SDK (Whisper / GPT), browser Web Speech API |
| Animation | Framer Motion |
| Toast | react-hot-toast |
| Icons | lucide-react |

---

## Project Structure

```
farmers-republic/
├── app/
│   ├── (auth)/                    # login, forgot-password, reset-password
│   ├── admin/                     # Admin panel — layout uses AdminSidebarLayout
│   │   ├── layout.tsx             # wraps all /admin/* with sidebar
│   │   ├── page.tsx               # platform overview + stats
│   │   ├── analytics/             # BI dashboard
│   │   ├── farmers/               # KYC review
│   │   ├── orders/                # order management
│   │   ├── products/              # product moderation
│   │   └── users/                 # user management
│   ├── api/v1/
│   │   ├── admin/                 # stats, farmers/[id], orders/[id], products, users/[id]
│   │   ├── analytics/             # admin + farmer aggregations
│   │   ├── auth/                  # login, logout, register, me, OTP reset
│   │   ├── badges/                # gamification badge award + list
│   │   ├── buyers/                # buyer CRUD
│   │   ├── community/             # group CRUD + join + group orders
│   │   ├── delivery/              # orders (deliverable list) + earnings
│   │   ├── farmers/               # CRUD, dashboard/orders, orders/[id], kyc, adapted
│   │   ├── harvests/              # CRUD + [id]/prebook + [id]/prebookings
│   │   ├── helper/by-profile/     # resolve userId → farmerId
│   │   ├── orders/                # buyer orders [id] + [id]/split (SubOrders)
│   │   ├── prebookings/           # buyer pre-bookings list (?buyerId=)
│   │   ├── products/              # product CRUD
│   │   ├── referral/              # referral stats, record, reward
│   │   ├── subscription/          # FR3SH Plus
│   │   ├── user/                  # profile update + photo upload
│   │   ├── wallet/                # balance, debit, credit, transactions
│   │   └── utils/                 # responses(), verifyToken()
│   ├── cart/
│   ├── community/                 # group list + new + [id]
│   ├── delivery/                  # dashboard + [id] + earnings
│   ├── farmers/
│   │   ├── analytics/             # farmer analytics dashboard
│   │   ├── edit/[id]/             # edit profile (redesigned with design tokens)
│   │   ├── harvests/              # farmer harvest dashboard + new + [id]
│   │   ├── kyc/                   # KYC submission
│   │   └── orders/                # buyer orders list + [id] detail
│   ├── fpos/
│   ├── frsh-plus/                 # subscription page
│   ├── harvests/                  # public marketplace + [id] detail
│   ├── orders/                    # buyer orders + voice + farmerOrders
│   ├── products/                  # list + [id] + [id]/edit + create
│   ├── profile/
│   │   ├── badges/                # gamification badges
│   │   └── prebookings/           # buyer pre-bookings
│   ├── referral/
│   ├── shop/
│   ├── wallet/
│   ├── globals.css                # design tokens + Tailwind base
│   ├── layout.tsx                 # root layout + providers
│   └── page.tsx                   # homepage
│
└── shared/
    ├── components/
    │   ├── layouts/
    │   │   └── AdminSidebarLayout.tsx  # fixed sidebar + mobile hamburger, active route via usePathname
    │   ├── mainTemplate.tsx
    │   ├── molecules/             # FarmerCard, ProductGridClient, etc.
    │   └── templates/
    │       ├── navbar.tsx         # desktop nav (Harvests+Community in primary pills, role-aware More dropdown)
    │       └── bottomNav.tsx      # mobile nav (Harvests as dedicated tab, role-aware More popover)
    ├── context/
    │   ├── UserContext.tsx        # useUser() → { user, login, logout, loading }
    │   └── CartContext.tsx        # useCart() → { cart, addToCart, removeOne, clearCart, cartCount, subtotal }
    ├── data/                      # static seed/mock data, categoriesList
    ├── hooks/
    │   └── useSpeechToText.tsx    # Web Speech API hook (lang: en-IN)
    ├── interfaces/mongodb/
    │   ├── community/             # CommunityGroup, GroupOrder
    │   ├── delivery/              # DeliveryEarning
    │   ├── gamification/          # BadgeId, BADGE_DEFINITIONS (8 badges)
    │   ├── harvests/              # UpcomingHarvest, HarvestStatus, PreBook, PreBookStatus
    │   ├── orders/                # Order, FarmerOrder, SubOrder
    │   └── wallet/                # Wallet, WalletTransaction, WalletTransactionType
    ├── language/
    │   └── telugu.tsx             # Telugu-language UI string constants
    ├── lib/
    │   ├── db/mongo.tsx           # mongoDB() connection singleton
    │   ├── supabase/client.tsx    # Supabase client singleton
    │   └── utils.tsx              # cx() className combiner
    └── models/mongodb/
        ├── community/             # CommunityGroupModel, GroupOrderModel
        ├── delivery/              # DeliveryEarningModel
        ├── gamification/          # UserBadgeModel
        ├── harvests/              # HarvestModel, PreBookModel
        ├── orders/                # OrderModel, FarmerOrderModel, SubOrderModel
        └── wallet/                # WalletModel, WalletTransactionModel
```

---

## Design Token System

All colors are defined as semantic tokens in `app/globals.css`. **Never use raw Tailwind palette classes** (`bg-green-600`, `text-stone-500`, etc.) — always use a named token.

### Token definitions

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

### Token reference

| Token | Usage |
|---|---|
| `primary` / `primary-foreground` | Main brand green buttons, active states |
| `secondary` / `secondary-subtle` | Lime accent badges, tag chips, icon backgrounds |
| `surface` | Page / section backgrounds |
| `surface-card` | Card / modal backgrounds (white) |
| `foreground-heading` | Headings and titles |
| `foreground-muted` | Labels, captions, placeholders |
| `brand` | Inline icon colour next to text |
| `border` | Card and input borders |
| `status-warning` / `-surface` | Pending, COD alerts |
| `status-info` / `-surface` | Confirmed, informational |
| `status-success` / `-surface` | Delivered, paid, verified |
| `status-danger` / `-surface` | Cancelled, error, rejected |

### Standard class patterns

```ts
// Input / textarea / select
const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm " +
  "text-foreground-heading placeholder:text-foreground-muted " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 transition";

// Card wrapper
"rounded-2xl border border-border bg-surface-card p-5"

// Primary CTA
"rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"

// Status badge (pattern used everywhere)
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-status-warning-surface text-status-warning",
  confirmed: "bg-status-info-surface text-status-info",
  open:      "bg-status-success-surface text-status-success",
  delivered: "bg-status-success-surface text-status-success",
  cancelled: "bg-status-danger-surface text-status-danger",
};

// Sticky save bar (edit pages pattern)
"fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-card/95 px-4 py-4 backdrop-blur-sm"

// cx utility
import { cx } from "@/shared/lib/utils";
cx("base", isActive && "active", hasError && "error")
```

---

## Database Models

All models use `mongoose.models.X || mongoose.model(...)` to avoid re-registration in Next.js dev mode.

**Critical**: Never use `new Schema<TypeName>()` generic when the TypeScript interface has `string` fields that map to `Schema.Types.ObjectId` in the schema — this causes TS2322 errors. Use `new Schema()` without the generic.

### Full model inventory

| Model | File | Key fields |
|---|---|---|
| `UserModel` | `user.tsx` | `type` (role enum), `email` (unique), `passwordHash`, `subscription` ("Free User" / "Premium User") |
| `FarmerModel` | `farmer.tsx` | `profileId` (→ User._id), `name`, `district`, `kycStatus` ("pending"/"verified"/"rejected"), `verified` |
| `BuyerModel` | `buyer.tsx` | `profileId` (→ User._id), `name`, `address` |
| `ProductModel` | `products/products.tsx` | `farmerId`, `name`, `price`, `mrp`, `stockQty`, `status`, `category` |
| `OrderModel` | `orders/buyerOrders.tsx` | `buyerId`, `items[]`, `subtotal`, `total`, `deliveryPersonId`, `deliveryEarning`, `deliveredAt` |
| `FarmerOrderModel` | `orders/farmerOrders.tsx` | `farmerId`, `customerName/Phone/Address`, `items[]`, `source` |
| `SubOrderModel` | `orders/subOrder.tsx` | `orderId`, `farmerId`, `farmerName`, `items[]`, `subtotal`, `status` |
| `DeliveryEarningModel` | `delivery/deliveryEarning.ts` | `deliveryPersonId`, `orderId` (unique), `earning`, `deliveredAt` |
| `HarvestModel` | `harvests/harvest.tsx` | `farmerId`, `farmerName`, `crop`, `expectedQty`, `unit`, `estimatedPrice`, `harvestDate`, `totalPreBooked`, `status` |
| `PreBookModel` | `harvests/preBook.tsx` | `harvestId`, `farmerId`, `buyerId`, `buyerName`, `buyerPhone`, `qty`, `estimatedTotal`, `status` |
| `CommunityGroupModel` | `community/communityGroup.tsx` | `name`, `type`, `location`, `pincode`, `joinCode` (unique), `adminUserId`, `members[]`, `memberCount` |
| `GroupOrderModel` | `community/groupOrder.tsx` | `communityGroupId`, `title`, `items[]`, `deadline`, `status` |
| `WalletModel` | `wallet/wallet.tsx` | `userId` (unique), `balance` (min 0) |
| `WalletTransactionModel` | `wallet/walletTransaction.tsx` | `userId`, `type`, `amount`, `description`, `balanceAfter` |
| `UserBadgeModel` | `gamification/userBadge.tsx` | `userId`, `badgeId` — compound unique index on `(userId, badgeId)` |
| `AdaptModel` | `adapt.tsx` | `buyerId`, `farmerId` |
| `ResetTokenModel` | `resetToken.tsx` | OTP reset tokens |

### Status flows

```
Harvest:  draft → open → fully_booked → harvested | cancelled
PreBook:  pending → confirmed → fulfilled | cancelled
Order:    pending → confirmed → out_for_delivery → delivered | cancelled
SubOrder: pending → confirmed → packed → picked_up → in_transit → out_for_delivery → delivered | cancelled
GroupOrder: open → closed → submitted → delivered | cancelled
```

### User Roles (`user.type`) — always capitalised

```
"Farmer" | "Buyer" | "Logistics Provider" | "FPO" | "Admin" |
"Manager" | "Owner" | "Supplier" | "Distributor" |
"Agent" | "Retailer" | "Wholesaler" | "Banker"
```

---

## User Roles & Workflows

### Farmer
- Registers as `"Farmer"`. Creates a Farmer profile at `/farmers/create`.
- `farmerId` (Farmer document `_id`) ≠ `user.id` (User `_id`). Resolve via:
  - `GET /api/v1/helper/by-profile/[userId]` — returns `{ farmerId }`
  - `GET /api/v1/farmers?profileId=<user.id>` — returns `{ farmerId, farmer }`
- Views buyer orders at `/farmers/orders`; detail at `/farmers/orders/[id]?farmerId=<mongooseId>`.
- Announces harvests at `/farmers/harvests/new`; manages at `/farmers/harvests/[id]`.
- Submits KYC at `/farmers/kyc`.
- Views own analytics at `/farmers/analytics`.

### Buyer
- Registers as `"Buyer"`. Browses at `/shop` or `/products`.
- Adds to cart via `useCart().addToCart({ id, name, price, image, qty, farmerId })`.
- Checks out via `/cart`. Views order history at `/orders/[buyerId]`.
- Pre-books harvests at `/harvests/[id]`. Tracks pre-bookings at `/profile/prebookings`.
- Can join community groups and participate in group orders.

### Delivery Person
- Registers as `"Logistics Provider"`.
- Dashboard at `/delivery` — all deliverable orders (pending / confirmed / out_for_delivery).
- Action flow: **Confirm** → **Pick up** (sets `deliveryPersonId` + `deliveryEarning`) → **Mark Delivered** (creates `DeliveryEarning` record).
- Earnings at `/delivery/earnings`.

### Admin
- `user.type === "Admin"`. Guard: redirect to `/` if `user.type !== "Admin"`.
- Accesses `/admin` (overview), `/admin/analytics` (BI), `/admin/farmers` (KYC review), `/admin/orders`, `/admin/products`, `/admin/users`.
- KYC review: PATCH `kycStatus: "verified"` auto-sets `verified: true`; `"rejected"` sets `verified: false`.

### FPO
- Public profile at `/fpos/[id]` with stats, farmers, products, activity timeline.

---

## Key Feature Flows

### Harvest Pre-booking (atomic)

```
1. Farmer: POST /api/v1/harvests → status: "draft" then "open"
2. Buyer: GET /api/v1/harvests?status=open → sees marketplace at /harvests
3. Buyer: POST /api/v1/harvests/[id]/prebook
   → validates status === "open", remainingQty >= qty
   → findOneAndUpdate({ _id, status: "open" }, { $inc: { totalPreBooked: qty } })
   → auto-sets fully_booked when totalPreBooked >= expectedQty
4. Farmer: GET /api/v1/harvests/[id]/prebookings → manage at /farmers/harvests/[id]
5. Buyer: GET /api/v1/prebookings?buyerId=<id> → view at /profile/prebookings
```

Countdown: `Math.ceil((new Date(harvestDate).getTime() - Date.now()) / 86400000)`

### Delivery Earning (end-to-end)

```
1. Driver: PATCH /api/v1/orders/[id] { status:"delivered", deliveryPersonId, deliveryEarning }
2. Route: updates Order document status + deliveredAt
3. Route: DeliveryEarningModel.findOneAndUpdate({ orderId }, {...}, { upsert: true })
4. /delivery/earnings: GET /api/v1/delivery/earnings?deliveryPersonId=<id>
   → queries DeliveryEarning collection (NOT orders)
   → returns totalEarnings, daily[], orders[]
```

Earning = `deliveryFee > 0 ? deliveryFee : 30`

### Farmer Orders (end-to-end)

```
1. GET /api/v1/helper/by-profile/[user.id] → farmerId (Mongoose _id)
2. GET /api/v1/farmers/dashboard/orders?farmerId=<id>
   → BuyerOrders where items[].farmerId === farmerId
3. Click → /farmers/orders/[orderId]?farmerId=<id>
   → GET /api/v1/farmers/orders/[orderId]?farmerId=<id>
```

**Key**: `farmerId` in URL is Farmer document `_id`, not `user.id`.

### Wallet (atomic debit)

```ts
// Guards against negative balance — returns null if insufficient funds
WalletModel.findOneAndUpdate(
  { userId, balance: { $gte: amount } },
  { $inc: { balance: -amount } },
  { new: true }
)
// If result is null → insufficient funds → return 400
```

### Community Group Order

```
1. POST /api/v1/community → create group, joinCode generated
2. POST /api/v1/community/[id]/join { joinCode } → member added
3. POST /api/v1/community/[id]/orders → create group order
4. POST /api/v1/orders/[id]/split → split fulfilled order into SubOrders per farmerId
```

### KYC Review (Admin)

```
1. Farmer submits at /farmers/kyc → PATCH /api/v1/farmers/kyc
2. Admin views at /admin/farmers → PATCH /api/v1/admin/farmers/[id] { kycStatus: "verified" }
3. Route auto-syncs: kycStatus "verified" → verified: true; "rejected" → verified: false
```

---

## Authentication

- **Registration**: `POST /api/v1/auth/register` — hashes password, stores User document.
- **Login**: `POST /api/v1/auth/login` — issues JWT in `httpOnly` cookie `token` (7-day expiry).
- **Session**: `UserContext` checks `localStorage` first, then `GET /api/v1/auth/me`.
- **Logout**: `POST /api/v1/auth/logout` + `UserContext.logout()`.
- **Password reset**: `send-reset-otp` → `verify-reset-otp` → `reset-password`.
- **Token verification**: `import { verifyToken } from "@/app/api/v1/utils/verifyToken"`.

---

## Navigation Architecture

### Desktop (`shared/components/templates/navbar.tsx`)
- Primary nav pills: Farmers, FPOs, Shop, **Harvests**, **Community** (active state via `pathname`)
- "More" dropdown — role-aware sections with icon + description per item:
  - **Buyers**: My Pre-bookings → `/profile/prebookings`, Referral → `/referral`
  - **Farmers**: My Harvests → `/farmers/harvests`, Analytics → `/analytics/farmer`, Announce Harvest, Add Product
  - **Admins**: Admin Panel → `/admin`, Analytics → `/admin/analytics`

### Mobile (`shared/components/templates/bottomNav.tsx`)
- Bottom bar: Home, Shop, **Harvests** (dedicated tab), More, Cart, Profile
- "More" popover: scrollable, 4-column icon grid, role-aware sections:
  - Discover (all), My Account (buyers), Farmer Tools (farmers), Admin (admins)

---

## API Conventions

### Standard response shape
```ts
{ success: true, message: string, data: T }       // success
{ success: false, message: string, error?: string } // failure
```

### Route file pattern
```ts
import { mongoDB } from "@/shared/lib/db/mongo";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  await mongoDB();  // always first
  // validate → query → return
}
```

---

## Client-Side State

### UserContext
- `useUser()` → `{ user, login, logout, loading }`
- `user`: `{ id, name, email, phoneNumber, type, photo }`
- Persisted in `localStorage` under `"user"`.

### CartContext
- `useCart()` → `{ cart, addToCart, removeOne, clearCart, cartCount, subtotal, ready }`
- `addToCart({ id, name, price, image, qty, farmerId })` — increments qty if already in cart.
- Persisted in `localStorage` under `"fr_cart"`.

---

## Next.js 16 Critical Patterns

### params is a Promise — must unwrap

```ts
// Client component
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);  // React.use() in client components
}

// Server component / page
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// API route handler
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
}
```

### Schema generic causes TS2322

When a TypeScript interface uses `string` for ID fields but the Mongoose schema uses `Schema.Types.ObjectId`, the generic causes TS2322:

```ts
// WRONG
new Schema<MyType>({ farmerId: { type: Schema.Types.ObjectId } })

// CORRECT — remove the generic
new Schema({ farmerId: { type: Schema.Types.ObjectId } })
```

Affected models pattern: any model that has ObjectId fields where the interface declares `string`.

---

## Conventions & Patterns

1. **All shared code in `shared/`** — never put reusable logic inside `app/`.
2. **Every API route calls `await mongoDB()` first** before any DB operation.
3. **Always use `success()` / `failure()` helpers** from `@/app/api/v1/utils/responses`.
4. **Models use singleton pattern**: `mongoose.models.X || mongoose.model(...)`.
5. **`"use client"` at top** for all client components; server components are default.
6. **`user.type` is capitalised** — `"Farmer"` not `"farmer"`, `"Logistics Provider"` not `"logistics provider"`, `"Admin"` not `"admin"`.
7. **farmerId ≠ user.id**: Farmer document `_id` is separate from auth User `_id`. Resolve via `GET /api/v1/farmers?profileId=<user.id>`.
8. **Never use raw palette classes** in app pages. All colors via design tokens. Navbar/bottomNav uses emerald/stone classes (legacy, not design tokens) — do not try to change these.
9. **cx() from `@/shared/lib/utils`** for all conditional classNames.
10. **All icons from lucide-react** — no inline SVGs, no other icon libraries.
11. **Atomic MongoDB for concurrency**: use `findOneAndUpdate` with filter conditions — e.g., harvest prebook uses `{ _id, status: "open" }`, wallet debit uses `{ userId, balance: { $gte: amount } }`.
12. **Sticky save bar pattern** for all edit pages — `fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-card/95 backdrop-blur-sm`.
13. **Loading skeleton with `animate-pulse`** — always show a skeleton while fetching, never a spinner alone.
14. **BuyerOrders and FarmerOrders are separate collections** — never conflate schemas or queries.
15. **SubOrders are children of BuyerOrders** — created by splitting a BuyerOrder per `farmerId` via `POST /api/v1/orders/[id]/split`.

---

## Gamification — Badge IDs

```ts
type BadgeId =
  | "first_order"        // placed first order
  | "five_orders"        // placed 5 orders
  | "loyal_buyer"        // 10+ orders
  | "big_spender"        // ₹10,000+ total spend
  | "early_adopter"      // registered in first cohort
  | "referral_champion"  // referred 3+ users
  | "harvest_explorer"   // pre-booked a harvest
  | "community_member";  // joined a community group
```

Award via `POST /api/v1/badges { userId, badgeId }` — idempotent (compound unique index on userId+badgeId).

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiry (`7d`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key |
| `NEXT_PUBLIC_SUPABASE_SUPABASE_BUCKET` | Avatar bucket name (`avatars`) |
| `OPENAI_API_KEY` | OpenAI for voice/AI features |
| `BREVO_HOST/PORT/USER/PASS` | Brevo SMTP for transactional email |
| `ZOHO_USER/PASS` | Zoho fallback SMTP |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds (`12`) |
| `NEXT_PUBLIC_APP_NAME` | Brand name (`FR3SH`) |

---

## Key Relationships

```
User (auth identity)
 ├─ Farmer      (profileId → User._id)     user.type === "Farmer"
 ├─ Buyer       (profileId → User._id)     user.type === "Buyer"
 ├─ Delivery    (no profile doc)           user.type === "Logistics Provider"
 ├─ FPO                                    user.type === "FPO"
 ├─ Admin                                  user.type === "Admin"
 ├─ Wallet      (userId → User._id, 1:1)
 ├─ UserBadge[] (userId → User._id)
 └─ Adapt[]     (buyerId + farmerId)       Buyer "follows" a Farmer

Farmer
 ├─ Product[]   (farmerId → Farmer._id)
 └─ Harvest[]   (farmerId → Farmer._id)

Buyer
 ├─ BuyerOrder  (buyerId, items[]{productId, farmerId, price, qty})
 └─ PreBook[]   (buyerId → User._id, optional)

BuyerOrder
 ├─ SubOrder[]  (orderId → Order._id, one per farmer)
 └─ DeliveryEarning (orderId unique)

Harvest
 └─ PreBook[]   (harvestId → Harvest._id)

CommunityGroup
 └─ GroupOrder[] (communityGroupId → CommunityGroup._id)
```
