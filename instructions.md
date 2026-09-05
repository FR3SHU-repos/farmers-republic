# FR3SH — AI Agent Instructions

This document gives any AI agent a complete picture of the project so it can work effectively without reading every file.

---

## What This Project Is

**FR3SH** (codebase name: `farmers-republic`) is a direct-to-consumer agricultural marketplace built for India. It connects farmers to buyers, supports FPOs, enables delivery persons to fulfil orders, allows community groups to place bulk orders, supports harvest pre-booking, and includes voice-based order capture for low-tech farmer users.

Brand tagline: *"Pick fresh. Eat fresh."*

---

## Unified Go backend migration — read this before trusting any route description below

The rest of this file describes this app's routes as originally built: each one reads/writes
MongoDB directly via Mongoose. That description is now **wrong for a growing subset of
routes**. Since 2026-09-05, a sibling project, `../go-api-backend/` (Go/Gin, its own MongoDB
driver, no Mongoose), is becoming the single authoritative backend for this and the other
FR3SH apps. Where a route has been migrated, its file in this repo is now a **thin,
database-free proxy** (`shared/lib/api/catalogue-proxy.ts` — no Mongoose import, no fallback
data, no second write path) that forwards the request (cookie/Authorization/Idempotency-Key/
If-Match headers) to the Go service and returns its response verbatim.

**Migrated to Go (this file's description of these routes as direct-Mongoose is stale — read
`../go-api-backend/docs/api-migration-map.md` for the current truth instead):** auth
register/login/logout/me, logout-all (new), password reset, users/me profile+photo, admin
user directory, product reads/writes/bulk, categories, canonical SKU/variant identity,
farmers directory/profile/KYC/adapted-follows, buyers, harvests, pre-bookings, voice-order
intake/review (`/api/v1/voice-orders`, replacing the previously-broken voice-order submit
flow), community group directory/membership, badge/referral/wallet **reads**, admin
dashboard/analytics + farmer analytics/order-dashboard **reads**, buyer order history/order
detail/farmer-scoped order view/admin order search **reads**.

**Still exactly as described below (real Mongoose work, unmigrated)**: checkout/order
creation, order status transitions (`PATCH /api/v1/orders/[id]`), per-item farmer updates,
the admin order status override, wallet **writes** (`POST /api/v1/wallet`), referral/badge
*award* paths (which — see the Go migration map — turned out to have zero real callers
anywhere in this codebase already, not something waiting on this migration), `GET
/api/v1/delivery/orders`, and everything WMS/POS-inventory-shaped.

**If you're about to change a route, check whether it's on the migrated list above first.**
Editing a proxy file's Mongoose logic does nothing (there isn't any); the real logic lives in
`go-api-backend/internal/modules/`. Full detail, evidence, and exactly which fields/DTOs
changed: `../go-api-backend/docs/api-migration-map.md` (dated section per slice) and
`../go-api-backend/docs/api-inventory.md` (per-route old→new table). This addendum is a
pointer, not a replacement for those — it will itself go stale if not updated at the next
migration slice, so prefer the source docs when in doubt.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | MongoDB Atlas via Mongoose 8 |
| File Storage | Supabase (avatars bucket, product-images bucket) |
| Auth | JWT + bcryptjs — cookie (`httpOnly`) for web, Bearer token in response body for native mobile |
| Email | Zoho SMTP (primary) → Brevo SMTP → Brevo HTTP API, via Nodemailer |
| Redis (serverless) | `@upstash/redis` — HTTP REST client for rate limiting, OTP, caching |
| Redis (workers) | `ioredis` — TCP client for BullMQ queues and workers |
| Rate limiting | `@upstash/ratelimit` — sliding-window rate limiting on API routes |
| Job queues | BullMQ — email, notification, and order lifecycle queues |
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
│   │   ├── layout.tsx
│   │   ├── page.tsx               # platform overview + stats
│   │   ├── analytics/
│   │   ├── farmers/               # KYC review
│   │   ├── orders/
│   │   ├── products/
│   │   └── users/
│   ├── api/v1/
│   │   ├── admin/                 # stats, farmers (list + [id]), orders (list + [id]), products, users/[id]
│   │   ├── analytics/             # admin + farmer aggregations
│   │   ├── auth/                  # login, logout, register, me, send-reset-otp, verify-reset-otp
│   │   ├── badges/                # gamification badge award + list
│   │   ├── buyers/                # buyer CRUD
│   │   ├── community/             # group CRUD + join + group orders + [orderId]
│   │   ├── delivery/              # orders (deliverable list) + earnings
│   │   ├── farmers/               # CRUD, dashboard/orders, orders/[id], orders/voice/*, kyc, adapted
│   │   ├── harvests/              # CRUD + [id]/prebook + [id]/prebookings
│   │   ├── helper/by-profile/     # resolve userId → farmerId (route param is [id])
│   │   ├── orders/                # buyer orders [id] + [id]/split (SubOrders)
│   │   ├── prebookings/           # buyer pre-bookings list (?buyerId=)
│   │   ├── products/              # product CRUD (GET cached, POST rate-limited) + by-farmer/[id]
│   │   ├── referral/              # referral stats, record, reward
│   │   ├── subscription/          # FR3SH Plus
│   │   ├── user/                  # profile update + photo upload
│   │   ├── wallet/                # balance, debit, credit + /transactions
│   │   └── utils/                 # responses(), verifyToken(), errors()
│   ├── cart/
│   ├── community/                 # group list + new + [id]
│   ├── delivery/                  # dashboard + [id] + earnings
│   ├── farmers/
│   │   ├── analytics/
│   │   ├── edit/[id]/
│   │   ├── harvests/              # farmer harvest dashboard + new + [id]
│   │   ├── kyc/
│   │   └── orders/
│   ├── fpos/
│   ├── frsh-plus/
│   ├── harvests/                  # public marketplace + [id] detail
│   ├── orders/                    # buyer orders + voice + farmerOrders
│   ├── products/                  # list + [id] + [id]/edit + create
│   ├── profile/
│   │   ├── badges/
│   │   └── prebookings/
│   ├── referral/
│   ├── shop/
│   ├── wallet/
│   ├── globals.css                # design tokens + Tailwind base
│   ├── layout.tsx                 # root layout + providers
│   └── page.tsx                   # homepage
│
├── shared/
│   ├── components/
│   │   ├── layouts/
│   │   │   └── AdminSidebarLayout.tsx
│   │   ├── mainTemplate.tsx
│   │   ├── molecules/             # FarmerCard, FarmerProfile, FarmerProductCard, AdaptButton, ProductGridClient, icons
│   │   │   └── productCards/      # tab sub-cards for product create/edit (pricing, qty, health, logistics, category)
│   │   └── templates/
│   │       ├── navbar.tsx         # desktop nav: 4 primary pills + Browse mega-menu
│   │       ├── bottomNav.tsx      # mobile: bottom bar + More popover
│   │       ├── productCard.tsx    # reusable product card tile
│   │       ├── productDetail.tsx  # full product detail view component
│   │       └── farmerSection.tsx  # farmer highlight section (homepage/shop)
│   ├── context/
│   │   ├── UserContext.tsx        # useUser() → { user, login, logout, loading }
│   │   └── CartContext.tsx        # useCart() → { cart, addToCart, ... }
│   ├── data/                      # static seed/mock data — category.tsx, farmers.tsx, fpos.tsx, product.tsx
│   ├── hooks/
│   │   └── useSpeechToText.tsx    # Web Speech API hook (lang: en-IN)
│   ├── interfaces/mongodb/
│   │   ├── community/
│   │   ├── delivery/
│   │   ├── gamification/          # BadgeId, BADGE_DEFINITIONS (8 badges)
│   │   ├── harvests/
│   │   ├── orders/
│   │   ├── referral/
│   │   └── wallet/
│   ├── language/
│   │   └── telugu.tsx
│   ├── lib/
│   │   ├── db/mongo.tsx           # mongoDB() connection singleton
│   │   ├── supabase/client.tsx    # Supabase client singleton
│   │   ├── redis.ts               # newBullConnection() → ioredis RedisOptions for BullMQ
│   │   ├── upstashRedis.ts        # upstash — @upstash/redis HTTP client singleton
│   │   ├── rateLimit.ts           # 5 limiters + checkRateLimit() + getIP()
│   │   ├── otp.ts                 # storeOtp() / verifyOtp() backed by Redis
│   │   ├── cache.ts               # CacheKeys, CacheTTL, cacheGet/Set/Del, invalidateProductListCache()
│   │   ├── mailer.ts              # sendMail() — Zoho → Brevo SMTP → Brevo API
│   │   └── utils.tsx              # cx() className combiner
│   ├── models/mongodb/
│   │   ├── community/
│   │   ├── delivery/
│   │   ├── gamification/
│   │   ├── harvests/
│   │   ├── orders/
│   │   ├── referral/
│   │   └── wallet/
│   └── queues/
│       ├── emailQueue.ts          # BullMQ "email" queue — producers import this
│       ├── notificationQueue.ts   # BullMQ "notifications" queue
│       └── orderQueue.ts          # BullMQ "orders" queue
│
├── workers/
│   ├── emailWorker.ts             # npm run worker:email (concurrency 5)
│   ├── notificationWorker.ts      # npm run worker:notification (concurrency 10)
│   └── orderWorker.ts             # npm run worker:order (concurrency 5)
│
└── next.config.ts                 # serverExternalPackages: ["ioredis", "bullmq"]
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

**Critical**: Community model fields `adminUserId` and `memberSchema.userId` must be `{ type: String }`, not `Schema.Types.ObjectId`. Auth user IDs from `useUser()` are not guaranteed to be valid MongoDB ObjectId format.

### Full model inventory

| Model | File | Key fields |
|---|---|---|
| `UserModel` | `user.tsx` | `type` (role enum), `email` (unique), `passwordHash`, `subscription` |
| `FarmerModel` | `farmer.tsx` | `profileId` (→ User._id), `name`, `district`, `kycStatus`, `verified` |
| `BuyerModel` | `buyer.tsx` | `profileId` (→ User._id), `name`, `address` |
| `ProductModel` | `products/products.tsx` | `farmerId`, `name`, `price`, `mrp`, `stockQty`, `status`, `category` |
| `OrderModel` | `orders/buyerOrders.tsx` | `buyerId`, `items[]`, `subtotal`, `total`, `deliveryPersonId`, `deliveryEarning`, `deliveredAt` |
| `FarmerOrderModel` | `orders/farmerOrders.tsx` | `farmerId`, `customerName/Phone/Address`, `items[]`, `source` |
| `SubOrderModel` | `orders/subOrder.tsx` | `orderId`, `farmerId`, `farmerName`, `items[]`, `subtotal`, `status` |
| `DeliveryEarningModel` | `delivery/deliveryEarning.ts` | `deliveryPersonId`, `orderId` (unique), `earning`, `deliveredAt` |
| `HarvestModel` | `harvests/harvest.tsx` | `farmerId`, `farmerName`, `crop`, `expectedQty`, `totalPreBooked`, `harvestDate`, `status` |
| `PreBookModel` | `harvests/preBook.tsx` | `harvestId`, `farmerId`, `buyerId`, `buyerPhone`, `qty`, `estimatedTotal`, `status` |
| `CommunityGroupModel` | `community/communityGroup.tsx` | `name`, `type`, `location`, `joinCode` (unique), `adminUserId` (String), `members[].userId` (String) |
| `GroupOrderModel` | `community/groupOrder.tsx` | `communityGroupId`, `title`, `items[]`, `deadline`, `status` |
| `WalletModel` | `wallet/wallet.tsx` | `userId` (unique), `balance` (min 0) |
| `WalletTransactionModel` | `wallet/walletTransaction.tsx` | `userId`, `type`, `amount`, `description`, `balanceAfter` |
| `UserBadgeModel` | `gamification/userBadge.tsx` | `userId`, `badgeId` — compound unique index |
| `ReferralModel` | `referral/referral.tsx` | `referrerId`, `referredUserId`, `rewardCredited`, `createdAt` |
| `AdaptModel` | `adapt.tsx` | `buyerId`, `farmerId` |

> `ResetTokenModel` (`shared/models/mongodb/resetToken.tsx`) still exists in the codebase but is **no longer used** — OTP storage moved to Redis (`reset_otp:{email}` key, 10-min TTL, SHA-256 hash). Do not use it for new features.

### Compound indexes

These are declared at the bottom of each model file (after the schema, before `mongoose.model()`). Do not remove them — they are critical for query performance.

| Model | Index | Serves |
|---|---|---|
| `OrderModel` | `{ "items.farmerId": 1, createdAt: -1 }` | Farmer dashboard orders list |
| `OrderModel` | `{ buyerId: 1, createdAt: -1 }` | Buyer order history |
| `OrderModel` | `{ status: 1, createdAt: -1 }` | Admin + delivery status filters |
| `OrderModel` | `{ deliveryPersonId: 1, status: 1 }` | Delivery person queue |
| `ProductModel` | `{ farmerId: 1, status: 1 }` | Farmer's own product list |
| `ProductModel` | `{ category: 1, inStock: 1 }` | Shop browse by category |
| `HarvestModel` | `{ status: 1, harvestDate: 1 }` | Public marketplace (open + future date) |
| `HarvestModel` | `{ farmerId: 1, status: 1 }` | Farmer harvest dashboard |
| `DeliveryEarningModel` | `{ deliveryPersonId: 1, deliveredAt: -1 }` | Earnings history |

> When deploying to a new MongoDB Atlas cluster with existing data, build these indexes manually in Atlas or via `db.collection.createIndex()` before going live. Mongoose creates them automatically on fresh collections.

### Status flows

```
Harvest:    draft → open → fully_booked → harvested | cancelled
PreBook:    pending → confirmed → fulfilled | cancelled
Order:      pending → confirmed → packed → picked_up → in_transit → out_for_delivery → delivered | cancelled
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
  - `GET /api/v1/helper/by-profile/[userId]` → `{ farmerId }`
  - `GET /api/v1/farmers?profileId=<user.id>` → `{ farmerId, farmer }`
- Views buyer orders at `/farmers/orders`; detail at `/farmers/orders/[id]?farmerId=<id>`.
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
- Dashboard at `/delivery` — all deliverable orders.
- Action flow: **Confirm** → **Pick up** → **Mark Delivered** (creates `DeliveryEarning` record + queues jobs).
- Earnings at `/delivery/earnings`.

### Admin
- `user.type === "Admin"`. Guard: redirect to `/` if not Admin.
- Accesses `/admin` (overview), `/admin/analytics`, `/admin/farmers` (KYC review), `/admin/orders`, `/admin/products`, `/admin/users`.
- KYC review: PATCH `kycStatus: "verified"` auto-sets `verified: true`; `"rejected"` sets `verified: false`.

---

## Key Feature Flows

### Harvest Pre-booking (atomic)

```
1. Farmer: POST /api/v1/harvests → status: "open"
2. Buyer: GET /api/v1/harvests?status=open → /harvests marketplace
3. Buyer: POST /api/v1/harvests/[id]/prebook
   → validates status === "open", remainingQty >= qty
   → findOneAndUpdate({ _id, status: "open" }, { $inc: { totalPreBooked: qty } })
   → auto-sets fully_booked when totalPreBooked >= expectedQty
4. Farmer: GET /api/v1/harvests/[id]/prebookings → manage at /farmers/harvests/[id]
5. Buyer: GET /api/v1/prebookings?buyerId=<id> → /profile/prebookings
```

Countdown: `Math.ceil((new Date(harvestDate).getTime() - Date.now()) / 86400000)`

### Delivery Earning + Queue (end-to-end)

```
1. Driver: PATCH /api/v1/orders/[id] { status:"delivered", deliveryPersonId, deliveryEarning }
2. Route: updates Order status + deliveredAt
3. Route: DeliveryEarningModel.findOneAndUpdate({ orderId }, {...}, { upsert: true })
4. Route: safeEnqueue → orderQueue.add("order.delivered", {...})
5. Route: safeEnqueue → orderQueue.add("delivery.earning.created", {...})
6. Route: safeEnqueue → emailQueue.add("deliveryConfirmation", {...})
7. Route: safeEnqueue → notificationQueue.add("notify.buyer", {...})
8. Workers process jobs asynchronously
9. /delivery/earnings → GET /api/v1/delivery/earnings?deliveryPersonId=<id>
   → queries DeliveryEarning collection, returns totalEarnings + history
```

Earning = `deliveryFee > 0 ? deliveryFee : 30` (minimum ₹30)

### Password Reset — Redis OTP

```
1. POST /api/v1/auth/send-reset-otp (rate-limited: 3/10min/IP)
   → generateOTP() → storeOtp(email, otp)  [SHA-256 hash in Redis, 10-min TTL]
   → safeEnqueue(emailQueue.add("passwordResetOtp", {...}))
   → fallback: sendMail() directly if queue unavailable
2. User receives OTP via email (emailWorker sends via Zoho → Brevo → Brevo API)
3. POST /api/v1/auth/verify-reset-otp
   → verifyOtp(email, otp)  [checks hash, expiry, max 5 attempts]
   → deletes both Redis keys on success → resets password
```

### Product Caching

```
GET /api/v1/products?category=X&page=2
  → queryHash(params) → "products:list:{hash}"
  → cacheGet(key)        if hit → return cached JSON (60 s TTL)
  → MongoDB query        if miss → cacheSet(key, result, 60)

GET /api/v1/products/[id]
  → cacheGet("products:detail:{id}")   if hit → return (120 s TTL)
  → MongoDB findById                   if miss → cacheSet(key, result, 120)

POST /api/v1/products
  → invalidateProductListCache()   # deletes all products:list:* keys

PATCH /api/v1/products/[id]
  → cacheDel("products:detail:{id}")   # invalidate this product's detail
  → invalidateProductListCache()       # invalidate all list pages
```

### Admin Analytics Caching

```
GET /api/v1/analytics/admin?period=30d
  → cacheGet("analytics:admin:30d")   if hit → return (300 s TTL)
  → 11 MongoDB aggregations           if miss → cacheSet(key, result, 300)
```

One key per period (`7d`, `30d`, `90d`, `all`). Cache is NOT invalidated on order mutations — 5-minute staleness is acceptable for a dashboard.

### Community Group Order

```
1. POST /api/v1/community → create group, joinCode auto-generated
2. POST /api/v1/community/[id]/join { joinCode } → member added
3. POST /api/v1/community/[id]/orders → create group order
4. PATCH /api/v1/community/[id]/orders/[orderId] → edit (admin only)
5. DELETE /api/v1/community/[id]/orders/[orderId] → delete (admin only)
6. POST /api/v1/orders/[id]/split → split fulfilled BuyerOrder into SubOrders per farmerId
```

### Farmer Orders (end-to-end)

```
1. GET /api/v1/helper/by-profile/[user.id] → farmerId
2. GET /api/v1/farmers/dashboard/orders?farmerId=<id>
   → BuyerOrders where items[].farmerId === farmerId
3. /farmers/orders/[orderId]?farmerId=<id>
   → GET /api/v1/farmers/orders/[orderId]?farmerId=<id>
```

**Key**: `farmerId` in URL is Farmer document `_id`, not `user.id`.

### Wallet (atomic debit)

```ts
WalletModel.findOneAndUpdate(
  { userId, balance: { $gte: amount } },
  { $inc: { balance: -amount } },
  { new: true }
)
// null result → insufficient funds → 400
```

---

## Authentication

- **Registration**: `POST /api/v1/auth/register` (rate-limited: 3/min/IP) — hashes password, stores User document. Email normalized to lowercase before lookup and storage.
- **Login**: `POST /api/v1/auth/login` (rate-limited: 5/min/IP) — issues JWT two ways:
  - Sets `httpOnly` cookie `token` (7-day expiry) — used by the web app.
  - Also returns the raw JWT and user object in the response body (`{ token, user, ...success(...) }`) — used by native mobile clients.
- **Session (web)**: `UserContext` checks `localStorage` first, then `GET /api/v1/auth/me`.
- **Session (mobile/native)**: Store the `token` from the login response body. Send it as `Authorization: Bearer <token>` on subsequent requests.
- **`GET /api/v1/auth/me`**: Accepts auth from two sources — cookie `token` OR `Authorization: Bearer <token>` header. Cookie takes priority; Bearer is the fallback. This makes the endpoint work for both web and native mobile clients.
- **Logout**: `POST /api/v1/auth/logout` + `UserContext.logout()`.
- **Password reset**: OTP stored in Redis (not MongoDB). Flow: `send-reset-otp` → `verify-reset-otp` → `reset-password`.
- **Token verification**: `import { verifyToken } from "@/app/api/v1/utils/verifyToken"`.

### Mobile auth pattern

```ts
// 1. Login — store the token from the response body
const res = await fetch("/api/v1/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
const { token, user } = await res.json();
await AsyncStorage.setItem("token", token); // or SecureStore on Expo

// 2. Authenticated requests — send as Bearer header
const meRes = await fetch("/api/v1/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Redis + BullMQ

### Two Redis clients — never mix them up

| Client | Package | Use case |
|---|---|---|
| `upstash` | `@upstash/redis` (HTTP) | Rate limiting, OTP, caching — inside Next.js API routes (serverless) |
| `newBullConnection()` | `ioredis` (TCP) | BullMQ queue producers + workers — long-lived connections |

Both clients talk to the same Upstash Redis backend.

### Rate limiter table

| Limiter key | Limit | Prefix | Used on |
|---|---|---|---|
| `limiters.login` | 5 / 1 min / IP | `rl:login` | `POST /auth/login` |
| `limiters.register` | 3 / 1 min / IP | `rl:register` | `POST /auth/register` |
| `limiters.otp` | 3 / 10 min / IP | `rl:otp` | `POST /auth/send-reset-otp` |
| `limiters.orderApis` | 20 / 1 min / IP | `rl:order` | `GET /orders/[id]` |
| `limiters.productCreate` | 10 / 1 hr / IP | `rl:product-create` | `POST /products` |

Usage in an API route:
```ts
import { checkRateLimit, limiters, getIP } from "@/shared/lib/rateLimit";

const limited = await checkRateLimit(limiters.login, getIP(req));
if (limited) return limited;  // returns NextResponse 429 or null
```

### Queue job types

```ts
// emailQueue — workers/emailWorker.ts
type EmailJobData =
  | { type: "passwordResetOtp"; to; name; otp; expiryMinutes }
  | { type: "orderConfirmation"; to; name; orderId; total; items[] }
  | { type: "deliveryConfirmation"; to; name; orderId; deliveredAt }
  | { type: "generic"; to; subject; html; text? }

// notificationQueue — workers/notificationWorker.ts
type NotificationJobData =
  | { type: "notify.farmer"; farmerId; orderId; buyerName; total }
  | { type: "notify.buyer";  buyerId; orderId; status }
  | { type: "notify.delivery"; deliveryPersonId; orderId }

// orderQueue — workers/orderWorker.ts
type OrderJobData =
  | { type: "order.created";           orderId; buyerId; farmerId?; total }
  | { type: "order.delivered";         orderId; deliveryPersonId; earning }
  | { type: "delivery.earning.created"; earningId; orderId; deliveryPersonId; amount }
```

### safeEnqueue pattern

Wrap every `queue.add()` call in `safeEnqueue()` so a Redis/queue failure never breaks the API response:

```ts
async function safeEnqueue(fn: () => Promise<unknown>, label: string) {
  try { await fn(); }
  catch (err: any) { console.error(`[Queue] failed to enqueue ${label}:`, err?.message); }
}

await safeEnqueue(
  () => emailQueue.add("orderConfirmation", { type: "orderConfirmation", ... }),
  "email.orderConfirmation",
);
```

### Adding a new queue producer

1. Import the queue from `shared/queues/`.
2. Call `queue.add(name, data)` inside `safeEnqueue()`.
3. Add the job type to the queue's `JobData` union if it's new.
4. Handle the new type in the corresponding worker's `switch` block.

### Worker environment

Workers are **separate long-running Node.js processes**, not Next.js API routes. They:
- Load `.env.local` via `dotenv.config({ path: ".env.local" })` at the top.
- Must run on a server or container (Railway, Render, VPS). Serverless platforms cannot host them.
- Shut down gracefully via SIGINT/SIGTERM handlers.

```bash
npm run worker:email          # single worker
npm run worker:notification
npm run worker:order
npm run workers               # all three in parallel (concurrently)
```

---

## Navigation Architecture

### Desktop (`shared/components/templates/navbar.tsx`)
- **Primary nav pills** (4): Farmers, Shop, Harvests, Community
- **Browse ▾ mega-menu** (500 px wide, opens on click, 3-column icon grid per section):
  - *Explore* (all): Shop, Farmers, FPOs, Harvests, Community, Adopted Farmers, FR3SH Plus
  - *My Account* (logged in): Profile, Wallet, Pre-bookings, Orders, Referral, Badges
  - *Farmer Tools* (farmers): Dashboard, My Harvests, Announce Harvest, Add Product, My Orders, Analytics, KYC Status
  - *Admin* (admins): Admin Panel, Users, Farmers, Orders, Products, Analytics
- All role flags guarded with `mounted && !!currentUser?.id` to prevent SSR/CSR mismatch.

### Mobile (`shared/components/templates/bottomNav.tsx`)
- **Bottom bar tabs**: Home, Shop, Harvests, More, Cart, Profile
- **More popover**: scrollable sheet, 4-column icon grid, role-aware sections
- Profile tab label and avatar use `mounted` guard: `mounted && currentUser?.name ? "Profile" : "Login"`

---

## API Conventions

### Standard response shape
```ts
{ success: true, message: string, data: T }         // success
{ success: false, message: string, error?: string }  // failure
// Rate limited:
{ success: false, message: "Too many requests…" }    // HTTP 429
```

### Additional API utilities

- `app/api/v1/utils/responses.tsx` — `success()` / `failure()` helpers
- `app/api/v1/utils/verifyToken.tsx` — JWT cookie verification
- `app/api/v1/utils/errors.tsx` — shared error handler / error-response factory

### Notable endpoints not in the main flow descriptions

| Endpoint | Description |
|---|---|
| `GET /api/v1/products/by-farmer/[id]` | All products for a given `farmerId` — used on farmer public profile pages |
| `GET /api/v1/wallet/transactions` | Wallet transaction history for a user (`?userId=`) |
| `GET /api/v1/admin/farmers` | Admin: paginated list of all farmers |
| `GET /api/v1/admin/orders/[id]` | Admin: single order detail |
| `GET/POST /api/v1/farmers/orders/voice` | Voice order entry — receive transcribed text, parse into order |
| `GET/POST /api/v1/farmers/orders/voice/buyerOrders` | Voice capture → BuyerOrder creation |
| `GET/POST /api/v1/farmers/orders/voice/farmerOrders` | Voice capture → FarmerOrder creation |

### Route file pattern
```ts
import { mongoDB } from "@/shared/lib/db/mongo";
import { success, failure } from "@/app/api/v1/utils/responses";
import { checkRateLimit, limiters, getIP } from "@/shared/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(limiters.login, getIP(req));
  if (limited) return limited;

  await mongoDB();   // always before any DB operation
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
  const { id } = React.use(params);
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

```ts
// WRONG
new Schema<MyType>({ farmerId: { type: Schema.Types.ObjectId } })

// CORRECT — remove the generic
new Schema({ farmerId: { type: Schema.Types.ObjectId } })
```

### SSR / client hydration mismatch (auth-conditional UI)

```tsx
// WRONG — useUser() returns null on server → mismatch
{currentUser?.id ? <ProfileButton /> : <LoginLink />}

// CORRECT — always render Login during SSR, swap after mount
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

{!mounted || !currentUser?.id ? <LoginLink /> : <ProfileButton />}
```

### serverExternalPackages for native Node modules

`ioredis` and `bullmq` must be excluded from Next.js bundling:
```ts
// next.config.ts
serverExternalPackages: ["ioredis", "bullmq"]
```

---

## Conventions & Patterns

1. **All shared code in `shared/`** — never put reusable logic inside `app/`.
2. **Every API route calls `await mongoDB()` first** before any DB operation.
3. **Always use `success()` / `failure()` helpers** from `@/app/api/v1/utils/responses`.
4. **Models use singleton pattern**: `mongoose.models.X || mongoose.model(...)`.
5. **`"use client"` at top** for all client components; server components are default.
6. **`user.type` is capitalised** — `"Farmer"` not `"farmer"`, `"Logistics Provider"` not `"logistics provider"`.
7. **farmerId ≠ user.id**: Farmer document `_id` is separate from auth User `_id`. Resolve via `GET /api/v1/farmers?profileId=<user.id>`.
8. **Never use raw palette classes** in app pages. All colors via design tokens.
9. **cx() from `@/shared/lib/utils`** for all conditional classNames.
10. **All icons from lucide-react** — no inline SVGs, no other icon libraries.
11. **Atomic MongoDB for concurrency**: use `findOneAndUpdate` with filter conditions.
12. **Sticky save bar pattern** for all edit pages — `fixed bottom-0 left-0 right-0 z-50`.
13. **Loading skeleton with `animate-pulse`** — always show skeleton while fetching.
14. **BuyerOrders and FarmerOrders are separate collections** — never conflate.
15. **SubOrders are children of BuyerOrders** — created by `POST /api/v1/orders/[id]/split`.
16. **Community model user IDs must be `String`** — not `Schema.Types.ObjectId`. Auth user IDs are not guaranteed to be valid ObjectIds.
17. **Fail-open Redis**: all `checkRateLimit()`, cache, and OTP operations catch errors and allow requests through if Redis is down.
18. **safeEnqueue for all queue producers**: wrap every `queue.add()` so queue failures never break the API response.
19. **OTP is in Redis, not MongoDB**: use `storeOtp()` / `verifyOtp()` from `shared/lib/otp.ts`. Do not use `ResetTokenModel`.
20. **Never prefix Redis env vars with `NEXT_PUBLIC_`** — they are server-only. `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` must never reach the browser bundle.

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

Award via `POST /api/v1/badges { userId, badgeId }` — idempotent (compound unique index).

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiry (`7d`) |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds (`12`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key |
| `NEXT_PUBLIC_SUPABASE_SUPABASE_BUCKET` | Avatar bucket name (`avatars`) |
| `OPENAI_API_KEY` | OpenAI for voice/AI features |
| `EMAIL_FROM` | Sender address for all outbound email |
| `ZOHO_HOST` / `ZOHO_PORT` / `ZOHO_USER` / `ZOHO_PASS` | Zoho SMTP (primary) |
| `BREVO_HOST` / `BREVO_PORT` / `BREVO_USER` / `BREVO_PASS` | Brevo SMTP (secondary) |
| `BREVO_API_KEY` | Brevo HTTP API (tertiary fallback) |
| `REDIS_URL` | Upstash Redis TCP URL (`rediss://...`) — **server-only, never NEXT_PUBLIC_** |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL — **server-only, never NEXT_PUBLIC_** |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token — **server-only, never NEXT_PUBLIC_** |
| `OTP_EXPIRY_SECONDS` | OTP TTL in Redis (default `600` = 10 min) |
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
   └─ individual ops via /community/[id]/orders/[orderId]  (GET, PATCH, DELETE)
```
