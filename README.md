# Farmers Republic (FR3SH)

A direct-to-consumer agricultural marketplace for India. Farmers list produce, buyers discover and order it, FPOs are profiled with live sales data, delivery persons fulfil orders, and low-tech farmers can capture orders by voice.

Brand tagline: *"Pick fresh. Eat fresh."*

---

## 1) Tech Stack

### Core Framework
- **Next.js 16 (App Router, Turbopack)** for pages, layouts, and API routes.
- **React 19 + TypeScript 5** for typed component-driven UI.
- **Tailwind CSS v4** for styling via a semantic design-token system.

### Backend & Data
- **MongoDB + Mongoose 8** for persistent domain data (farmers, buyers, products, orders, delivery earnings, users).
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

The platform supports four distinct user roles. Values are **always capitalised** in the database and in comparisons.

| Role | `user.type` value | Description |
|---|---|---|
| Farmer | `"Farmer"` | Lists products, views buyer orders, manages order status |
| Buyer | `"Buyer"` | Browses products, adds to cart, places orders |
| Delivery Person | `"Logistics Provider"` | Picks up and delivers orders, tracks earnings |
| FPO | `"FPO"` | Farmer Producer Organisation profile |

> Never compare against lowercase values. `user.type === "Farmer"` ✓  `user.type === "farmer"` ✗

---

## 3) Design Token System

All colors are defined as semantic tokens in `app/globals.css` using Tailwind v4's `@theme {}` directive. Raw palette classes like `bg-green-600` or `text-stone-500` are not used anywhere in the codebase.

```css
/* @theme {} emits CSS custom properties AND Tailwind utilities,
   enabling opacity modifiers like bg-primary/20 via color-mix(). */
@theme {
  --color-primary: #065f46;          /* main brand green */
  --color-primary-hover: #022c22;
  --color-primary-foreground: #ffffff;
  --color-secondary: #bef264;        /* lime accent */
  --color-secondary-subtle: #d9f99d;
  --color-secondary-foreground: #022c22;
  --color-surface: #eff6e8;          /* section backgrounds */
  --color-surface-card: #ffffff;     /* card backgrounds */
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

Every status badge, button, input, and card uses one of these tokens. New colors must be added here as named tokens — never hardcode hex values or raw Tailwind palette classes.

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

### Key building blocks

| File | Role |
|---|---|
| `app/layout.tsx` | Root shell — mounts providers (UserProvider, CartProvider, Toaster) |
| `app/globals.css` | Design token definitions + Tailwind base |
| `shared/context/UserContext.tsx` | Global auth state (`useUser` hook) |
| `shared/context/CartContext.tsx` | Global cart state (`useCart` hook) |
| `shared/lib/utils.tsx` | `cx()` className combiner |
| `shared/components/templates/` | Navbar, bottom nav, product card, product detail |
| `shared/models/mongodb/` | Mongoose schemas |
| `shared/interfaces/mongodb/` | TypeScript interfaces matching each schema |

---

## 5) Pages & Routes

### Authentication
| Route | Description |
|---|---|
| `/login` | Login + register (single split-layout page). Role dropdown includes Farmer, Buyer, Delivery Person (Logistics Provider), FPO |
| `/forgot-password` | Send OTP email |
| `/reset-password` | Enter OTP + new password |

### Shopping
| Route | Description |
|---|---|
| `/` | Homepage / landing |
| `/shop` | Buyer-facing product discovery |
| `/products` | Full product grid with filters |
| `/products/create` | Create a new product (tabbed form with image drop-zone, completion checklist) |
| `/products/[id]` | Product detail — gallery, characteristics, add to cart / buy now |
| `/products/[id]/edit` | Edit existing product |
| `/cart` | Cart review + checkout |

### Farmers
| Route | Description |
|---|---|
| `/farmers` | Farmer list |
| `/farmers/create` | Create farmer profile |
| `/farmers/[id]` | Farmer public profile |
| `/farmers/edit/[id]` | Edit farmer profile |
| `/farmers/dashboard` | Farmer dashboard with stats |
| `/farmers/orders` | **Farmer orders list** — buyer orders containing this farmer's products, with stat cards and status filters |
| `/farmers/orders/[id]` | **Farmer order detail** — buyer info, per-item management, earnings summary, quick-action buttons |

### Buyers
| Route | Description |
|---|---|
| `/buyers/create` | Create buyer profile |
| `/buyers/profile/[id]` | Buyer public profile |
| `/buyers/edit/[id]` | Edit buyer profile |

### Delivery Persons
| Route | Description |
|---|---|
| `/delivery` | **Delivery dashboard** — available orders with filter pills, stat cards, quick pickup/deliver buttons |
| `/delivery/[id]` | **Delivery order detail** — buyer contact with tap-to-call, items, COD banner, action buttons |
| `/delivery/earnings` | **Earnings dashboard** — lifetime total, 4 stat tiles, 14-day bar chart, delivery history |

### FPOs & Orders
| Route | Description |
|---|---|
| `/fpos` | FPO listing |
| `/fpos/[id]` | FPO detail — stats, products, farmers, land, activity timeline |
| `/orders/[id]` | Buyer order history |
| `/orders/details/[id]` | Single buyer order detail |
| `/orders/farmerOrders` | Farmer's voice/phone order capture form |
| `/orders/voice` | Voice order capture UI |

### Account
| Route | Description |
|---|---|
| `/profile` | User profile — avatar upload, account details, role-based quick links, logout |
| `/policies/*` | Privacy, refund, return, shipping, T&C |

---

## 6) API Surface (`/api/v1`)

All handlers follow the pattern: `await mongoDB()` → validate → query/mutate → return `{ success, message, data }`.

### Auth
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Create user account |
| `/api/v1/auth/login` | POST | Issue JWT cookie |
| `/api/v1/auth/logout` | POST | Clear JWT cookie |
| `/api/v1/auth/me` | GET | Return current user from cookie |
| `/api/v1/auth/send-reset-otp` | POST | Email OTP for password reset |
| `/api/v1/auth/verify-reset-otp` | POST | Validate OTP |
| `/api/v1/auth/reset-password` | POST | Set new password |

### Core CRUD
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/farmers` | GET, POST, PATCH | Farmer CRUD |
| `/api/v1/buyers` | GET, POST, PATCH | Buyer CRUD |
| `/api/v1/products` | GET, POST | Product list + create |
| `/api/v1/products/[id]` | GET, PATCH, DELETE | Single product |
| `/api/v1/user/update` | PATCH | Update user profile fields |
| `/api/v1/user/photo` | PATCH | Upload avatar to Supabase |

### Orders
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/orders/[id]` | GET, PATCH | Fetch / update a buyer order. PATCH also creates a `DeliveryEarning` record automatically when `status` becomes `"delivered"` |
| `/api/v1/farmers/dashboard/orders` | GET | Buyer orders filtered by `items.farmerId` |
| `/api/v1/farmers/orders/[id]` | GET, PATCH | Single farmer-view order detail + per-item updates |
| `/api/v1/farmers/orders/voice/buyerOrders` | GET, POST | Buyer order list + place order |
| `/api/v1/farmers/orders/voice/farmerOrders` | GET, POST | Farmer-created order list + create |

### Delivery
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/delivery/orders` | GET | Deliverable orders (`pending`, `confirmed`, `out_for_delivery`) with pagination |
| `/api/v1/delivery/earnings` | GET, POST | **GET**: aggregated stats + history from `DeliveryEarning` collection. **POST**: manually create an earning record |

### Helpers
| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/helper/by-profile/[userId]` | GET | Resolve auth `user.id` → `farmerId` (Mongoose `_id`) |

---

## 7) Data Models

All models live in `shared/models/mongodb/`. Each uses `mongoose.models.X || mongoose.model(...)` to avoid re-registration in dev mode.

| Model | File | Key fields |
|---|---|---|
| `UserModel` | `user.tsx` | `type` (role enum), `email` (unique), `passwordHash` |
| `FarmerModel` | `farmer.tsx` | `profileId` (→ User._id), `name`, `district`, KYC fields |
| `BuyerModel` | `buyer.tsx` | `profileId` (→ User._id), `name`, `address` |
| `ProductModel` | `products/products.tsx` | `farmerId`, `name`, `price`, `stockQty`, `category` |
| `OrderModel` | `orders/buyerOrders.tsx` | `buyerId`, `items[]`, `subtotal`, `total`, `paymentStatus`, `deliveryPersonId`, `deliveryEarning`, `deliveredAt` |
| `FarmerOrderModel` | `orders/farmerOrders.tsx` | `farmerId`, `customerName/Phone/Address`, `items[]`, `source` |
| `DeliveryEarningModel` | `delivery/deliveryEarning.ts` | `deliveryPersonId`, `orderId` (unique), `earning`, `deliveredAt` — dedicated earnings collection |
| `AdaptModel` | `adapt.tsx` | `buyerId`, `farmerId` |
| `ResetTokenModel` | `resetToken.tsx` | OTP-based password reset tokens |

### User Role Enum (all values are capitalised)
```
"Farmer" | "Buyer" | "Logistics Provider" | "FPO" |
"Manager" | "Admin" | "Owner" | "Supplier" | "Distributor" |
"Agent" | "Retailer" | "Wholesaler" | "Banker"
```

### BuyerOrder delivery fields
```ts
deliveryPersonId?:   string   // user._id of the delivery person
deliveryPersonName?: string
deliveryEarning?:    number   // what they earn (min ₹30)
deliveredAt?:        Date
```

### DeliveryEarning collection
One document per delivered order (enforced by `unique` index on `orderId`).
```ts
{ deliveryPersonId, orderId, buyerName, orderTotal,
  deliveryFee, earning, paymentMode, paymentStatus,
  itemCount, deliveredAt }
```

---

## 8) Delivery Earning Flow

When a delivery person marks an order as delivered, the following happens atomically:

1. **UI** (`/delivery/[id]` or `/delivery` dashboard) calls `PATCH /api/v1/orders/[id]` with `{ status: "delivered", deliveryPersonId, deliveryPersonName, deliveryEarning }`.
2. **PATCH route** updates the `Order` document status + `deliveredAt`.
3. **PATCH route** `findOneAndUpdate` (upsert) creates/updates a `DeliveryEarning` document — using the IDs from the request body first, then falling back to what was already stored on the order from the pickup step.
4. **Earnings page** (`/delivery/earnings`) calls `GET /api/v1/delivery/earnings?deliveryPersonId=<id>` which queries the dedicated `DeliveryEarning` collection.

Earning amount = `deliveryFee > 0 ? deliveryFee : 30` (minimum ₹30 for free-delivery orders).

---

## 9) Farmer Orders Flow

Farmers see two separate order views:

| Type | Source | URL | API |
|---|---|---|---|
| **Buyer orders** | Orders placed by buyers that include this farmer's products | `/farmers/orders` → `/farmers/orders/[id]` | `GET /api/v1/farmers/dashboard/orders?farmerId=` |
| **Voice/phone orders** | Orders the farmer created themselves | `/orders/farmerOrders` | `GET /api/v1/farmers/orders/voice/farmerOrders` |

The `farmerId` used to filter buyer orders is the **Mongoose `_id`** of the Farmer document — not `user.id`. Resolve it via `GET /api/v1/helper/by-profile/[userId]`.

---

## 10) Key Component Patterns

### Standard input / label
```tsx
const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm " +
  "text-foreground-heading placeholder:text-foreground-muted outline-none transition " +
  "focus:border-primary focus:ring-4 focus:ring-primary/10";

const LABEL_CLASS =
  "block text-xs font-semibold uppercase tracking-wide text-foreground-muted";
```

### Status badge classes
```tsx
// pending → warning, confirmed → info, out_for_delivery → secondary,
// delivered → success, cancelled → danger
"bg-status-warning-surface text-status-warning border-status-warning/30"
```

### Conditional classNames
```tsx
import { cx } from "@/shared/lib/utils";
cx("base-class", isActive && "active-class", hasError && "error-class")
```

### Cart integration (client components)
```tsx
import { useCart } from "@/shared/context/CartContext";
const { addToCart, removeOne, clearCart, cartCount, subtotal } = useCart();

addToCart({ id, name, price, image, qty, farmerId }); // increments qty if already in cart
```

---

## 11) Next.js 16 Gotchas

### Route params are a Promise
```ts
// Server page — params must be awaited
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
}
```

### React 19 — FormEvent deprecated
Use `React.SyntheticEvent` or native DOM event types instead of `React.FormEvent`.

---

## 12) Project Structure

```
farmers-republic/
├── app/
│   ├── (auth)/                    # Login, forgot-password, reset-password
│   ├── api/v1/
│   │   ├── auth/                  # register, login, logout, me, OTP reset
│   │   ├── buyers/                # Buyer CRUD
│   │   ├── delivery/
│   │   │   ├── orders/            # GET deliverable orders
│   │   │   └── earnings/          # GET aggregated earnings, POST manual record
│   │   ├── farmers/
│   │   │   ├── dashboard/orders/  # GET buyer orders filtered by farmerId
│   │   │   └── orders/[id]/       # GET + PATCH single farmer-view order
│   │   ├── helper/by-profile/     # Resolve userId → farmerId
│   │   ├── orders/[id]/           # GET + PATCH buyer order (creates DeliveryEarning on deliver)
│   │   ├── products/              # Product CRUD
│   │   ├── user/                  # Profile update + photo upload
│   │   └── utils/                 # responses, verifyToken helpers
│   ├── cart/
│   ├── delivery/                  # Delivery dashboard, order detail, earnings
│   │   ├── page.tsx               # Dashboard with filter pills + stat cards
│   │   ├── [id]/page.tsx          # Order detail + action buttons
│   │   └── earnings/page.tsx      # Earnings with bar chart + history
│   ├── farmers/
│   │   ├── orders/
│   │   │   ├── page.tsx           # Orders list (buyer orders for this farmer)
│   │   │   └── [id]/page.tsx      # Order detail + per-item management
│   │   └── dashboard/page.tsx
│   ├── fpos/                      # FPO listing + detail
│   ├── orders/                    # Buyer order history, voice orders, farmerOrders
│   ├── products/                  # Product pages
│   ├── profile/                   # User profile (role-based quick links)
│   ├── globals.css                # Design tokens + Tailwind base
│   ├── layout.tsx                 # Root layout + providers
│   └── page.tsx                   # Homepage
│
├── shared/
│   ├── components/
│   │   ├── templates/             # Navbar, bottomNav, productCard, productDetail
│   │   └── molecules/             # FarmerCard, ProductGridClient, etc.
│   ├── context/                   # UserContext, CartContext
│   ├── data/                      # Static/mock data
│   ├── hooks/                     # useSpeechToText
│   ├── interfaces/mongodb/
│   │   ├── delivery/
│   │   │   └── deliveryEarning.ts # DeliveryEarning TypeScript interface
│   │   ├── orders/
│   │   │   ├── buyerOrders.tsx    # Order + OrderItem types (incl. delivery fields)
│   │   │   └── farmerOrders.tsx
│   │   └── ...
│   ├── language/                  # Telugu string constants
│   ├── lib/                       # mongo.tsx, supabase/client.tsx, utils.tsx
│   └── models/mongodb/
│       ├── delivery/
│       │   └── deliveryEarning.ts # DeliveryEarning Mongoose model
│       ├── orders/
│       │   ├── buyerOrders.tsx    # OrderModel (incl. delivery person fields)
│       │   └── farmerOrders.tsx
│       └── ...
│
├── public/                        # Static assets
├── instructions.md                # AI agent reference document
└── README.md                      # This file
```

---

## 13) Local Setup

```bash
npm install
npm run dev     # http://localhost:3000  (Turbopack)
npm run build
npm run start
```

Copy `info.env.txt` → `.env.local` and populate all secrets before running.

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

## 14) Developer Onboarding

1. Read `instructions.md` for the full agent/developer reference.
2. Open `app/globals.css` to understand the color token system before touching any styles.
3. Start with `app/layout.tsx` to understand global providers.
4. Trace one vertical flow end-to-end — recommended:
   - `app/delivery/[id]/page.tsx` → `PATCH /api/v1/orders/[id]` → `DeliveryEarningModel` → `GET /api/v1/delivery/earnings`
5. Before adding any color, check the token table in `instructions.md` — never hardcode hex values or raw Tailwind palette classes.
