# Farmers Republic (FR3SH)

A direct-to-consumer agricultural marketplace for India. Farmers list produce, buyers discover and order it, FPOs are profiled with live sales data, and low-tech farmers can capture orders by voice.

Brand tagline: *"Pick fresh. Eat fresh."*

---

## 1) Tech Stack

### Core Framework
- **Next.js 16 (App Router, Turbopack)** for pages, layouts, and API routes.
- **React 19 + TypeScript 5** for typed component-driven UI.
- **Tailwind CSS v4** for styling via a semantic design-token system.

### Backend & Data
- **MongoDB + Mongoose 8** for persistent domain data (farmers, buyers, products, orders, users).
- **JWT + bcryptjs** for auth/session primitives (httpOnly cookie, 7-day expiry).
- **Supabase Storage** for media upload/storage (avatars bucket, product-images bucket).

### UX & Utilities
- **react-hot-toast** for notifications.
- **framer-motion** for UI animations.
- **lucide-react** for all iconography (no inline SVGs).
- **Nodemailer** for transactional email (Brevo SMTP primary, Zoho fallback).
- **OpenAI SDK** for voice order transcription (Whisper) and AI extensions.

---

## 2) Design Token System

All colors are defined as semantic tokens in `app/globals.css` using Tailwind v4's `@theme {}` directive. Raw palette classes like `bg-green-600` or `text-stone-500` are not used anywhere in the codebase.

```css
/* @theme {} emits CSS custom properties AND Tailwind utilities,
   enabling opacity modifiers like bg-primary/20 via color-mix(). */
@theme {
  --color-primary: #065f46;          /* main brand green */
  --color-secondary: #bef264;        /* lime accent */
  --color-surface-card: #ffffff;     /* card backgrounds */
  --color-surface: #eff6e8;          /* section backgrounds */
  --color-foreground-heading: #022c22;
  --color-foreground-body: #44403c;
  --color-foreground-muted: #78716c;
  --color-border: #d1ead9;
  --color-status-success: #15803d;
  --color-status-warning: #b45309;
  --color-status-danger: #b91c1c;
  --color-status-info: #1d4ed8;
  /* ...and their -surface variants */
}
```

Every status badge, button, input, and card uses one of these tokens. New colors should be added here as named tokens rather than inlined.

---

## 3) High-Level Architecture

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

## 4) Pages & Routes

### Authentication
| Route | Description |
|---|---|
| `/login` | Login + register (single split-layout page) |
| `/forgot-password` | Send OTP email |
| `/reset-password` | Enter OTP + new password |

### Shopping
| Route | Description |
|---|---|
| `/` | Homepage / landing |
| `/shop` | Buyer-facing product discovery |
| `/products` | Full product grid with filters |
| `/products/create` | Create a new product (tabbed form) |
| `/products/[id]` | Product detail — gallery, characteristics, add to cart |
| `/products/[id]/edit` | Edit existing product |
| `/cart` | Cart review + checkout |

### Farmers
| Route | Description |
|---|---|
| `/farmers` | Farmer list |
| `/farmers/create` | Create farmer profile |
| `/farmers/[id]` | Farmer public profile |
| `/farmers/edit/[id]` | Edit farmer profile |
| `/farmers/dashboard` | Farmer dashboard |
| `/farmers/adapted` | Farmers a buyer has adapted/followed |
| `/farmers/orders/[id]` | Farmer's order list |

### Buyers
| Route | Description |
|---|---|
| `/buyers/create` | Create buyer profile |
| `/buyers/profile/[id]` | Buyer public profile |
| `/buyers/edit/[id]` | Edit buyer profile |

### FPOs & Orders
| Route | Description |
|---|---|
| `/fpos` | FPO listing |
| `/fpos/[id]` | FPO detail — stats, products, farmers, land, activity timeline |
| `/orders/[id]` | Buyer order history |
| `/orders/details/[id]` | Single order detail |
| `/orders/farmerOrders` | Farmer's voice/app order management |
| `/orders/voice` | Voice order capture UI |

### Account & Policy
| Route | Description |
|---|---|
| `/profile` | User profile |
| `/policies/*` | Privacy, refund, return, shipping, T&C |

---

## 5) API Surface (`/api/v1`)

All handlers follow the pattern: `await mongoDB()` → validate → query/mutate → return `{ success, message, data }`.

| Endpoint | Methods | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Create user account |
| `/api/v1/auth/login` | POST | Issue JWT cookie |
| `/api/v1/auth/logout` | POST | Clear JWT cookie |
| `/api/v1/auth/me` | GET | Return current user from cookie |
| `/api/v1/auth/send-reset-otp` | POST | Email OTP for password reset |
| `/api/v1/auth/verify-reset-otp` | POST | Validate OTP |
| `/api/v1/auth/reset-password` | POST | Set new password |
| `/api/v1/farmers` | GET, POST, PATCH | Farmer CRUD (list/single/create/update) |
| `/api/v1/buyers` | GET, POST, PATCH | Buyer CRUD |
| `/api/v1/products` | GET, POST | Product list + create |
| `/api/v1/products/[id]` | GET, PATCH, DELETE | Single product |
| `/api/v1/farmers/orders/voice/buyerOrders` | GET, POST | Buyer order list + place order |
| `/api/v1/farmers/orders/voice/farmerOrders` | GET, POST | Farmer order list + create |
| `/api/v1/user/photo` | POST | Upload avatar to Supabase |

---

## 6) Data Relations

```
User (auth identity — IUser.type is capitalised: "Farmer" | "Buyer" | "Admin" …)
 ├─ Farmer  (profileId → User._id)
 ├─ Buyer   (profileId → User._id)
 └─ Adapt   (buyerId + farmerId) — buyer "follows" a farmer

Farmer
 └─ Product (farmerId → Farmer._id)

Buyer
 └─ BuyerOrder  (buyerId, items[], subtotal, paymentStatus)

Farmer
 └─ FarmerOrder (farmerId, customerName/Phone/Address, items[], source)
```

BuyerOrders and FarmerOrders are **separate collections with separate schemas** — do not conflate them.

---

## 7) Key Component Patterns

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
// pending → warning, delivered → success, cancelled → danger, confirmed → info
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

addToCart({ id, name, price, image, qty, farmerId }); // increments if already in cart
```

---

## 8) Next.js 16 Gotchas

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

## 9) Project Structure

```
farmers-republic/
├── app/
│   ├── (auth)/                    # Login, forgot-password, reset-password
│   ├── api/v1/                    # All REST API route handlers
│   ├── cart/                      # Cart page
│   ├── farmers/                   # Farmer pages
│   ├── fpos/                      # FPO listing + detail
│   ├── buyers/                    # Buyer pages
│   ├── products/                  # Product pages (list, create, detail, edit)
│   ├── orders/                    # Order detail, farmer orders, voice orders
│   ├── policies/                  # Static legal pages
│   ├── profile/                   # User profile
│   ├── globals.css                # Design tokens + Tailwind base
│   ├── layout.tsx                 # Root layout + providers
│   └── page.tsx                   # Homepage
│
├── shared/
│   ├── components/
│   │   ├── templates/             # Navbar, bottomNav, productCard, productDetail
│   │   └── molecules/             # FarmerCard, ProductGridClient, etc.
│   ├── context/                   # UserContext, CartContext
│   ├── data/                      # Static/mock data (categories, fpos, etc.)
│   ├── hooks/                     # useSpeechToText
│   ├── interfaces/mongodb/        # TypeScript interfaces for all DB documents
│   ├── language/                  # Telugu string constants
│   ├── lib/                       # mongo.tsx, supabase/client.tsx, utils.tsx
│   └── models/mongodb/            # Mongoose models
│
├── public/                        # Static assets
├── instructions.md                # AI agent reference document
└── README.md                      # This file
```

---

## 10) Local Setup

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

## 11) Developer Onboarding

1. Read `instructions.md` for the full agent/developer reference.
2. Open `app/globals.css` to understand the color token system before touching any styles.
3. Start with `app/layout.tsx` to understand global providers.
4. Trace one vertical flow end-to-end:
   - UI page → API route → Mongoose model → response.
   - Recommended: `app/products/create/page.tsx` → `app/api/v1/products/route.ts` → `shared/models/mongodb/products/products.tsx`
5. Before adding any color, check the token table in `instructions.md` — never hardcode hex values or raw Tailwind palette classes.
