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
- **JWT + bcryptjs** for auth/session. Login sets an `httpOnly` cookie (web) **and** returns the raw JWT in the response body (native mobile). `/auth/me` accepts both cookie and `Authorization: Bearer <token>`.
- **Supabase Storage** for media upload/storage (avatars bucket, product-images bucket).

### Redis & Background Jobs
- **Upstash Redis** — managed Redis with TLS. Accessed two ways:
  - **`@upstash/redis`** (HTTP REST) — for rate limiting, OTP storage, and product caching inside Next.js serverless API routes.
  - **`ioredis`** (TCP + TLS) — for BullMQ queue producers and workers.
- **BullMQ** — job queues for email delivery, order lifecycle events, and push notifications. Three queues: `email`, `notifications`, `orders`.
- **`@upstash/ratelimit`** — sliding-window rate limiting on auth, order, and product APIs.

### UX & Utilities
- **react-hot-toast** for notifications.
- **framer-motion** for UI animations.
- **lucide-react** for all iconography (no inline SVGs).
- **Nodemailer** for transactional email (Zoho SMTP primary → Brevo SMTP → Brevo HTTP API fallback).
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
  │    ├─ Rate limiting via @upstash/ratelimit (Redis-backed)
  │    ├─ Product responses cached in Redis (60–120 s TTL)
  │    ├─ OTP storage in Redis (not MongoDB)
  │    └─ Queue producers → BullMQ (email / notification / order jobs)
  │
  ├─ API routes → MongoDB via Mongoose models
  │            → Supabase for media
  │
workers/ (separate long-running Node.js processes)
  ├─ emailWorker.ts       — sends emails via Nodemailer
  ├─ notificationWorker.ts — push/SMS notifications (stubs — wire up FCM/Twilio)
  └─ orderWorker.ts       — order lifecycle side-effects (loyalty, wallet credits)
```

---

## 5) Redis + BullMQ Architecture

### What uses Redis

| Use case | Client | TTL / limit |
|---|---|---|
| Rate limit — login | `@upstash/ratelimit` | 5 req / 1 min / IP |
| Rate limit — register | `@upstash/ratelimit` | 3 req / 1 min / IP |
| Rate limit — OTP | `@upstash/ratelimit` | 3 req / 10 min / IP |
| Rate limit — order APIs | `@upstash/ratelimit` | 20 req / 1 min / user |
| Rate limit — product create | `@upstash/ratelimit` | 10 req / 1 hr / farmer |
| OTP storage | `@upstash/redis` | 10 min TTL |
| OTP attempt counter | `@upstash/redis` | max 5 attempts |
| Product list cache | `@upstash/redis` | 60 s |
| Product detail cache | `@upstash/redis` | 120 s |
| Categories cache | `@upstash/redis` | 1 hr |
| Admin analytics cache | `@upstash/redis` | 5 min (per period key) |
| BullMQ queue backend | `ioredis` | persistent |

### Cache key layout
```
products:list:{queryHash}     # 60 s TTL — invalidated on POST/PATCH/DELETE product
products:detail:{id}          # 120 s TTL — invalidated on PATCH /products/[id]
categories:all                # 1 hr TTL
analytics:admin:{period}      # 5 min TTL — one key per period (7d/30d/90d/all)
reset_otp:{email}             # 10 min TTL (SHA-256 hash, not raw OTP)
reset_otp_attempts:{email}    # 10 min TTL
```

### BullMQ queues

| Queue | Worker file | Job types |
|---|---|---|
| `email` | `workers/emailWorker.ts` | `passwordResetOtp`, `orderConfirmation`, `deliveryConfirmation`, `generic` |
| `notifications` | `workers/notificationWorker.ts` | `notify.farmer`, `notify.buyer`, `notify.delivery` |
| `orders` | `workers/orderWorker.ts` | `order.created`, `order.delivered`, `delivery.earning.created` |

All jobs: 3 attempts, exponential backoff (5 s base), `removeOnComplete: true`, `removeOnFail: false`.

### Queue producers (where jobs are added)

| API route | Event | Jobs added |
|---|---|---|
| `POST /api/v1/auth/send-reset-otp` | OTP requested | `email → passwordResetOtp` |
| `PATCH /api/v1/orders/[id]` (status → `delivered`) | Order delivered | `order.delivered`, `delivery.earning.created`, `email → deliveryConfirmation`, `notify.buyer` |
| `PATCH /api/v1/orders/[id]` (any status change) | Status updated | `notify.buyer` |

> **To add a new queue producer**: import the queue from `shared/queues/`, call `queue.add(name, data)` inside a `safeEnqueue()` wrapper so a queue failure never breaks the API response.

### Worker commands
```bash
npm run worker:email          # email queue
npm run worker:notification   # notification queue
npm run worker:order          # order lifecycle queue
npm run workers               # all three in parallel (uses concurrently)
```

> **Important**: Workers are long-running Node.js processes. They must run on a server or container — they cannot be hosted on serverless-only platforms (Vercel functions, AWS Lambda). Use Railway, Render, or a VPS for worker deployment.

### Safe fallback behaviour
- **Rate limiter down**: requests are allowed through (fail-open), error logged.
- **Cache down**: API falls through to MongoDB, returns fresh data.
- **Queue unavailable on OTP**: email is sent directly via Nodemailer before returning.
- **Queue unavailable on order events**: `safeEnqueue()` catches and logs — API response is never blocked.

---

## 6) Pages & Routes

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
| `/harvests` | Public marketplace — countdown badges, crop search, date filter pills, pre-booking CTA |
| `/harvests/[id]` | Harvest detail — freshness timeline, sticky pre-book form, success state, fully-booked guard |
| `/farmers/harvests` | Farmer dashboard — stats cards, list of all own harvest announcements, status filter tabs |
| `/farmers/harvests/new` | Announce a new harvest — live preview card |
| `/farmers/harvests/[id]` | Farmer manage — inline edit toggle, pre-bookings table with confirm/fulfill/cancel |
| `/profile/prebookings` | Buyer's pre-bookings list — status filter tabs, summary stats |

### Farmers
| Route | Description |
|---|---|
| `/farmers` | Farmer list |
| `/farmers/create` | Create farmer profile |
| `/farmers/[id]` | Farmer public profile |
| `/farmers/edit/[id]` | Edit farmer profile — redesigned with design tokens, 8 section tabs, sticky save bar, avatar upload |
| `/farmers/dashboard` | Farmer dashboard with stats |
| `/farmers/orders` | Farmer orders list — buyer orders containing this farmer's products |
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
| `/admin/analytics` | Business intelligence — 11 aggregations with period filter (7d/30d/90d/all) |
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

## 7) Navigation

### Desktop navbar (`shared/components/templates/navbar.tsx`)
- **Logo** left, **4 primary nav pills** (Farmers, Shop, Harvests, Community), **Browse ▾** mega-menu right.
- **Browse mega-menu** (500 px wide, 3-column grid per section, opens on click):
  - *Explore* (all users): Shop, Farmers, FPOs, Harvests, Community, Adopted Farmers, FR3SH Plus
  - *My Account* (logged in): Profile, Wallet, Pre-bookings, Orders, Referral, Badges
  - *Farmer Tools* (farmers): Dashboard, My Harvests, Announce Harvest, Add Product, My Orders, Analytics, KYC Status
  - *Admin* (admins): Admin Panel, Users, Farmers, Orders, Products, Analytics
- **Right actions**: Search | Cart | Browse ▾ | Profile button (avatar) / Login

### Mobile bottom nav (`shared/components/templates/bottomNav.tsx`)
- **Bottom bar tabs**: Home, Shop, Harvests (dedicated), More, Cart, Profile
- **More popover** (scrollable sheet, 4-column icon grid, role-aware sections):
  - Discover, My Account (buyers), Farmer Tools (farmers), Admin (admins)

---

## 8) API Surface (`/api/v1`)

All handlers: `await mongoDB()` → validate → query/mutate → return `{ success, message, data }`.  
Rate-limited endpoints return `{ success: false, message: "Too many requests…" }` with HTTP 429.

### Auth
| Endpoint | Methods | Rate limit | Description |
|---|---|---|---|
| `/api/v1/auth/register` | POST | 3/min/IP | Create user account. Email normalized to lowercase. |
| `/api/v1/auth/login` | POST | 5/min/IP | Sets `httpOnly` cookie **and** returns `{ token, user }` in body for native mobile clients |
| `/api/v1/auth/logout` | POST | — | Clear JWT cookie |
| `/api/v1/auth/me` | GET | — | Returns current user. Accepts cookie **or** `Authorization: Bearer <token>` header |
| `/api/v1/auth/send-reset-otp` | POST | 3/10min/IP | Store OTP in Redis, queue email |
| `/api/v1/auth/verify-reset-otp` | POST | — | Verify Redis OTP, reset password |

### Core CRUD
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/farmers` | GET, POST, PATCH | Farmer CRUD. GET supports `?profileId=` to resolve userId → farmerId |
| `/api/v1/buyers` | GET, POST, PATCH | Buyer CRUD |
| `/api/v1/products` | GET, POST | GET: cached 60 s. POST: rate-limited 10/hr/farmer, invalidates list cache |
| `/api/v1/products/[id]` | GET, PATCH | GET cached 120 s. PATCH invalidates both detail cache and full list cache |
| `/api/v1/user/update` | PATCH | Update user profile fields |
| `/api/v1/user/photo` | PATCH | Upload avatar to Supabase |

### Orders
| Endpoint | Methods | Rate limit | Description |
|---|---|---|---|
| `/api/v1/orders/[id]` | GET | 20/min/IP | Fetch buyer order |
| `/api/v1/orders/[id]` | PATCH | — | Update status; on `delivered` creates `DeliveryEarning` + queues jobs |
| `/api/v1/orders/[id]/split` | POST | — | Split order into per-farmer SubOrders |
| `/api/v1/farmers/dashboard/orders` | GET | — | Buyer orders filtered by `items.farmerId` |
| `/api/v1/farmers/orders/[id]` | GET, PATCH | — | Single farmer-view order |

### Harvests
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/harvests` | GET, POST | List open harvests + create |
| `/api/v1/harvests/[id]` | GET, PATCH, DELETE | Detail, update, soft-delete |
| `/api/v1/harvests/[id]/prebook` | POST | Atomic pre-book — `$inc totalPreBooked`, auto-marks `fully_booked` |
| `/api/v1/harvests/[id]/prebookings` | GET, PATCH | Farmer view of pre-bookings + status update |
| `/api/v1/prebookings` | GET | Buyer's pre-bookings (`?buyerId=` or `?buyerPhone=`) |

### Community
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/community` | GET, POST | List + create groups |
| `/api/v1/community/[id]` | GET, PATCH, DELETE | Group detail / update / deactivate |
| `/api/v1/community/[id]/join` | POST, DELETE | Join group with joinCode / leave |
| `/api/v1/community/[id]/orders` | GET, POST, PATCH | List group orders + create + add quantity |
| `/api/v1/community/[id]/orders/[orderId]` | GET, PATCH, DELETE | Individual group order get/edit/delete |

### Delivery
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/delivery/orders` | GET | Deliverable orders with pagination |
| `/api/v1/delivery/earnings` | GET, POST | Aggregated stats + history / manual record |

### Admin
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/admin/stats` | GET | Platform overview — totalUsers, GMV, pendingKYC, ordersByStatus |
| `/api/v1/admin/farmers` | GET | Paginated list of all farmers |
| `/api/v1/admin/farmers/[id]` | GET, PATCH | Farmer detail + KYC review (PATCH `kycStatus:"verified"` auto-sets `verified:true`) |
| `/api/v1/admin/orders` | GET | Platform orders list |
| `/api/v1/admin/orders/[id]` | GET, PATCH | Admin: single order detail + status update |
| `/api/v1/admin/products` | GET | All products (admin view) |
| `/api/v1/admin/users` | GET | All users list |
| `/api/v1/admin/users/[id]` | GET, PATCH | User detail + role management |

### Analytics
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/analytics/admin` | GET | 11 parallel aggregations — revenue, GMV, top farmers, top products, by period. Cached 5 min per period in Redis |
| `/api/v1/analytics/farmer` | GET | Per-farmer — revenue, orders, top products |

### Growth
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/wallet` | GET, POST, PATCH | Balance + transactions / top-up / atomic debit |
| `/api/v1/referral` | GET, POST, PATCH | Stats / record / reward (auto-credits ₹100) |
| `/api/v1/badges` | GET, POST | User badges / award (idempotent) |
| `/api/v1/subscription` | GET, POST | Status / subscribe (monthly ₹199 / annual ₹1,499) |
| `/api/v1/farmers/kyc` | POST, PATCH | Submit KYC documents / update status |

### Voice Orders
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/farmers/orders/voice` | GET, POST | Receive transcribed voice text, parse into order intent |
| `/api/v1/farmers/orders/voice/buyerOrders` | GET, POST | Voice-captured order → create BuyerOrder |
| `/api/v1/farmers/orders/voice/farmerOrders` | GET, POST | Voice-captured order → create FarmerOrder |

### Helpers
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/helper/by-profile/[id]` | GET | Resolve auth `user.id` → `farmerId` (route param name is `id`) |
| `/api/v1/products/by-farmer/[id]` | GET | All products for a given farmer — used on farmer public profile |
| `/api/v1/wallet/transactions` | GET | Wallet transaction history for a user (`?userId=`) |

---

## 9) Data Models

All models: `shared/models/mongodb/`. Each uses `mongoose.models.X || mongoose.model(...)`.

| Model | File | Key fields |
|---|---|---|
| `UserModel` | `user.tsx` | `type` (role enum), `email` (unique), `passwordHash`, `subscription` |
| `FarmerModel` | `farmer.tsx` | `profileId` (→ User._id), `name`, `district`, KYC fields, `verified`, `kycStatus` |
| `BuyerModel` | `buyer.tsx` | `profileId` (→ User._id), `name`, `address` |
| `ProductModel` | `products/products.tsx` | `farmerId`, `name`, `price`, `stockQty`, `category` |
| `OrderModel` | `orders/buyerOrders.tsx` | `buyerId`, `items[]`, `subtotal`, `total`, `deliveryPersonId`, `deliveryEarning`, `deliveredAt` |
| `FarmerOrderModel` | `orders/farmerOrders.tsx` | `farmerId`, `customerName/Phone/Address`, `items[]`, `source` |
| `SubOrderModel` | `orders/subOrder.tsx` | `orderId`, `farmerId`, `items[]`, `subtotal`, `status` |
| `DeliveryEarningModel` | `delivery/deliveryEarning.ts` | `deliveryPersonId`, `orderId` (unique), `earning`, `deliveredAt` |
| `HarvestModel` | `harvests/harvest.tsx` | `farmerId`, `crop`, `expectedQty`, `totalPreBooked`, `harvestDate`, `status` |
| `PreBookModel` | `harvests/preBook.tsx` | `harvestId`, `farmerId`, `buyerId`, `buyerPhone`, `qty`, `estimatedTotal`, `status` |
| `CommunityGroupModel` | `community/communityGroup.tsx` | `name`, `type`, `location`, `joinCode` (unique), `adminUserId`, `members[]` |
| `GroupOrderModel` | `community/groupOrder.tsx` | `communityGroupId`, `items[]`, `deadline`, `status` |
| `WalletModel` | `wallet/wallet.tsx` | `userId` (unique), `balance` (min 0) |
| `WalletTransactionModel` | `wallet/walletTransaction.tsx` | `userId`, `type`, `amount`, `description`, `balanceAfter` |
| `UserBadgeModel` | `gamification/userBadge.tsx` | `userId`, `badgeId` — compound unique index |
| `ReferralModel` | `referral/referral.tsx` | `referrerId`, `referredUserId`, `rewardCredited`, `createdAt` |
| `AdaptModel` | `adapt.tsx` | `buyerId`, `farmerId` |

> `ResetTokenModel` (`shared/models/mongodb/resetToken.tsx`) still exists in the codebase but is no longer used for OTP storage — OTP data now lives in Redis with a 10-minute TTL. Do not use it for new features.

### Status flows
```
Harvest:    draft → open → fully_booked → harvested | cancelled
PreBook:    pending → confirmed → fulfilled | cancelled
Order:      pending → confirmed → packed → picked_up → in_transit → out_for_delivery → delivered | cancelled
GroupOrder: open → closed → submitted → delivered | cancelled
```

---

## 10) Key Flows

### Delivery Earning
1. Driver taps **Mark Delivered** → `PATCH /api/v1/orders/[id]` `{ status: "delivered" }`
2. Route updates Order doc + upserts `DeliveryEarning`
3. Queues: `order.delivered`, `delivery.earning.created`, `email.deliveryConfirmation`, `notify.buyer`
4. Workers process jobs asynchronously

Earning = `deliveryFee > 0 ? deliveryFee : 30` (minimum ₹30).

### Harvest Pre-booking
1. Farmer creates harvest → `POST /api/v1/harvests`
2. Buyer finds it at `/harvests` → `POST /api/v1/harvests/[id]/prebook`
3. Atomic: `findOneAndUpdate({ _id, status: "open" }, { $inc: { totalPreBooked: qty } })`
4. Auto-marks `fully_booked` when `totalPreBooked >= expectedQty`

### Password Reset (Redis OTP)
1. `POST /api/v1/auth/send-reset-otp` → generates OTP → stores SHA-256 hash in Redis (10 min TTL) → queues `email.passwordResetOtp`
2. Email worker sends OTP via Nodemailer (Zoho → Brevo SMTP → Brevo API fallback)
3. `POST /api/v1/auth/verify-reset-otp` → verifies hash from Redis → deletes key → resets password

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

### SSR / client hydration mismatch (auth-conditional UI)
```tsx
// WRONG — useUser() reads localStorage (null on server) → mismatch
{currentUser?.id ? <ProfileButton /> : <LoginLink />}

// CORRECT — always render Login during SSR, swap after mount
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

{!mounted || !currentUser?.id ? <LoginLink /> : <ProfileButton />}
```

---

## 13) Project Structure

```
farmers-republic/
├── app/
│   ├── (auth)/                    # login, forgot-password, reset-password
│   ├── admin/                     # Admin panel (sidebar layout)
│   ├── api/v1/
│   │   ├── admin/                 # stats, farmers, orders, products, users
│   │   ├── analytics/             # admin + farmer analytics
│   │   ├── auth/                  # register, login, logout, me, OTP reset
│   │   ├── badges/                # gamification badges
│   │   ├── buyers/                # buyer CRUD
│   │   ├── community/             # groups + join + group orders + [orderId]
│   │   ├── delivery/              # orders + earnings
│   │   ├── farmers/               # CRUD, dashboard/orders, orders/[id], kyc
│   │   ├── harvests/              # CRUD + [id]/prebook + [id]/prebookings
│   │   ├── orders/                # buyer orders [id] + [id]/split
│   │   ├── prebookings/           # buyer pre-bookings list
│   │   ├── products/              # product CRUD (cached GET, rate-limited POST)
│   │   ├── referral/              # referral programme
│   │   ├── subscription/          # FR3SH Plus
│   │   ├── user/                  # profile update + photo
│   │   ├── wallet/                # wallet + transactions
│   │   └── utils/                 # responses, verifyToken
│   ├── cart/
│   ├── community/                 # list + new + [id]
│   ├── delivery/                  # dashboard, [id], earnings
│   ├── farmers/
│   ├── fpos/
│   ├── frsh-plus/
│   ├── harvests/
│   ├── orders/
│   ├── products/
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
│   │   ├── templates/
│   │   │   ├── navbar.tsx         # desktop nav (4 pills + Browse mega-menu)
│   │   │   ├── bottomNav.tsx      # mobile bottom bar + More popover
│   │   │   ├── productCard.tsx    # reusable product card tile
│   │   │   ├── productDetail.tsx  # full product detail view
│   │   │   └── farmerSection.tsx  # farmer highlight section (homepage/shop)
│   │   └── molecules/
│   │       ├── FarmerCard.tsx
│   │       ├── FarmerProfile.tsx
│   │       ├── FarmerProductCard.tsx
│   │       ├── AdaptButton.tsx
│   │       ├── ProductGridClient.tsx
│   │       ├── icons.tsx
│   │       └── productCards/      # tab sub-cards for product create/edit form
│   ├── context/                   # UserContext, CartContext
│   ├── data/                      # static arrays — category, farmers, fpos, product
│   ├── interfaces/mongodb/        # TS interfaces per model domain (incl. referral/)
│   ├── lib/
│   │   ├── db/mongo.tsx           # mongoDB() singleton
│   │   ├── supabase/client.tsx    # Supabase client
│   │   ├── redis.ts               # BullMQ connection (ioredis RedisOptions)
│   │   ├── upstashRedis.ts        # @upstash/redis HTTP client singleton
│   │   ├── rateLimit.ts           # 5 pre-configured limiters + checkRateLimit()
│   │   ├── otp.ts                 # storeOtp() / verifyOtp() → Redis
│   │   ├── cache.ts               # cacheGet/Set/Del, CacheKeys, CacheTTL
│   │   ├── mailer.ts              # sendMail() — Zoho → Brevo SMTP → Brevo API
│   │   └── utils.tsx              # cx() className combiner
│   ├── models/mongodb/            # Mongoose models (incl. referral/ and wallet/)
│   └── queues/
│       ├── emailQueue.ts          # BullMQ email queue
│       ├── notificationQueue.ts   # BullMQ notification queue
│       └── orderQueue.ts          # BullMQ order lifecycle queue
│
├── workers/
│   ├── emailWorker.ts             # npm run worker:email
│   ├── notificationWorker.ts      # npm run worker:notification
│   └── orderWorker.ts             # npm run worker:order
│
├── next.config.ts                 # serverExternalPackages: [ioredis, bullmq]
├── instructions.md
└── README.md
```

---

## 14) Local Setup

```bash
npm install
npm run dev         # http://localhost:3000 (Turbopack)
npm run workers     # start all BullMQ workers in separate terminal
npm run build
npm run start
```

### Required environment variables

```env
# MongoDB
MONGODB_URI=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_SUPABASE_BUCKET=avatars

# OpenAI
OPENAI_API_KEY=

# Email (Nodemailer)
EMAIL_FROM=
ZOHO_HOST=smtp.zoho.com
ZOHO_PORT=587
ZOHO_USER=
ZOHO_PASS=
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=
BREVO_PASS=
BREVO_API_KEY=

# Redis (Upstash) — never prefix with NEXT_PUBLIC_
REDIS_URL=rediss://default:<password>@<host>:6379
UPSTASH_REDIS_REST_URL=https://<host>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# OTP
OTP_EXPIRY_SECONDS=600

# App
NEXT_PUBLIC_APP_NAME=FR3SH
```

> **Security**: `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` must **never** be prefixed with `NEXT_PUBLIC_`. They are server-only variables and must not be exposed to the browser bundle.

---

## 15) Developer Onboarding

1. Read `instructions.md` for the full agent/developer reference.
2. Open `app/globals.css` to understand the color token system before touching any styles.
3. Start with `app/layout.tsx` to understand global providers.
4. Run `npm run workers` in a second terminal to start all BullMQ workers.
5. Trace one vertical flow end-to-end — recommended:
   - Harvest flow: `/farmers/harvests/new` → `POST /api/v1/harvests` → `/harvests` → `POST /api/v1/harvests/[id]/prebook`
   - Delivery flow: `/delivery/[id]` → `PATCH /api/v1/orders/[id]` → `DeliveryEarningModel` + queue jobs → workers
   - OTP flow: `send-reset-otp` → Redis store → email worker → `verify-reset-otp` → Redis verify
6. Before adding any color, check the token table in `instructions.md` — never hardcode hex values or raw Tailwind palette classes.
