# 🌿 Farmers Republic

Farmers Republic is a multi-role marketplace platform for organic and farm-origin products. It supports farmers and buyers, product discovery, profile creation, and order-oriented workflows in a mobile-friendly Next.js app.

---

## 1) Tech Stack

### Core Framework
- **Next.js 15 (App Router)** for pages, layouts, and API routes.
- **React 19 + TypeScript** for typed component-driven UI.
- **Tailwind CSS 4** for styling.

### Backend & Data
- **MongoDB + Mongoose** for persistent domain data (farmers, buyers, products, orders, users).
- **JWT + bcryptjs** for auth/session primitives.
- **Supabase Storage** for media upload/storage (avatars, product images, etc.).

### UX & Utilities
- **react-hot-toast** for notifications.
- **framer-motion** for UI animations.
- **lucide-react** for iconography.
- **Nodemailer** for email flows (password/reset style flows and future transactional emails).
- **OpenAI SDK** present for AI-oriented extensions.

---

## 2) High-Level Architecture

```text
App Router Pages (app/**/page.tsx)
  ├─ use shared templates/components for UI composition
  ├─ use shared context (UserContext, CartContext) for cross-page state
  ├─ call API routes (/api/v1/*) for CRUD
  └─ API routes read/write MongoDB via models
          └─ optional media upload via Supabase client
```

### Core Building Blocks
- `app/layout.tsx` wraps the whole app shell.
- `shared/components/templates/*` provides reusable layout pieces (navbar, bottom nav, product cards).
- `shared/context/*` provides global state and interactions:
  - `UserContext` for authentication/user state.
  - `CartContext` for cart state.
- `app/api/v1/*` is the backend layer exposed to frontend pages/components.
- `shared/models/mongodb/*` defines Mongoose schemas and data relations.

---

## 3) Pages & Routes (Frontend Map)

### Authentication
- `/login`
- `/forgot-password`
- `/reset-password`

### Home & Shopping
- `/` (landing/home)
- `/shop`
- `/products`
- `/products/create`
- `/products/[id]`
- `/products/[id]/edit`
- `/cart`

### Farmers
- `/farmers`
- `/farmers/create`
- `/farmers/[id]`
- `/farmers/edit/[id]`
- `/farmers/dashboard`
- `/farmers/adapted`
- `/farmers/orders/[id]`

### Buyers
- `/buyers/create`
- `/buyers/profile/[id]`
- `/buyers/edit/[id]`

### FPO & Orders
- `/fpos`
- `/fpos/[id]`
- `/orders/[id]`
- `/orders/details/[id]`
- `/orders/farmerOrders`
- `/orders/voice`

### Account & Policy
- `/profile`
- `/policies/privacy-policy`
- `/policies/refund-policy`
- `/policies/return-policy`
- `/policies/shipping-policy`
- `/policies/terms-and-conditions`

---

## 4) API Surface (`/api/v1`)

> All APIs are implemented as Next.js route handlers.

### `POST /api/v1/auth`
- Clears auth token cookie and logs out current user.

### `POST /api/v1/farmers`
- Creates a farmer profile.
- Accepts comprehensive identity, farm, logistics, media, and compliance fields.

### `GET /api/v1/farmers`
- **List mode**: pagination/filter/search/sort via query params (`page`, `limit`, `q`, `place`, `district`, `state`, `sort`).
- **Single mode**: fetch one farmer by `id` or `profileId`.

### `PATCH /api/v1/farmers`
- Updates farmer by `id` or `profileId`.
- Supports key profile/contact/farm/crop fields.

### `POST /api/v1/buyers`
- Creates a buyer profile.

### `GET /api/v1/buyers`
- Fetch buyer by `id` or `profileId`.

### `PATCH /api/v1/buyers`
- Update buyer by `id` or `profileId`.

### `POST /api/v1/products`
- Creates product with pricing, stock, merchandising, quality, logistics, SEO, and optional `farmerId` linkage.

### `GET /api/v1/products`
- Lists products with pagination/filter/search/sort (`page`, `limit`, `q`, `category`, `farmerId`, `status`, `featured`, `sort`).

---

## 5) Data Relations (How Components and Models Connect)

### Entity Relations (Conceptual)

```text
User/ProfileId
  ├─ 1 : 0..1 Farmer
  ├─ 1 : 0..1 Buyer
  └─ (future/optional) role driven access

Farmer
  └─ 1 : N Product    (Product.farmerId)

Buyer
  └─ 1 : N Orders     (via order models)

Farmer
  └─ 1 : N FarmerOrders (via order models)
```

### UI → API → DB Interaction Pattern
1. A page component (e.g., farmer create/edit page) collects form input.
2. It calls the relevant route in `/api/v1/*`.
3. Route validates/parses request, connects to MongoDB, and uses Mongoose model.
4. Normalized response is returned to UI.
5. UI updates local/global state (`UserContext`, `CartContext`) and reflects result.

This pattern keeps concerns separate:
- **Pages/components** = rendering + user interactions.
- **API routes** = business logic + validation + persistence.
- **Models** = schema/data consistency.

---

## 6) Project Structure (Practical Orientation)

```bash
farmers-republic/
├── app/
│   ├── (auth)/                    # Login/forgot/reset password pages
│   ├── api/v1/                    # Route handlers (auth, farmers, buyers, products)
│   ├── farmers/                   # Farmer listing, create, detail, edit, dashboard
│   ├── buyers/                    # Buyer create/profile/edit pages
│   ├── products/                  # Product listing/create/detail/edit pages
│   ├── orders/                    # Order detail and farmer-order views
│   ├── policies/                  # Static policy/legal pages
│   ├── profile/                   # User profile page
│   ├── layout.tsx                 # Root app layout
│   └── page.tsx                   # Home page
│
├── shared/
│   ├── components/
│   │   ├── templates/             # Navbar, bottomNav, productCard, etc.
│   │   └── molecules/             # Reusable UI units
│   ├── context/                   # UserContext, CartContext
│   ├── hooks/                     # Custom hooks (e.g., speech-to-text)
│   ├── lib/                       # DB and Supabase clients + utilities
│   ├── models/mongodb/            # Mongoose models
│   ├── interfaces/                # Type contracts
│   └── data/                      # Local/mock/static data sets
│
├── public/                        # Static assets
├── package.json
└── README.md
```

---

## 7) Local Setup

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

### Recommended Environment Variables

```env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
BCRYPT_SALT_ROUNDS=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 8) Quick Onboarding Flow for New Developers

1. Start with `app/layout.tsx` to understand global wrappers.
2. Read `shared/context/UserContext.tsx` and `shared/context/CartContext.tsx` for app-wide state.
3. Pick one vertical flow end-to-end:
   - UI page (`app/farmers/create/page.tsx`)
   - API handler (`app/api/v1/farmers/route.tsx`)
   - Model (`shared/models/mongodb/farmer.tsx`)
4. Repeat for products and buyers.

This gives a clear mental model of how different components react and interact with each other across the stack.
