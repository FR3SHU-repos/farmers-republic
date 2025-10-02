# 🌿 PureNature — Organic E-Commerce

PureNature is a **modern e-commerce web app** built with [Next.js 14](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).  
It’s designed for selling **organic and natural products**, with a mobile-first UI, bottom navigation, and modular components.

---

## ✨ Features
- 📱 **Mobile-first design** with a bottom navigation bar for a native-app feel  
- 🛒 **Cart drawer & wishlist** with persistent state (localStorage ready)  
- 🔎 **Search & category filter** with debounced input  
- 🖼️ **Optimized images** via Next.js `next/image`  
- ⚡ **Modular architecture** — reusable components (`NavBar`, `BottomNav`, `ProductCard`, etc.)  
- 🎨 **Modern UI** with Tailwind, responsive layouts, hover animations  
- 🔗 **TypeScript types** for products, categories, cart logic  
- ♻️ **Clean separation** of concerns:
  - `/app` → routes and pages  
  - `/components` → shared UI  
  - `/shared` → data & interfaces  
  - `/lib` → utilities  

---

## 📂 Project Structure
```bash
farmers-republic/
├── app/
│   ├── page.tsx          # Home page
│   ├── icons/page.tsx    # Icon explorer route
│   └── layout.tsx        # Root layout
│
├── components/
│   ├── NavBar.tsx
│   ├── BottomNav.tsx
│   ├── ProductCard.tsx
│   └── CartDrawer.tsx (planned)
│
├── shared/
│   ├── data/
│   │   ├── product.ts    # Product seed data
│   │   └── category.ts   # Category seed data
│   └── interfaces/
│       └── general.ts    # Product & Category types
│
├── lib/
│   └── utils.ts          # cx(), helpers
│
├── public/               # Static assets
├── package.json
├── tsconfig.json
└── next.config.js        # Unsplash images allowed
````

---

## 🚀 Getting Started

### 1️⃣ Clone & install

```bash
git clone https://github.com/your-username/farmers-republic.git
cd farmers-republic
npm install
```

### 2️⃣ Run the dev server

```bash
npm run dev
```

Now visit [http://localhost:3000](http://localhost:3000) 🎉

### 3️⃣ Build for production

```bash
npm run build
npm run start
```

---

## ⚙️ Configuration

* **Images**: Make sure `next.config.js` allows Unsplash (or your own CDN):

```js
const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
};
module.exports = nextConfig;
```

* **Products & Categories**: Edit `shared/data/product.ts` and `shared/data/category.ts` to update your catalog.

---

## 🛠️ Tech Stack

* [Next.js 14](https://nextjs.org/) — App Router, server components, API routes
* [TypeScript](https://www.typescriptlang.org/) — type safety
* [Tailwind CSS](https://tailwindcss.com/) — styling
* [lucide-react](https://lucide.dev/) — beautiful icons
* [next/image](https://nextjs.org/docs/app/building-your-application/optimizing/images) — optimized images

---

## 🌱 Roadmap

* ✅ Core UI (home, navbar, bottom nav, product cards)
* 🔲 Cart context with persistence
* 🔲 Product detail modal & quick view
* 🔲 Checkout flow
* 🔲 Backend API integration (Django, Node, or Commerce API)
* 🔲 Authentication (sign-in / profile tab)

---

## 🤝 Contributing

PRs are welcome! Fork the repo and submit a pull request 🚀

---

## 📄 License

MIT © 2025 [Your Name]



