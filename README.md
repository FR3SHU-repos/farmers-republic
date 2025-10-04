

# 🌿 Farmers Republic — Organic E-Commerce Platform

Farmers Republic is a **modern e-commerce web app** built with [Next.js 14](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), and [Supabase](https://supabase.com/) for file storage.

It’s designed to connect **farmers, suppliers, and retailers** with buyers — focusing on **organic, natural, and wild farm products**. The app is mobile-first with authentication, profile management, and modular reusable components.

---

## ✨ Features

* 📱 **Mobile-first design** with top and bottom navigation bars
* 👥 **User Authentication** (register, login, logout, JWT cookies)
* 👤 **Profile page** with user details, photo upload (via Supabase) & logout
* 🌐 **API Routes** using Next.js App Router (`/api/v1/...`)
* 🔑 **User Context** with persistent login (localStorage + cookies + `/me` route)
* 🛒 **Cart drawer & wishlist** (extensible, context-ready)
* 🔎 **Search & category filter** with debounced input
* 🖼️ **Supabase storage integration** for profile images (avatars bucket)
* ⚡ **Reusable modular components** (`NavBar`, `BottomNav`, `ProductCard`, etc.)
* 🎨 **Tailwind-powered UI** with hover animations, responsive design
* ✅ **Environment-ready** with `.env` (JWT, Mongo, Supabase keys)

---

## 📂 Project Structure

```bash
farmers-republic/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx        # Login & Register page
│   ├── profile/page.tsx          # Profile page (details + logout + avatar upload)
│   ├── api/v1/
│   │   ├── auth/
│   │   │   ├── login/route.tsx   # Login API
│   │   │   ├── register/route.tsx# Register API
│   │   │   ├── me/route.tsx      # Validate JWT & fetch logged-in user
│   │   │   └── logout/route.tsx  # Logout (clear cookie)
│   │   └── utils/responses.tsx   # Standard success/failure responses
│   ├── layout.tsx                # Root layout (wrapped with UserProvider + Shell)
│   └── page.tsx                  # Home page
│
├── shared/
│   ├── components/
│   │   ├── NavBar.tsx            # Top navigation (desktop + mobile)
│   │   ├── BottomNav.tsx         # Bottom navigation (mobile only)
│   │   └── mainTemplate.tsx      # App shell wrapper
│   ├── context/
│   │   └── UserContext.tsx       # Manages auth state (login/logout/user)
│   ├── lib/
│   │   ├── db/mongo.ts           # MongoDB connection helper
│   │   ├── supabaseClient.ts     # Supabase storage client
│   │   └── utils.ts              # Helpers (cx, classNames)
│   └── models/mongodb/
│       └── user.ts               # User schema (Mongoose)
│
├── public/                       # Static assets
├── .env                          # Environment variables
├── package.json
└── next.config.js
```

---

## ⚙️ Configuration

### Environment variables (`.env`)

```env
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-role-key
```

---

## 🛠️ Tech Stack

* [Next.js 14](https://nextjs.org/) — App Router, API Routes
* [TypeScript](https://www.typescriptlang.org/) — type safety
* [Tailwind CSS](https://tailwindcss.com/) — modern styling
* [lucide-react](https://lucide.dev/) — icons
* [Supabase](https://supabase.com/) — file storage (avatars/images)
* [Mongoose](https://mongoosejs.com/) — MongoDB ODM
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JWT auth
* [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — password hashing
* [react-hot-toast](https://react-hot-toast.com/) — notifications

---

## 🚀 Getting Started

### 1️⃣ Clone & install

```bash
git clone https://github.com/your-username/farmers-republic.git
cd farmers-republic
npm install
```

### 2️⃣ Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

### 3️⃣ Production build

```bash
npm run build
npm run start
```

---

## 🌱 Roadmap

* ✅ Authentication (register, login, JWT cookies, context)
* ✅ Profile page with logout + avatar upload (Supabase)
* 🔲 Cart context with persistence
* 🔲 Product detail & checkout flow
* 🔲 Supplier dashboard for FPOs and retailers
* 🔲 Real-time order tracking
* 🔲 AI-powered crop & climate predictions (future)

---

## 🤝 Contributing

PRs are welcome! Fork, branch, and submit 🚀

---

## 📄 License

MIT © 2025 Farmers Republic

