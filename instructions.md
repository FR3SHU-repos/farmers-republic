# FR3SH — AI Agent Instructions

This document gives any AI agent a complete picture of the project so it can work effectively without reading every file.

---

## What This Project Is

**FR3SH** (codebase name: `farmers-republic`) is a direct-to-consumer agricultural marketplace built for India. It connects farmers to buyers, supports FPOs (Farmer Producer Organizations), and includes voice-based order capture for low-tech farmer users.

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
│   ├── api/v1/                  # All REST API routes
│   │   ├── auth/                # login, logout, register, me, send-reset-otp, verify-reset-otp
│   │   ├── farmers/             # CRUD + dashboard/orders + voice orders
│   │   ├── buyers/              # Buyer CRUD
│   │   ├── products/            # Product CRUD + by-farmer
│   │   ├── orders/              # Order detail
│   │   ├── user/                # Profile update + photo upload
│   │   ├── helper/              # Utility endpoints (by-profile lookup)
│   │   └── utils/               # Shared API helpers (responses, errors, verifyToken)
│   ├── buyers/                  # Buyer pages (create, edit, profile)
│   ├── cart/                    # Cart page
│   ├── farmers/                 # Farmer pages (list, detail, create, edit, dashboard, orders)
│   ├── fpos/                    # FPO listing + detail
│   ├── orders/                  # Order pages (detail, voice, farmerOrders)
│   ├── products/                # Product pages (list, detail, create, edit)
│   ├── profile/                 # User profile page
│   ├── shop/                    # Buyer-facing product shop
│   ├── policies/                # Legal pages (privacy, refund, return, shipping, T&C)
│   └── page.tsx                 # Homepage
│
└── shared/                      # All reusable code (never import from app/ into app/)
    ├── components/
    │   ├── mainTemplate.tsx     # App shell (wraps every page)
    │   ├── molecules/           # Mid-level components (FarmerCard, ProductGridClient, etc.)
    │   └── templates/           # Layout-level components (navbar, bottomNav, productCard, productDetail)
    ├── context/
    │   ├── UserContext.tsx      # Global auth state (useUser hook)
    │   └── CartContext.tsx      # Global cart state (useCart hook)
    ├── data/                    # Static seed/mock data (category, farmers, fpos, product)
    ├── hooks/
    │   └── useSpeechToText.tsx  # Browser Web Speech API hook (lang: en-IN)
    ├── interfaces/mongodb/      # TypeScript interfaces for all DB documents
    ├── language/
    │   └── telugu.tsx           # Telugu-language UI string constants
    ├── lib/
    │   ├── db/mongo.tsx         # MongoDB connection (mongoDB() function)
    │   ├── supabase/client.tsx  # Supabase client singleton
    │   └── utils.tsx            # cx() className combiner utility
    └── models/mongodb/          # Mongoose schemas (mirrors interfaces/)
```

---

## Design Token System

All colors are defined as semantic tokens in `app/globals.css`. **Never use raw Tailwind palette classes** (`bg-green-600`, `text-stone-500`, etc.) — always use a semantic token.

### How tokens work in Tailwind v4

```css
/* app/globals.css */

:root {
  --background: #f8faf5;
  --foreground: #1c1917;
}

@theme inline {
  /* Maps CSS vars to Tailwind utilities; does NOT emit custom properties */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

@theme {
  /* Emits both CSS custom properties AND Tailwind utilities.
     Required for opacity modifiers like bg-primary/20 to work via color-mix(). */
  --color-primary: #065f46;
  ...
}
```

### Full token reference

| Token | Usage |
|---|---|
| `primary` | Main brand green — buttons, active states, links |
| `primary-hover` | Darker green for button hover |
| `primary-foreground` | Text on primary backgrounds (white) |
| `secondary` | Lime accent — badges, highlights |
| `secondary-subtle` | Pale lime — icon backgrounds, tag chips |
| `secondary-foreground` | Text on secondary |
| `tertiary` | Neutral grey — inactive/disabled |
| `tertiary-foreground` | Text on tertiary |
| `surface` | Off-white green tint — section backgrounds |
| `surface-card` | Pure white — cards, modals |
| `foreground-heading` | Near-black — page/card titles |
| `foreground-body` | Warm dark grey — body text |
| `foreground-muted` | Medium grey — labels, captions, placeholders |
| `brand` | Mid green — inline icons |
| `border` | Soft green border |
| `border-focus` | Emerald — input focus ring border |
| `status-warning` / `status-warning-surface` | Amber — pending states |
| `status-info` / `status-info-surface` | Blue — informational states |
| `status-success` / `status-success-surface` | Green — success/delivered |
| `status-danger` / `status-danger-surface` | Red — error/cancelled/destructive |

### Standard class patterns

```ts
// Input / textarea / select
const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm " +
  "text-foreground-heading placeholder:text-foreground-muted outline-none transition " +
  "focus:border-primary focus:ring-4 focus:ring-primary/10";

// Label
const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wide text-foreground-muted";

// Primary button
"rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"

// Outline / ghost button
"rounded-full border border-primary bg-surface-card text-primary transition hover:bg-surface"

// Card wrapper
"rounded-2xl border border-border bg-surface-card p-5"
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

| Model | Collection | Key fields |
|---|---|---|
| `UserModel` | users | `type` (role), `email` (unique), `passwordHash`, `subscription`, `govId`, `isActive` |
| `FarmerModel` | farmers | `profileId` (→ User._id), `name`, `district`, `state`, KYC fields, bank details, `kycStatus` |
| `BuyerModel` | buyers | `profileId` (→ User._id), `name`, `address` |
| `ProductModel` | products | `farmerId`, `name`, `price`, `mrp`, `stockQty`, `status`, `category`, GST fields |
| `BuyerOrderModel` | (buyer orders) | `buyerId`, `items[]`, `subtotal`, `total`, `paymentStatus`, `paymentMode` |
| `FarmerOrderModel` | (farmer orders) | `farmerId`, `customerName/Phone/Address`, `items[]`, `source` (voice/app/whatsapp) |
| `AdaptModel` | adapts | `buyerId`, `farmerId` — buyer "follows/adapts" a farmer |
| `ResetTokenModel` | resettokens | OTP-based password reset tokens |

### User Roles (IUser.type)
`Farmer | Manager | Admin | Owner | Supplier | Distributor | Agent | Retailer | Wholesaler | Logistics Provider | Banker | Buyer`

> **Important**: `user.type` values are **capitalised** (`"Farmer"`, `"Buyer"`, `"Admin"`). Never compare against lowercase strings like `"farmer"`.

### Order Sources (IOrder.source)
`app | voice | phone-call | whatsapp | other`

---

## Authentication

- **Registration**: `POST /api/v1/auth/register` — hashes password with bcryptjs, stores in MongoDB.
- **Login**: `POST /api/v1/auth/login` — validates credentials, issues JWT stored in an `httpOnly` cookie named `token` (7-day expiry).
- **Session rehydration**: On mount, `UserContext` checks `localStorage` first, then falls back to `GET /api/v1/auth/me` (reads the cookie).
- **Logout**: `POST /api/v1/auth/logout` — clears cookie server-side; `UserContext.logout()` clears `localStorage`.
- **Password reset flow**: `send-reset-otp` → `verify-reset-otp` → `reset-password` (OTP emailed via Brevo/Zoho).
- **Token verification in API routes**: import `verifyToken` from `@/app/api/v1/utils/verifyToken`.

---

## API Conventions

### Base path
All routes are under `/api/v1/`.

### Standard response shape
Every route returns JSON using helpers from `shared/app/api/v1/utils/responses.tsx`:

```ts
// Success
{ success: true, message: string, data: T }

// Failure
{ success: false, message: string, error?: string }  // error only in development
```

### Route file pattern
Each route file calls `await mongoDB()` at the start of every handler to ensure the connection is open.

---

## Client-Side State

### UserContext (`shared/context/UserContext.tsx`)
- Hook: `useUser()` → `{ user, login, logout, loading }`
- `user` shape: `{ id, name, email, phoneNumber, type, photo }`
- Persisted in `localStorage` under key `"user"`.
- Available globally via `UserProvider` in `app/layout.tsx`.

### CartContext (`shared/context/CartContext.tsx`)
- Hook: `useCart()` → `{ cart, addToCart, removeOne, clearCart, cartCount, subtotal, ready }`
- Cart is `Record<productId, CartItem>` persisted in `localStorage` under key `"fr_cart"`.
- `CartItem`: `{ id, name, price, image?, qty, farmerId? }`
- `addToCart(item)` — if the item already exists in cart, increments qty by 1 (ignores `item.qty`).

---

## Voice Orders Feature

Farmers can capture orders by speaking. The flow uses:
1. `useSpeechToText` hook (`shared/hooks/useSpeechToText.tsx`) — browser Web Speech API, language `en-IN`.
2. `GET /api/v1/farmers/orders/voice` — lists voice-sourced orders.
3. `GET /api/v1/farmers/orders/voice/buyerOrders` and `farmerOrders` — separated views.
4. UI at `app/orders/voice/page.tsx`.

---

## File Storage (Supabase)

- **Avatars**: bucket `avatars`, uploaded via `POST /api/v1/user/photo`.
- **Product images**: bucket `product-images`, referenced directly.
- Public URL stored on the document; storage path stored as `photoPath`/`farmImages`/etc.
- Client: `shared/lib/supabase/client.tsx` → `supabase` singleton.

---

## Environment Variables

See `info.env.txt` for the full template. Required vars:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (db: `farmers_republic`) |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiry (default `7d`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_SUPABASE_BUCKET` | Avatar bucket name (`avatars`) |
| `OPENAI_API_KEY` | OpenAI for voice/AI features |
| `BREVO_HOST/PORT/USER/PASS` | Brevo SMTP for transactional email |
| `ZOHO_USER/PASS` | Zoho fallback SMTP |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds (default 12) |
| `NEXT_PUBLIC_APP_NAME` | Brand name (`FR3SH`) |

---

## Key Relationships

```
User (auth identity)
 ├─ Farmer (profileId → User._id)   ← one User can be one Farmer
 ├─ Buyer  (profileId → User._id)   ← one User can be one Buyer
 └─ Adapt  (buyerId + farmerId)     ← Buyer "subscribes" to a Farmer

Farmer
 └─ Product (farmerId → Farmer._id)

Buyer / Farmer
 └─ BuyerOrder / FarmerOrder (separate collections, different schemas)
```

---

## Localization

- Primary language: English.
- Telugu string constants are in `shared/language/telugu.tsx` (name, phone, email, password, user_type).
- Target audience: Indian farmers and buyers (addresses use village/mandal/district/state/pincode).

---

## Running Locally

```bash
npm run dev       # starts Next.js with Turbopack on http://localhost:3000
npm run build     # production build
npm run start     # start production server
```

Copy `info.env.txt` → `.env.local` and fill in real secrets before running.

---

## Next.js 16 Breaking Changes to Know

### `params` is a Promise in route handlers and server pages
In Next.js 15+, dynamic route `params` passed to `page.tsx` are a `Promise`. Always `await` them:

```ts
// WRONG (causes silent 404 — id is undefined)
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
}

// CORRECT
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### React 19: `FormEvent` is deprecated
`React.FormEvent` and related synthetic event types are deprecated in `@types/react` 19.x. Use:
- `React.SyntheticEvent` for form submit handlers
- Structural typing `(e?: { preventDefault?: () => void })` for optional-event patterns
- Native DOM event types (`Event`, `MouseEvent`) for DOM event handlers

---

## Conventions & Patterns to Follow

1. **All shared code goes in `shared/`** — never put reusable logic inside `app/`.
2. **Each API route imports `mongoDB()` and calls it first** before any DB operation.
3. **Always use `success()` / `failure()` helpers** for API responses — never hand-roll JSON shapes.
4. **Models use the singleton pattern** (`mongoose.models.X || mongoose.model(...)`) to survive Next.js hot reload.
5. **Client components** must have `"use client"` at the top; server components are the default.
6. **Auth-protected routes** call `verifyToken` from `@/app/api/v1/utils/verifyToken` to decode the `token` cookie.
7. **Product images and avatars** are stored in Supabase; only the public URL is saved to MongoDB.
8. **Farmer orders and buyer orders are separate collections** with different schemas — do not conflate them.
9. **All colors must use design tokens** — never use raw Tailwind palette classes (`bg-green-600`, `text-stone-500`). Add new tokens to `app/globals.css` under `@theme {}` if a semantic slot is missing.
10. **Use `cx()` from `@/shared/lib/utils`** for conditional className composition — never string-template class names.
11. **`user.type` is capitalised** — always compare as `user.type === "Farmer"`, never `"farmer"`.
12. **Lucide React for all icons** — do not use inline SVGs or other icon libraries.
