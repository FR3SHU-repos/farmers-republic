# FR3SH — AI Agent Instructions

This document gives any AI agent a complete picture of the project so it can work effectively without reading every file.

---

## What This Project Is

**FR3SH** (codebase name: `farmers-republic`) is a direct-to-consumer agricultural marketplace built for India. It connects farmers to buyers, supports FPOs (Farmer Producer Organizations), enables delivery persons to fulfil orders, and includes voice-based order capture for low-tech farmer users.

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
├── app/                         # Next.js App Router pages + API routes
│   ├── (auth)/                  # Auth pages (login, forgot-password, reset-password)
│   ├── api/v1/
│   │   ├── auth/                # login, logout, register, me, OTP reset
│   │   ├── buyers/              # Buyer CRUD
│   │   ├── delivery/
│   │   │   ├── orders/          # GET deliverable orders (pending/confirmed/out_for_delivery)
│   │   │   └── earnings/        # GET aggregated earnings; POST manual earning record
│   │   ├── farmers/
│   │   │   ├── dashboard/orders/# GET buyer orders filtered by farmerId
│   │   │   └── orders/[id]/     # GET + PATCH single farmer-view order detail
│   │   ├── helper/by-profile/   # Resolve userId → farmerId (Mongoose _id)
│   │   ├── orders/[id]/         # GET + PATCH buyer order; creates DeliveryEarning on deliver
│   │   ├── products/            # Product CRUD
│   │   ├── user/                # Profile update + photo upload
│   │   └── utils/               # responses, verifyToken helpers
│   ├── cart/
│   ├── delivery/
│   │   ├── page.tsx             # Delivery dashboard — filter pills, stat cards, quick buttons
│   │   ├── [id]/page.tsx        # Delivery order detail — tap-to-call, COD banner, actions
│   │   └── earnings/page.tsx    # Earnings — lifetime total, bar chart, delivery history
│   ├── farmers/
│   │   ├── orders/
│   │   │   ├── page.tsx         # Farmer order list (buyer orders for this farmer)
│   │   │   └── [id]/page.tsx    # Order detail + per-item management + earnings summary
│   │   └── dashboard/page.tsx
│   ├── fpos/                    # FPO listing + detail
│   ├── orders/                  # Buyer order history, voice capture, farmerOrders form
│   ├── products/                # Product pages (list, detail, create, edit)
│   ├── profile/                 # User profile (avatar upload, role-based quick links)
│   ├── shop/
│   └── page.tsx                 # Homepage
│
└── shared/
    ├── components/
    │   ├── mainTemplate.tsx     # App shell
    │   ├── molecules/           # FarmerCard, ProductGridClient, etc.
    │   └── templates/           # navbar, bottomNav, productCard, productDetail
    ├── context/
    │   ├── UserContext.tsx      # Global auth state (useUser hook)
    │   └── CartContext.tsx      # Global cart state (useCart hook)
    ├── data/                    # Static seed/mock data
    ├── hooks/
    │   └── useSpeechToText.tsx  # Browser Web Speech API hook (lang: en-IN)
    ├── interfaces/mongodb/
    │   ├── delivery/
    │   │   └── deliveryEarning.ts  # DeliveryEarning TypeScript interface
    │   ├── orders/
    │   │   ├── buyerOrders.tsx     # Order + OrderItem (incl. delivery person fields)
    │   │   └── farmerOrders.tsx
    │   └── ...
    ├── language/
    │   └── telugu.tsx           # Telugu-language UI string constants
    ├── lib/
    │   ├── db/mongo.tsx         # MongoDB connection (mongoDB() function)
    │   ├── supabase/client.tsx  # Supabase client singleton
    │   └── utils.tsx            # cx() className combiner
    └── models/mongodb/
        ├── delivery/
        │   └── deliveryEarning.ts  # DeliveryEarning Mongoose model
        ├── orders/
        │   ├── buyerOrders.tsx     # OrderModel (with delivery fields)
        │   └── farmerOrders.tsx
        └── ...
```

---

## Design Token System

All colors are defined as semantic tokens in `app/globals.css`. **Never use raw Tailwind palette classes** (`bg-green-600`, `text-stone-500`, etc.) — always use a named token.

### How tokens work in Tailwind v4

```css
/* app/globals.css */

:root {
  --background: #f8faf5;
  --foreground: #1c1917;
}

@theme inline {
  /* Maps CSS vars → Tailwind utilities. Does NOT emit custom properties.
     Use for :root / dark-mode vars that already exist. */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

@theme {
  /* Emits both CSS custom properties AND Tailwind utilities.
     Required for opacity modifiers like bg-primary/20 to work via color-mix(). */
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

### Full token reference

| Token | Usage |
|---|---|
| `primary` | Main brand green — buttons, active states, links |
| `primary-hover` | Darker green for hover state |
| `primary-foreground` | Text on primary backgrounds (white) |
| `secondary` | Lime accent — badges, highlights |
| `secondary-subtle` | Pale lime — icon backgrounds, tag chips |
| `secondary-foreground` | Text on secondary |
| `surface` | Off-white green tint — section/page backgrounds |
| `surface-card` | Pure white — cards, modals |
| `foreground-heading` | Near-black — page/card titles |
| `foreground-body` | Warm dark grey — body text |
| `foreground-muted` | Medium grey — labels, captions, placeholders |
| `brand` | Mid green — inline icons next to text |
| `border` | Soft green — card and input borders |
| `border-focus` | Emerald — input focus ring |
| `status-warning` / `status-warning-surface` | Amber — pending, COD alerts |
| `status-info` / `status-info-surface` | Blue — informational / confirmed |
| `status-success` / `status-success-surface` | Green — delivered, paid |
| `status-danger` / `status-danger-surface` | Red — error, cancelled, destructive |

### Standard class patterns

```ts
// Input / textarea / select
const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm " +
  "text-foreground-heading placeholder:text-foreground-muted outline-none transition " +
  "focus:border-primary focus:ring-4 focus:ring-primary/10";

// Label
const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wide text-foreground-muted";

// Primary CTA button
"rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"

// Secondary / outline button
"rounded-full border border-secondary/40 bg-secondary-subtle text-sm font-semibold text-secondary-foreground"

// Card wrapper
"rounded-2xl border border-border bg-surface-card p-5"

// Section header with icon
<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface">
  <Icon className="h-3.5 w-3.5 text-brand" />
</div>
```

### Status badge pattern (used across all pages consistently)
```ts
function statusBadgeClass(s: string) {
  switch (s) {
    case "pending":          return "bg-status-warning-surface text-status-warning border-status-warning/30";
    case "confirmed":        return "bg-status-info-surface text-status-info border-status-info/30";
    case "out_for_delivery": return "bg-secondary-subtle text-secondary-foreground border-secondary/40";
    case "delivered":        return "bg-status-success-surface text-status-success border-status-success/30";
    case "cancelled":        return "bg-status-danger-surface text-status-danger border-status-danger/30";
    default:                 return "bg-surface text-foreground-muted border-border";
  }
}
```

### cx utility

```ts
// shared/lib/utils.tsx
export const cx = (...args: Array<string | false | null | undefined>) =>
  args.filter(Boolean).join(" ");
```

---

## Database Models

All models live in `shared/models/mongodb/`. Each model uses `mongoose.models.X || mongoose.model(...)` to avoid re-registration in Next.js dev mode.

### Model inventory

| Model | File | Collection | Key fields |
|---|---|---|---|
| `UserModel` | `user.tsx` | users | `type` (role enum), `email` (unique), `passwordHash` |
| `FarmerModel` | `farmer.tsx` | farmers | `profileId` (→ User._id), `name`, `district`, `state`, KYC fields |
| `BuyerModel` | `buyer.tsx` | buyers | `profileId` (→ User._id), `name`, `address` |
| `ProductModel` | `products/products.tsx` | products | `farmerId`, `name`, `price`, `mrp`, `stockQty`, `status`, `category` |
| `OrderModel` | `orders/buyerOrders.tsx` | orders | `buyerId`, `items[]`, `subtotal`, `total`, `deliveryPersonId`, `deliveryEarning`, `deliveredAt` |
| `FarmerOrderModel` | `orders/farmerOrders.tsx` | farmerorders | `farmerId`, `customerName/Phone/Address`, `items[]`, `source` |
| `DeliveryEarningModel` | `delivery/deliveryEarning.ts` | deliveryearnings | `deliveryPersonId`, `orderId` (unique), `earning`, `deliveredAt` |
| `AdaptModel` | `adapt.tsx` | adapts | `buyerId`, `farmerId` |
| `ResetTokenModel` | `resetToken.tsx` | resettokens | OTP reset tokens |

### User Roles (`IUser.type`)

Values are **always capitalised**. Never compare against lowercase.

```
"Farmer" | "Buyer" | "Logistics Provider" | "FPO" |
"Manager" | "Admin" | "Owner" | "Supplier" | "Distributor" |
"Agent" | "Retailer" | "Wholesaler" | "Banker"
```

### BuyerOrder — delivery tracking fields

The `OrderModel` (`orders/buyerOrders.tsx`) stores delivery person info directly on the order document:

```ts
deliveryPersonId?:   string   // user._id of the delivery person
deliveryPersonName?: string
deliveryEarning?:    number   // amount earned for this delivery (min ₹30)
deliveredAt?:        Date     // set automatically when status → "delivered"
```

### DeliveryEarning model

A **dedicated collection** (`deliveryearnings`) with one document per delivered order. Enforced by a `unique` index on `orderId`.

```ts
type DeliveryEarning = {
  deliveryPersonId: string;    // index
  deliveryPersonName?: string;
  orderId: string;             // unique — prevents double-recording
  buyerName?: string;
  orderTotal: number;
  deliveryFee: number;
  earning: number;             // deliveryFee > 0 ? deliveryFee : 30
  paymentMode: string;
  paymentStatus: string;
  itemCount: number;
  deliveredAt: Date;
};
```

---

## User Roles & Workflows

### Farmer
- Registers as `"Farmer"` via the login/register page.
- Creates a Farmer profile (`/farmers/create`).
- `farmerId` (Mongoose `_id` of Farmer document) ≠ `user.id` (auth User `_id`). Resolve via `GET /api/v1/helper/by-profile/[userId]`.
- Views buyer orders at `/farmers/orders` (orders where `items.farmerId` matches).
- Navigates to per-order detail at `/farmers/orders/[id]?farmerId=<mongooseId>`.
- Can confirm, mark ready for pickup, mark delivered, set per-item fees, and toggle payment status.
- Voice/phone orders are created at `/orders/farmerOrders`.

### Buyer
- Registers as `"Buyer"`.
- Browses products at `/products` or `/shop`.
- Adds to cart via `useCart().addToCart({ id, name, price, image, qty, farmerId })`.
- Checks out via `/cart`.
- Views order history at `/orders/[buyerId]`.

### Delivery Person
- Registers as `"Logistics Provider"` (displayed as "Delivery Person" in the UI).
- Dashboard at `/delivery` — shows all deliverable orders (status: pending / confirmed / out_for_delivery).
- Order detail at `/delivery/[id]` — tap-to-call buyer, see items, COD alert, action buttons.
- Action flow: **Confirm** → **Pick up** (sets `deliveryPersonId` + `deliveryEarning` on order) → **Mark Delivered** (creates `DeliveryEarning` record).
- Earnings at `/delivery/earnings` — queries the `DeliveryEarning` collection.

### FPO
- Registers as `"FPO"`.
- Public profile at `/fpos/[id]` with stats, farmers, products, activity timeline.

---

## Delivery Earning Flow (end-to-end)

This flow ensures earnings are recorded reliably even if the driver skips the explicit pickup step:

```
1. Driver taps "Mark delivered" (or "Pick up" → "Mark delivered") on /delivery/[id]
   ↓
2. UI sends: PATCH /api/v1/orders/[id]
   { status: "delivered", deliveryPersonId: user.id,
     deliveryPersonName: user.name, deliveryEarning: fee > 0 ? fee : 30 }
   ↓
3. PATCH route:
   a. Updates Order document: status = "delivered", deliveredAt = new Date()
   b. Resolves deliveryPersonId from request body OR from order.deliveryPersonId
   c. DeliveryEarningModel.findOneAndUpdate({ orderId }, { ... }, { upsert: true })
   ↓
4. /delivery/earnings fetches GET /api/v1/delivery/earnings?deliveryPersonId=<id>
   ↓ queries DeliveryEarning collection directly (not orders collection)
5. Returns: totalEarnings, todayEarnings, weekEarnings, monthEarnings,
            totalDeliveries, daily[] (30 days for chart), orders[] (history)
```

Earning amount = `deliveryFee > 0 ? deliveryFee : 30` (minimum ₹30).

---

## Farmer Orders Flow (end-to-end)

```
1. Farmer lands on /farmers/orders
   ↓
2. Page fetches GET /api/v1/helper/by-profile/[user.id]
   → resolves farmerId (Mongoose _id of Farmer document)
   ↓
3. Page fetches GET /api/v1/farmers/dashboard/orders?farmerId=<id>
   → returns BuyerOrders where items[].farmerId === farmerId
   → per-order data includes only this farmer's items and subtotals
   ↓
4. Farmer clicks an order → /farmers/orders/[orderId]?farmerId=<id>
   ↓
5. Detail page fetches GET /api/v1/farmers/orders/[orderId]?farmerId=<id>
6. Farmer can: update order status, per-item fees, payment status
```

**Key**: `farmerId` in the URL query string is the Farmer document `_id`, not the `user.id`.

---

## Authentication

- **Registration**: `POST /api/v1/auth/register` — hashes password, stores User document.
- **Login**: `POST /api/v1/auth/login` — validates, issues JWT in `httpOnly` cookie named `token` (7-day expiry).
- **Session rehydration**: `UserContext` checks `localStorage` first, then `GET /api/v1/auth/me`.
- **Logout**: `POST /api/v1/auth/logout` + `UserContext.logout()`.
- **Password reset**: `send-reset-otp` → `verify-reset-otp` → `reset-password`.
- **Token verification in API routes**: `import { verifyToken } from "@/app/api/v1/utils/verifyToken"`.

---

## API Conventions

### Base path
All routes are under `/api/v1/`.

### Standard response shape
```ts
// Success
{ success: true, message: string, data: T }

// Failure
{ success: false, message: string, error?: string }  // error field only in development
```

### Route file pattern
```ts
import { mongoDB } from "@/shared/lib/db/mongo";
import { success, failure } from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  await mongoDB();  // always first
  // ... validate, query, return success/failure
}
```

---

## Client-Side State

### UserContext (`shared/context/UserContext.tsx`)
- Hook: `useUser()` → `{ user, login, logout, loading }`
- `user` shape: `{ id, name, email, phoneNumber, type, photo }`
- Persisted in `localStorage` under key `"user"`.

### CartContext (`shared/context/CartContext.tsx`)
- Hook: `useCart()` → `{ cart, addToCart, removeOne, clearCart, cartCount, subtotal, ready }`
- Cart is `Record<productId, CartItem>` persisted in `localStorage` under key `"fr_cart"`.
- `CartItem`: `{ id, name, price, image?, qty, farmerId? }`
- `addToCart(item)` — increments qty if item already in cart (ignores `item.qty`).

---

## Profile Page — Role-based Quick Links

`/profile` shows different quick links depending on `user.type`:

| Role | Quick links shown |
|---|---|
| `"Farmer"` | Farmer Dashboard, My Orders (`/farmers/orders`), Edit/Create Farmer Profile |
| `"Buyer"` | My Orders (`/orders/[buyerId]`), Edit/Create Buyer Profile |
| `"Logistics Provider"` | My Deliveries (`/delivery`), My Earnings (`/delivery/earnings`) |

---

## Voice Orders Feature

Farmers can capture orders by speaking. The flow:
1. `useSpeechToText` hook (`shared/hooks/useSpeechToText.tsx`) — browser Web Speech API, language `en-IN`.
2. Voice order creation UI at `app/orders/farmerOrders/page.tsx`.
3. Saved to `FarmerOrderModel` with `source: "voice"`.

---

## File Storage (Supabase)

- **Avatars**: bucket `avatars`, uploaded from `/profile` via `PATCH /api/v1/user/photo`.
- **Product images**: bucket `product-images`, referenced by public URL stored in MongoDB.
- Client singleton: `shared/lib/supabase/client.tsx`.

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
 ├─ Farmer  (profileId → User._id)   ← user.type === "Farmer"
 ├─ Buyer   (profileId → User._id)   ← user.type === "Buyer"
 ├─ Delivery Person                  ← user.type === "Logistics Provider" (no separate profile doc)
 ├─ FPO                              ← user.type === "FPO"
 └─ Adapt   (buyerId + farmerId)     ← Buyer "follows" a Farmer

Farmer
 └─ Product (farmerId → Farmer._id)

Buyer
 └─ BuyerOrder (buyerId, items[]{productId, farmerId, price, qty, ...})

Delivery Person
 └─ DeliveryEarning (deliveryPersonId → user.id, orderId unique)

BuyerOrder
 └─ items[].farmerId → Farmer._id  (used to filter farmer's order dashboard)
```

BuyerOrders and FarmerOrders are **separate collections with different schemas** — do not conflate.

---

## Next.js 16 Breaking Changes

### `params` is a Promise in server pages and route handlers

```ts
// WRONG — params.id is undefined, causes silent 404
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
}

// CORRECT
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// In API route handlers, use Promise.resolve() for compatibility:
type Context = { params: { id: string } | Promise<{ id: string }> };
export async function GET(req: NextRequest, ctx: Context) {
  const { id } = await Promise.resolve(ctx.params);
}
```

### React 19: `FormEvent` is deprecated

Use `React.SyntheticEvent` or native DOM event types. Avoid `React.FormEvent<HTMLFormElement>`.

---

## Conventions & Patterns to Follow

1. **All shared code goes in `shared/`** — never put reusable logic inside `app/`.
2. **Each API route calls `await mongoDB()` first** before any DB operation.
3. **Always use `success()` / `failure()` helpers** for API responses.
4. **Models use the singleton pattern**: `mongoose.models.X || mongoose.model(...)`.
5. **Client components** must have `"use client"` at top; server components are default.
6. **`user.type` is capitalised** — `"Farmer"` not `"farmer"`, `"Logistics Provider"` not `"logistics provider"`.
7. **Farmer ID vs User ID**: `user.id` is the auth User `_id`. A Farmer's Mongoose `_id` is separate — resolve via `GET /api/v1/helper/by-profile/[userId]`. Always pass `farmerId` in URL query strings when navigating to farmer order detail.
8. **Delivery earning is created in the PATCH route** — the UI sends `deliveryPersonId` + `deliveryEarning` on both the pickup step AND the delivery step, so the route always has enough info to upsert the `DeliveryEarning` document.
9. **All colors must use design tokens** — never use raw Tailwind palette classes. Add new tokens to `app/globals.css` under `@theme {}`.
10. **Use `cx()` from `@/shared/lib/utils`** for conditional classNames.
11. **All icons from `lucide-react`** — no inline SVGs, no other icon libraries.
12. **Page layout standard** for detail pages: single column `max-w-2xl`, back link at top, content cards, action buttons at bottom (matches delivery and farmer order detail pages).
13. **BuyerOrders and FarmerOrders are separate collections** — do not conflate schemas or queries.
