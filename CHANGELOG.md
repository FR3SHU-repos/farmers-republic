# 📑 Changelog

All notable changes to **Farmers Republic** will be documented here.
We follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

---

## [0.2.0] - 2025-10-04

### Added

* 👤 **Profile page** with:

  * User details (name, email, phone, type)
  * Logout button (clears cookie + context)
  * Avatar upload via **Supabase storage** (`avatars` bucket)
* 🔑 **Authentication APIs**:

  * `POST /api/v1/auth/register` → Register with auto-login (JWT)
  * `POST /api/v1/auth/login` → Login with bcrypt + JWT
  * `GET /api/v1/auth/me` → Verify JWT and return user details
  * `POST /api/v1/auth/logout` → Clear JWT cookie
* 🧩 **User Context** (`UserContext.tsx`) to store session in `localStorage` and provide `login/logout` globally.
* 🖼️ **Supabase integration** with client (`supabaseClient.ts`) and storage bucket policies.

### Changed

* 🔄 Updated **NavBar** and **BottomNav**:

  * NavBar shows profile or login/register links
  * BottomNav profile tab routes to `/profile`
  * Mobile Nav simplified (logo + search only)

### Fixed

* 🛠️ JWT signing issue (`expiresIn` type mismatch in TypeScript)
* 🛠️ MongoDB connection issue on Netlify (`MONGODB_URI` env var missing)

---

## [0.1.0] - 2025-10-02

### Added

* 🌱 Initial Farmers Republic setup (forked from PureNature)
* 📱 Mobile-first UI with **NavBar** + **BottomNav**
* 🛒 Product cards, search, categories, wishlist (UI only)
* 🔗 Basic project structure with `/app`, `/shared/components`, `/shared/data`
* 🖼️ Next.js Image optimization enabled

---

## [Unreleased]

* 🛒 Cart context & checkout flow
* 📦 Supplier/FPO dashboards
* 🚚 Logistics and order tracking
* 🤖 AI-based crop/climate predictions

---

### 🔖 Tagging Guide

When you cut a release:

```bash
git tag -a v0.2.0 -m "Profile page, Supabase integration, JWT auth"
git push origin v0.2.0
```
