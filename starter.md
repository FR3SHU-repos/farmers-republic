# Next.js Project Starter — Architecture & Conventions

This document is a reusable blueprint for bootstrapping a Next.js project with the exact structure, patterns, and conventions used in FR3SH (farmers-republic). Give this file to any AI agent to recreate a project with the same structure from scratch.

---

## 1. Initialisation

```bash
npx create-next-app@latest <project-name> \
  --typescript \
  --tailwind \
  --app \
  --turbopack \
  --no-src-dir \
  --import-alias "@/*"
```

Core dependencies to install immediately after:

```bash
npm install mongoose bcryptjs jsonwebtoken react-hot-toast framer-motion lucide-react
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

Optional (Redis + background jobs):
```bash
npm install ioredis bullmq @upstash/redis @upstash/ratelimit concurrently tsx dotenv
```

Optional (Supabase storage):
```bash
npm install @supabase/supabase-js
```

Optional (AI / voice):
```bash
npm install openai
```

---

## 2. Project Root Structure

```
<project-name>/
├── app/
│   ├── (auth)/                  # auth pages in a route group (no layout wrapping)
│   ├── admin/                   # admin panel with its own layout
│   ├── api/
│   │   └── v1/                  # ALL API routes live under /api/v1/
│   │       ├── auth/            # login, logout, register, me, send-reset-otp, verify-reset-otp
│   │       ├── utils/           # responses.tsx, verifyToken.tsx
│   │       └── <domain>/        # one folder per domain (products, orders, users, etc.)
│   ├── globals.css              # design tokens + Tailwind base
│   ├── layout.tsx               # root layout — providers wrap everything here
│   └── page.tsx                 # homepage
│
├── shared/
│   ├── components/
│   │   ├── layouts/             # page-level layout wrappers (e.g. AdminSidebarLayout)
│   │   ├── molecules/           # reusable composite components (cards, grids)
│   │   ├── templates/           # app-wide chrome: navbar.tsx, bottomNav.tsx
│   │   └── mainTemplate.tsx     # shell that wraps page content
│   ├── context/                 # React contexts: UserContext, CartContext, etc.
│   ├── data/                    # static arrays, seed data, constants
│   ├── hooks/                   # custom React hooks
│   ├── interfaces/
│   │   └── mongodb/             # TypeScript interfaces mirroring each model
│   ├── lib/
│   │   ├── db/
│   │   │   └── mongo.tsx        # mongoDB() singleton
│   │   ├── supabase/
│   │   │   └── client.tsx       # Supabase client singleton
│   │   ├── redis.ts             # ioredis RedisOptions for BullMQ (if using)
│   │   ├── upstashRedis.ts      # @upstash/redis HTTP singleton (if using)
│   │   ├── rateLimit.ts         # pre-configured Ratelimit instances + helpers
│   │   ├── otp.ts               # storeOtp() / verifyOtp() (if using)
│   │   ├── cache.ts             # CacheKeys, CacheTTL helpers (if using)
│   │   ├── mailer.ts            # sendMail() abstraction (if using)
│   │   └── utils.tsx            # cx() className combiner
│   ├── models/
│   │   └── mongodb/             # Mongoose model files, one per domain
│   └── queues/                  # BullMQ queue producers (if using)
│       ├── emailQueue.ts
│       ├── notificationQueue.ts
│       └── orderQueue.ts
│
├── workers/                     # Long-running BullMQ worker processes (if using)
│   ├── emailWorker.ts
│   ├── notificationWorker.ts
│   └── orderWorker.ts
│
├── next.config.ts
├── tsconfig.json
├── .env.local
└── package.json
```

> **Rule**: All reusable, non-route code lives in `shared/`. Nothing reusable goes inside `app/`.

---

## 3. Tailwind CSS Setup (v4)

Tailwind v4 uses `@import "tailwindcss"` instead of the old `@tailwind` directives. All custom tokens are defined in `@theme {}` blocks inside `globals.css`.

### `app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #f8faf5;
  --foreground: #1c1917;
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}

@theme {
  /* Primary — dark brand color: CTAs, links, active states */
  --color-primary: #065f46;
  --color-primary-hover: #022c22;
  --color-primary-foreground: #ffffff;

  /* Secondary — accent color: badges, chips, highlights */
  --color-secondary: #bef264;
  --color-secondary-subtle: #d9f99d;
  --color-secondary-foreground: #022c22;

  /* Tertiary — neutral: subtle UI elements */
  --color-tertiary: #d6d3d1;
  --color-tertiary-foreground: #78716c;

  /* Surfaces */
  --color-surface: #eff6e8;
  --color-surface-card: #ffffff;

  /* Text scale */
  --color-foreground-heading: #022c22;
  --color-foreground-body: #44403c;
  --color-foreground-muted: #78716c;
  --color-brand: #047857;

  /* Borders */
  --color-border: #d1ead9;
  --color-border-focus: #6ee7b7;

  /* Status tokens */
  --color-status-warning: #b45309;
  --color-status-warning-surface: #fffbeb;
  --color-status-info: #1d4ed8;
  --color-status-info-surface: #eff6ff;
  --color-status-success: #15803d;
  --color-status-success-surface: #f0fdf4;
  --color-status-danger: #b91c1c;
  --color-status-danger-surface: #fef2f2;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
  text-rendering: geometricPrecision;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }

button, a, input, select {
  -webkit-tap-highlight-color: transparent;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }

.safe-area-bottom {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
```

### Design token usage rules

- **Never** use raw Tailwind palette classes (`bg-green-600`, `text-stone-500`, etc.) in app pages.
- **Always** use a named semantic token (`bg-primary`, `text-foreground-muted`, `border-border`, etc.).
- New colors → add to `@theme {}` in `globals.css` as a named token. Never hardcode hex values in components.
- Raw palette classes are only acceptable in legacy code that you are explicitly told not to touch.

### Standard class patterns (copy-paste ready)

```ts
// Input / textarea / select
const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm " +
  "text-foreground-heading placeholder:text-foreground-muted " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 transition";

// Card wrapper
const cardCls = "rounded-2xl border border-border bg-surface-card p-5";

// Primary CTA button
const primaryBtnCls =
  "rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground " +
  "hover:opacity-90 transition disabled:opacity-50";

// Status badge
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-status-warning-surface text-status-warning",
  confirmed: "bg-status-info-surface text-status-info",
  open:      "bg-status-success-surface text-status-success",
  delivered: "bg-status-success-surface text-status-success",
  cancelled: "bg-status-danger-surface text-status-danger",
  rejected:  "bg-status-danger-surface text-status-danger",
  verified:  "bg-status-success-surface text-status-success",
};

// Sticky save bar (edit pages)
const saveBtnBarCls =
  "fixed bottom-0 left-0 right-0 z-50 border-t border-border " +
  "bg-surface-card/95 px-4 py-4 backdrop-blur-sm";
```

---

## 4. `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude native Node.js packages from Next.js bundling
  // Add any package that uses native addons or long-lived TCP connections
  serverExternalPackages: ["ioredis", "bullmq"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "<your-supabase-project>.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
```

---

## 5. TypeScript — `tsconfig.json` path alias

Ensure `@/*` resolves to the project root so both `app/` and `shared/` imports use `@/`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Usage:
```ts
import { mongoDB }  from "@/shared/lib/db/mongo";
import UserModel    from "@/shared/models/mongodb/user";
import { useUser }  from "@/shared/context/UserContext";
import { cx }       from "@/shared/lib/utils";
```

---

## 6. Shared Utilities

### `shared/lib/utils.tsx`

```ts
export const cx = (...args: Array<string | false | null | undefined>) =>
  args.filter(Boolean).join(" ");
```

Use `cx()` everywhere for conditional classNames. No third-party library needed.

---

## 7. Database Connection — MongoDB Singleton

### `shared/lib/db/mongo.tsx`

```ts
import mongoose from "mongoose";

type MongoCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoCache: MongoCache | undefined;
}

const cache = globalThis._mongoCache ?? { conn: null, promise: null };
globalThis._mongoCache = cache;

mongoose.set("bufferCommands", false);

export const mongoDB = async () => {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI?.trim().replace(/^["']|["']$/g, "");
    if (!uri) throw new Error("MONGODB_URI is not set.");

    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        bufferCommands: false,
      })
      .then((m) => { cache.conn = m; return m; })
      .catch((err) => { cache.promise = null; cache.conn = null; throw err; });
  }

  return cache.promise;
};
```

**Rule**: Every API route calls `await mongoDB()` as the first line before any DB operation.

---

## 8. Interfaces — TypeScript Type Definitions

Interfaces live at `shared/interfaces/mongodb/<domain>/<model>.tsx`. They are TypeScript-only — no Mongoose, no runtime logic.

### Pattern

```ts
// shared/interfaces/mongodb/products/product.tsx

export type ProductStatus = "active" | "inactive" | "out_of_stock" | "archived";

export interface IProduct {
  _id?: string;

  // Required fields
  farmerId: string;
  name: string;
  price: number;

  // Optional fields
  mrp?: number;
  description?: string;
  category?: string;
  stockQty?: number;
  unit?: string;
  image?: string;
  images?: string[];
  status?: ProductStatus;
  inStock?: boolean;

  // Timestamps (Mongoose adds these)
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Rules

- Use `_id?: string` (optional, string) — not `ObjectId`.
- ID reference fields (e.g. `farmerId`, `buyerId`) are always `string`, never `Schema.Types.ObjectId` in the interface.
- Use TypeScript union types for enum-like fields.
- Every field that Mongoose adds automatically (`createdAt`, `updatedAt`) is `optional`.
- Group fields with comments: required, optional, sub-documents, timestamps.

---

## 9. Models — Mongoose Schema Definitions

Models live at `shared/models/mongodb/<domain>/<model>.tsx`. Each model file imports its matching interface.

### Pattern

```ts
// shared/models/mongodb/products/products.tsx

import mongoose, { Schema } from "mongoose";
import type { IProduct } from "@/shared/interfaces/mongodb/products/product";

const productSchema = new Schema(   // <-- NO generic here (see gotcha below)
  {
    farmerId:    { type: String, required: true, index: true },
    name:        { type: String, required: true, trim: true },
    price:       { type: Number, required: true },
    mrp:         { type: Number },
    description: { type: String },
    category:    { type: String, index: true },
    stockQty:    { type: Number, default: 0 },
    unit:        { type: String, default: "kg" },
    image:       { type: String },
    images:      { type: [String], default: [] },
    status: {
      type:    String,
      enum:    ["active", "inactive", "out_of_stock", "archived"],
      default: "active",
      index:   true,
    },
    inStock: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// Compound indexes for common query patterns
productSchema.index({ farmerId: 1, status: 1 });
productSchema.index({ category: 1, inStock: 1 });

// Singleton pattern — prevents model re-registration in Next.js dev mode
const ProductModel =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default ProductModel;
```

### Sub-schemas for nested documents

```ts
// Sub-schema for an array of items
const itemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    qty:       { type: Number, required: true },
  },
  { _id: false },  // <-- always add _id: false for sub-schemas unless you need per-item IDs
);

const orderSchema = new Schema({
  buyerId: { type: String, required: true, index: true },
  items:   { type: [itemSchema], required: true },
  total:   { type: Number, required: true },
  status:  { type: String, default: "pending", index: true },
}, { timestamps: true });
```

### Critical gotcha — Schema generic causes TS2322

```ts
// WRONG — causes TS2322 when interface fields are `string` but schema uses ObjectId
const schema = new Schema<IMyType>({ farmerId: { type: Schema.Types.ObjectId } });

// CORRECT — remove the generic entirely
const schema = new Schema({ farmerId: { type: String, required: true } });
```

Never use `Schema.Types.ObjectId` for any field that stores a user ID from auth context or any ID passed from client side. Use `String` for all such reference fields.

### Singleton export (always)

```ts
const MyModel = mongoose.models.MyModel || mongoose.model("MyModel", mySchema);
export default MyModel;
```

---

## 10. API Routes — `/api/v1/` Pattern

All API routes live under `app/api/v1/`. The version prefix (`v1`) is part of the folder structure, enabling future `v2` routes.

### File naming

```
app/api/v1/<domain>/route.tsx           # collection: GET list, POST create
app/api/v1/<domain>/[id]/route.tsx      # resource:   GET one, PATCH, DELETE
```

### `app/api/v1/utils/responses.tsx`

```ts
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailureResponse<E = string> {
  success: false;
  message: string;
  error?: E;
}

export function success<T>(data: T, message = "Success"): ApiSuccessResponse<T> {
  return { success: true, message, data };
}

export function failure<E = string>(
  message = "Something went wrong",
  error?: E,
): ApiFailureResponse<E> {
  return {
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error : undefined,
  };
}
```

### `app/api/v1/utils/verifyToken.tsx`

```ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function verifyToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
```

### Route handler pattern (collection)

```ts
// app/api/v1/products/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB }            from "@/shared/lib/db/mongo";
import ProductModel           from "@/shared/models/mongodb/products/products";
import { success, failure }   from "@/app/api/v1/utils/responses";

export async function GET(req: NextRequest) {
  try {
    await mongoDB();  // always first

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page     = Number(searchParams.get("page") || "1");
    const limit    = Number(searchParams.get("limit") || "20");

    const filter: Record<string, unknown> = { status: "active" };
    if (category) filter.category = category;

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    return NextResponse.json(
      success({ items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }),
    );
  } catch (err: any) {
    console.error("products GET:", err);
    return NextResponse.json(failure(err?.message || "Failed to fetch"), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();
    const { farmerId, name, price } = body;

    if (!farmerId || !name || !price) {
      return NextResponse.json(failure("farmerId, name and price are required"), { status: 400 });
    }

    const product = await ProductModel.create(body);
    return NextResponse.json(success(product, "Product created"), { status: 201 });
  } catch (err: any) {
    console.error("products POST:", err);
    return NextResponse.json(failure(err?.message || "Failed to create"), { status: 500 });
  }
}
```

### Route handler pattern (resource with dynamic segment)

```ts
// app/api/v1/products/[id]/route.tsx

import { NextRequest, NextResponse } from "next/server";
import mongoose                        from "mongoose";
import { mongoDB }                     from "@/shared/lib/db/mongo";
import ProductModel                    from "@/shared/models/mongodb/products/products";
import { success, failure }            from "@/app/api/v1/utils/responses";

// Next.js 16: params is a Promise
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(failure("Invalid ID"), { status: 400 });
  }

  try {
    await mongoDB();
    const doc = await ProductModel.findById(id).lean();
    if (!doc) return NextResponse.json(failure("Not found"), { status: 404 });
    return NextResponse.json(success(doc));
  } catch (err: any) {
    return NextResponse.json(failure(err?.message), { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(failure("Invalid ID"), { status: 400 });
  }

  try {
    await mongoDB();
    const body = await req.json();
    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) return NextResponse.json(failure("Not found"), { status: 404 });
    return NextResponse.json(success(updated, "Updated"));
  } catch (err: any) {
    return NextResponse.json(failure(err?.message), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(failure("Invalid ID"), { status: 400 });
  }

  try {
    await mongoDB();
    const deleted = await ProductModel.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json(failure("Not found"), { status: 404 });
    return NextResponse.json(success(null, "Deleted"));
  } catch (err: any) {
    return NextResponse.json(failure(err?.message), { status: 500 });
  }
}
```

### Standard response shape (always use this)

```ts
// Success
{ success: true, message: "...", data: <payload> }

// Failure
{ success: false, message: "...", error?: "..." }   // error only in development

// Rate limited
{ success: false, message: "Too many requests. Please try again later." }  // HTTP 429
```

---

## 11. Authentication

### Login route — JWT in httpOnly cookie

```ts
// app/api/v1/auth/login/route.tsx

import { NextRequest, NextResponse } from "next/server";
import bcrypt      from "bcryptjs";
import jwt         from "jsonwebtoken";
import { mongoDB } from "@/shared/lib/db/mongo";
import UserModel   from "@/shared/models/mongodb/user";
import { success, failure } from "../utils/responses";

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(failure("Email and password are required"), { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) return NextResponse.json(failure("User not found"), { status: 404 });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return NextResponse.json(failure("Invalid password"), { status: 401 });

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, type: user.type },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any },
    );

    const res = NextResponse.json(
      success({ id: user._id, name: user.name, email: user.email, type: user.type }, "Welcome back!"),
    );

    res.cookies.set({
      name:     "token",
      value:    token,
      httpOnly: true,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
      maxAge:   60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(failure(err?.message), { status: 500 });
  }
}
```

### Register route

```ts
// app/api/v1/auth/register/route.tsx

import bcrypt from "bcryptjs";
// ... same imports

export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const { name, email, password, type } = await req.json();

    if (!email || !password) {
      return NextResponse.json(failure("Email and password are required"), { status: 400 });
    }

    const exists = await UserModel.findOne({ email });
    if (exists) return NextResponse.json(failure("Email already registered"), { status: 409 });

    const passwordHash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS || 12),
    );

    const user = await UserModel.create({ name, email, passwordHash, type: type || "Buyer" });

    return NextResponse.json(
      success({ id: user._id, name: user.name, email: user.email, type: user.type }, "Account created"),
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(failure(err?.message), { status: 500 });
  }
}
```

### Me route (rehydrate session from cookie)

```ts
// app/api/v1/auth/me/route.tsx

export async function GET(req: NextRequest) {
  const result = await verifyToken(req);
  if (result instanceof NextResponse) return result; // 401

  const payload = result as any;
  try {
    await mongoDB();
    const user = await UserModel.findById(payload.sub).select("-passwordHash").lean();
    if (!user) return NextResponse.json(failure("User not found"), { status: 404 });
    return NextResponse.json(success({ ...user, id: user._id }));
  } catch (err: any) {
    return NextResponse.json(failure(err?.message), { status: 500 });
  }
}
```

### Logout route

```ts
// app/api/v1/auth/logout/route.tsx

export async function POST() {
  const res = NextResponse.json(success(null, "Logged out"));
  res.cookies.set({ name: "token", value: "", httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
```

---

## 12. User Context

### `shared/context/UserContext.tsx`

```ts
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface ILoggedinUser {
  id: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  type?: string;
  photo?: string;
}

interface IUserContext {
  user: ILoggedinUser | null;
  login: (u: ILoggedinUser) => void;
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<IUserContext>({
  user: null, login: () => {}, logout: () => {}, loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ILoggedinUser | null>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
      }
    } catch { localStorage.removeItem("user"); }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = (u: ILoggedinUser) => {
    setUser(u);
    try { localStorage.setItem("user", JSON.stringify(u)); } catch {}
  };

  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem("user");
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    async function rehydrate() {
      if (user) return;
      setLoading(true);
      try {
        const res = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.success && payload.data && mounted) {
          const s = payload.data;
          login({ id: s.id ?? String(s._id), name: s.name, email: s.email, phoneNumber: s.phoneNumber, type: s.type, photo: s.photo });
        }
      } catch {}
      finally { if (mounted) setLoading(false); }
    }
    rehydrate();
    return () => { mounted = false; };
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
```

---

## 13. Root Layout

### `app/layout.tsx`

```ts
import type { Metadata } from "next";
import "./globals.css";
import { UserProvider }  from "@/shared/context/UserContext";
import { CartProvider }  from "@/shared/context/CartContext";
import Shell             from "@/shared/components/mainTemplate";
import { Toaster }       from "react-hot-toast";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: "Your app tagline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <UserProvider>
          <CartProvider>
            <Shell>{children}</Shell>
          </CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#fff", color: "#333", border: "1px solid #e0e0e0", fontSize: "14px" },
              success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
            }}
          />
        </UserProvider>
      </body>
    </html>
  );
}
```

---

## 14. Redis & Rate Limiting (Optional)

Use when you need rate limiting, OTP storage, or caching without a full server.

### Two clients — never mix them

| Client | Package | Use for |
|---|---|---|
| `upstash` | `@upstash/redis` (HTTP) | API routes (serverless): rate limiting, OTP, caching |
| `newBullConnection()` | `ioredis` (TCP) | BullMQ workers: long-lived connection |

### `shared/lib/upstashRedis.ts`

```ts
import { Redis } from "@upstash/redis";

const g = globalThis as typeof globalThis & { _upstash?: Redis };

export const upstash: Redis =
  g._upstash ??
  new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

if (process.env.NODE_ENV !== "production") g._upstash = upstash;
```

### `shared/lib/redis.ts` (for BullMQ workers)

```ts
import type { RedisOptions } from "ioredis";

function parseRedisUrl(): RedisOptions {
  const raw = process.env.REDIS_URL!;
  const normalized = raw.startsWith("rediss://")
    ? raw.replace("rediss://", "https://")
    : raw.replace("redis://",  "https://");
  const parsed = new URL(normalized);
  return {
    host:                  parsed.hostname,
    port:                  Number(parsed.port) || 6379,
    username:              parsed.username || "default",
    password:              decodeURIComponent(parsed.password),
    tls:                   {},
    maxRetriesPerRequest:  null,
    enableReadyCheck:      false,
    connectTimeout:        10_000,
  };
}

export function newBullConnection(): RedisOptions {
  return parseRedisUrl();
}
```

### `shared/lib/rateLimit.ts`

```ts
import { Ratelimit }               from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import { upstash }                 from "./upstashRedis";

export const limiters = {
  login:         new Ratelimit({ redis: upstash, limiter: Ratelimit.slidingWindow(5,  "1 m"),  analytics: false, prefix: "rl:login" }),
  register:      new Ratelimit({ redis: upstash, limiter: Ratelimit.slidingWindow(3,  "1 m"),  analytics: false, prefix: "rl:register" }),
  otp:           new Ratelimit({ redis: upstash, limiter: Ratelimit.slidingWindow(3,  "10 m"), analytics: false, prefix: "rl:otp" }),
  orderApis:     new Ratelimit({ redis: upstash, limiter: Ratelimit.slidingWindow(20, "1 m"),  analytics: false, prefix: "rl:order" }),
  productCreate: new Ratelimit({ redis: upstash, limiter: Ratelimit.slidingWindow(10, "1 h"),  analytics: false, prefix: "rl:product-create" }),
};

export function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<NextResponse | null> {
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset":     String(reset),
            "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }
    return null;
  } catch {
    return null; // fail-open: Redis down → allow request
  }
}
```

Usage in a route:
```ts
const limited = await checkRateLimit(limiters.login, getIP(req));
if (limited) return limited;
```

---

## 15. BullMQ Queue Pattern (Optional)

### Queue file template

```ts
// shared/queues/emailQueue.ts

import { Queue } from "bullmq";
import { newBullConnection } from "@/shared/lib/redis";

export type EmailJobData =
  | { type: "passwordResetOtp"; to: string; name: string; otp: string; expiryMinutes: number }
  | { type: "orderConfirmation"; to: string; name: string; orderId: string; total: number }
  | { type: "generic"; to: string; subject: string; html: string; text?: string };

const g = globalThis as typeof globalThis & { _emailQueue?: unknown };

function makeEmailQueue(): Queue<EmailJobData> {
  return new Queue<EmailJobData>("email", {
    connection:        newBullConnection(),
    defaultJobOptions: {
      attempts:         3,
      backoff:          { type: "exponential", delay: 5_000 },
      removeOnComplete: true,
      removeOnFail:     false,
    },
  });
}

export const emailQueue: Queue<EmailJobData> =
  (g._emailQueue as Queue<EmailJobData>) ?? makeEmailQueue();

if (process.env.NODE_ENV !== "production") g._emailQueue = emailQueue;
```

### safeEnqueue — always wrap queue.add() calls

```ts
async function safeEnqueue(fn: () => Promise<unknown>, label: string) {
  try { await fn(); }
  catch (err: any) { console.error(`[Queue] failed to enqueue ${label}:`, err?.message); }
}

// Usage
await safeEnqueue(
  () => emailQueue.add("orderConfirmation", { type: "orderConfirmation", ... }),
  "email.orderConfirmation",
);
```

### Worker file template

```ts
// workers/emailWorker.ts

import "dotenv/config";                      // loads .env.local before anything else
// -- or --
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Worker } from "bullmq";
import { newBullConnection } from "@/shared/lib/redis";

const worker = new Worker(
  "email",
  async (job) => {
    const data = job.data;
    switch (data.type) {
      case "passwordResetOtp":
        // await sendMail(...)
        break;
      default:
        console.warn("[emailWorker] unknown job type:", (data as any).type);
    }
  },
  { connection: newBullConnection(), concurrency: 5 },
);

worker.on("completed", (job) => console.log(`[email] done: ${job.id}`));
worker.on("failed",    (job, err) => console.error(`[email] failed: ${job?.id}`, err?.message));

async function shutdown() {
  await worker.close();
  process.exit(0);
}
process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);
```

### package.json scripts for workers

```json
{
  "scripts": {
    "dev":                 "next dev --turbopack",
    "build":               "next build",
    "start":               "next start",
    "worker:email":        "tsx --tsconfig tsconfig.json workers/emailWorker.ts",
    "worker:notification": "tsx --tsconfig tsconfig.json workers/notificationWorker.ts",
    "worker:order":        "tsx --tsconfig tsconfig.json workers/orderWorker.ts",
    "workers":             "concurrently \"npm run worker:email\" \"npm run worker:notification\" \"npm run worker:order\""
  }
}
```

> Workers are long-running Node.js processes — they cannot run on serverless platforms (Vercel, Netlify Functions). Host them on Railway, Render, or a VPS.

---

## 16. Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority

# Auth
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_SUPABASE_BUCKET=avatars

# OpenAI (if using)
OPENAI_API_KEY=sk-...

# Email (Nodemailer — add whichever providers you use)
EMAIL_FROM=noreply@yourdomain.com
ZOHO_HOST=smtp.zoho.com
ZOHO_PORT=587
ZOHO_USER=
ZOHO_PASS=
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=
BREVO_PASS=
BREVO_API_KEY=

# Redis — NEVER prefix with NEXT_PUBLIC_ (server-only)
REDIS_URL=rediss://default:<password>@<host>:6379
UPSTASH_REDIS_REST_URL=https://<host>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# App
NEXT_PUBLIC_APP_NAME=MyApp
```

**Rules**:
- `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` are **server-only** — never add `NEXT_PUBLIC_` prefix.
- Only variables that the browser legitimately needs get `NEXT_PUBLIC_`.
- Never commit `.env.local`.

---

## 17. Next.js 16 — Critical Patterns

### params is a Promise — always unwrap

```ts
// Client component
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);  // React.use() in client components
}

// Server component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// API route
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### useSearchParams requires Suspense boundary

```ts
// WRONG — build fails on Netlify/Vercel with prerender error
export default function Page() {
  const searchParams = useSearchParams();  // ← throws during prerender
  // ...
}

// CORRECT — split into inner component + default export wrapper
function PageContent() {
  const searchParams = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
```

**Any component that calls `useSearchParams()` must be a child of a `<Suspense>` boundary.** This is a build-time error, not a runtime warning — it will fail your production build.

### SSR / CSR hydration mismatch (auth-conditional UI)

```tsx
// WRONG — `useUser()` reads localStorage which returns null on server → mismatch
{currentUser?.name ? <UserAvatar /> : <LoginButton />}

// CORRECT — always render the logged-out state during SSR, swap after mount
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

{mounted && currentUser?.name ? <UserAvatar /> : <LoginButton />}
```

### Never use Schema.Types.ObjectId for user-facing ID fields

Fields that receive IDs from `useUser()`, URL params, or client-side code must be typed as `String` in Mongoose schemas, not `Schema.Types.ObjectId`.

```ts
// WRONG — Mongoose will throw CastError when given a non-ObjectId string
{ adminUserId: { type: Schema.Types.ObjectId, required: true } }

// CORRECT
{ adminUserId: { type: String, required: true } }
```

---

## 18. Icons

Use **lucide-react** exclusively. No inline SVGs. No other icon libraries.

```ts
import { ShoppingCart, User, Search, ChevronDown, LayoutGrid } from "lucide-react";

<ShoppingCart className="h-5 w-5" />
```

Always specify `h-*` and `w-*` classes on every icon.

---

## 19. Conventions Checklist

When adding any new feature, verify against this list:

| # | Rule |
|---|---|
| 1 | All reusable code goes in `shared/` — nothing reusable inside `app/` |
| 2 | Every API route calls `await mongoDB()` as the first line |
| 3 | All API responses use `success()` / `failure()` helpers from `utils/responses` |
| 4 | All Mongoose models use `mongoose.models.X \|\| mongoose.model(...)` singleton |
| 5 | `"use client"` is at the very top of client components; server components have no directive |
| 6 | User role values are **capitalised** — `"Admin"`, `"Farmer"`, `"Buyer"`, never lowercase |
| 7 | All colors use design tokens — no raw hex values or Tailwind palette classes in components |
| 8 | `cx()` from `@/shared/lib/utils` for all conditional classNames — no string template hacks |
| 9 | All icons from `lucide-react` with explicit `h-*` and `w-*` classes |
| 10 | MongoDB `findOneAndUpdate` with filter conditions for atomic operations (avoid race conditions) |
| 11 | Loading states show skeleton with `animate-pulse`, never a spinner alone |
| 12 | Edit pages use a sticky save bar (`fixed bottom-0 left-0 right-0`) |
| 13 | `useSearchParams()` callers are always wrapped in `<Suspense>` |
| 14 | Auth-conditional UI guards SSR with a `mounted` state + `useEffect` |
| 15 | All queue producers wrapped in `safeEnqueue()` — queue failure must never break API response |
| 16 | Redis env vars (`REDIS_URL`, `UPSTASH_*`) never get `NEXT_PUBLIC_` prefix |
| 17 | `ioredis` and `bullmq` listed in `serverExternalPackages` in `next.config.ts` |
| 18 | Schema generics (`new Schema<Type>()`) removed when interface has `string` but schema would use `ObjectId` |
| 19 | Community/user ID reference fields in schemas are always `{ type: String }`, never ObjectId |
| 20 | `.env.local` is never committed |
