# SHIS Fashion AI — Project Architecture Audit Report

**Date:** 2026-07-25  
**Scope:** Complete codebase read-only audit  
**Status:** Read-only analysis, no changes applied

---

## 1. EXECUTIVE SUMMARY

SHIS Fashion AI is a **production-ready, mobile-first e-commerce storefront** for a premium Bangladesh fashion brand. The stack is React 19 + Vite 8 + TypeScript + Tailwind CSS 4 + Firebase (Auth + Firestore) + Vercel deployment.

| Layer | Technology | Assessment |
|-------|-----------|-----------|
| Frontend | React 19, Vite 8, TS, Tailwind CSS 4 | Modern, solid |
| Routing | React Router 7 (lazy-loaded pages, Suspense) | ✅ Correct pattern |
| Auth | Firebase Authentication + Launch Mode bypass | ✅ Dual-path admin auth |
| Database | Cloud Firestore (real-time subscriptions) | ✅ Live-updating |
| Media | Cloudinary (primary) | ✅ Proper abstraction |
| Serverless | Vercel functions in `api/` | ✅ Clean separation |
| Deployment | Vercel (SPA + edge middleware) | ✅ Standard |
| Animation | Framer Motion | ✅ Reasonable usage |
| Analytics | GA4, Meta Pixel, Microsoft Clarity | ✅ Event tracking present |

**Overall Architecture Grade:** A-  
**Production Readiness:** High, with identified risks below.

---

## 2. PROJECT STRUCTURE OVERVIEW

```
SHIS-FASHION2/
├── .env.example              # Environment variable template
├── .env.local                # Local dev secrets (Firebase, Cloudinary, analytics)
├── AGENTS.md                 # AI development guide (highest-priority instruction)
├── README-admin.md           # Admin setup and production launch checklist
├── firestore.rules           # Firestore security rules
├── middleware.ts             # Vercel edge soft-launch gate
├── vercel.json               # SPA deployment config
├── vite.config.ts            # Build config + chunk splitting
├── api/                      # 4 Vercel serverless functions
├── docs/                     # 28 design/execution/runbook documents
├── public/                   # Static assets
├── src/
│   ├── main.tsx              # App bootstrap + analytics init
│   ├── router.tsx            # All routes + AdminRouteGuard
│   ├── layouts/MainLayout.tsx# Shell: Navbar, Footer, SEO, soft-launch
│   ├── pages/                # 19 route-level pages
│   ├── components/
│   │   ├── ui/               # 8 reusable primitives
│   │   ├── layout/           # Navbar, Footer
│   │   ├── shop/             # ProductCard
│   │   ├── home/             # Homepage sections
│   │   ├── admin/            # BrandManagement
│   │   └── common/           # ScrollToTop, PageTransition, etc.
│   ├── context/              # CartContext, ThemeContext
│   ├── firebase/             # Single init + adminService (2,491 lines)
│   ├── data/                 # Static data, taxonomy, brand showcase
│   ├── services/             # Analytics, Cloudinary, soft launch, monitoring
│   ├── utils/                # Currency, media, SEO, Bangladesh address
│   └── styles/design-system.css
```

---

## 3. DETAILED AUDIT BY DOMAIN

### 3.1 Architecture & Data Flow

**Finding:** The project follows a clean domain-driven pattern.

- **Single Firebase initialization** (`src/firebase/firebase.ts`) — correctly centralized.
- **Domain layer** (`src/firebase/adminService.ts`, 2,491 lines) — ALL Firestore CRUD, subscriptions, and auth go through this file. No bypasses detected.
- **Real-time subscriptions** — Storefront pages subscribe to Firestore via `adminService` helpers, ensuring admin edits appear live.
- **Local-first fallback** — `VITE_ALLOW_LOCAL_FALLBACK` enables localStorage persistence in dev when Firebase is unreachable.

**Risk:** `adminService.ts` is a **2,491-line monolith**. Any change to a single domain (e.g., products) risks unintended side effects in unrelated domains (orders, brands). The file has no internal module separation.

**Risk:** Local fallback mode could silently serve stale data in production if `VITE_ALLOW_LOCAL_FALLBACK` is misconfigured. The current guards seem correct, but this is a footgun.

---

### 3.2 Routing & Lazy Loading

**Finding:** All 19 routes use `lazy()` in `router.tsx` with `<Suspense fallback={<Loading />}>`.

- ✅ Proper code-splitting
- ✅ `ScrollToTop` and `PageTransition` (Framer Motion `AnimatePresence`) wrap route changes
- ✅ Admin routes (`/shis-admin/login`, `/shis-admin/dashboard`, `/admin`) are all behind `AdminRouteGuard`

**Risk:** The `*` catch-all route returns `NotFoundPage`. If any lazy import fails (missing default export, wrong path), the route will hang on `<Loading />` forever. There's no error boundary for lazy-load failures.

**Finding:** Duplicate routes exist: `/shop/:slug` (legacy category) AND `/shop/:category/:productSlug`. Both point to `ShopPage` and `ProductDetailPage` respectively. This is intentional for backward compatibility but adds routing complexity.

---

### 3.3 Authentication & Authorization

**Finding:** Dual-path admin authentication:

1. **Standard path**: Firebase Email/Password auth + email allowlist (`VITE_ADMIN_EMAILS`) + Firestore `admins` doc + `settings/admins` doc + custom claims
2. **Launch Mode path**: `VITE_LAUNCH_MODE=true` bypasses Firebase auth entirely (dev-only)

**Risk:** Launch Mode bypasses Firebase auth. The `AGENTS.md` explicitly warns this must NEVER be enabled in production. No runtime guard prevents `VITE_LAUNCH_MODE=true` from being set in production — it relies solely on developer discipline.

**Finding:** `AdminRouteGuard` subscribes to `onAdminAuthChanged()` and shows `<Loading />` while determining auth state. Once ready, it redirects to `/shis-admin/login` if unauthorized.

**Risk:** If `onAdminAuthChanged` never fires (network issue, Firebase misconfiguration), the guard will hang on `<Loading />` indefinitely. No timeout fallback is present.

---

### 3.4 Product System

**Finding:** Products are defined as `AdminProduct` in Firestore and mapped to `ShopProduct` for the storefront.

- **Slug generation**: Multiple files independently implement `slugify()` — `ShopPage.tsx`, `ProductDetailPage.tsx`, and likely others. This is a known duplication risk flagged in `AGENTS.md`.
- **Image handling**: `getProductImage()` in `utils/media.ts` provides priority-based extraction (featuredImage > thumbnail > coverImage > images array > image). All product display should use this.
- **Category taxonomy**: `src/data/categoryTaxonomy.ts` defines segments (`women`, `men`, `kids`, `all`) with subcategories, aliases, and canonical slug resolution. `ShopPage.tsx` contains the listing/filtering logic.
- **Pricing**: Stored as BDT display strings (e.g., `"৳ 1,250"`). Numeric conversion uses `parseBDT()` / `formatBDT()`. No arithmetic on raw strings.

**Finding:** Product detail page has image gallery with zoom, size/quantity selection, WhatsApp order link, related products, and full analytics tracking (Meta Pixel `viewContent`, GA4 `viewItem`, JSON-LD schema).

**Risk:** `slugify()` duplication across files means a fix to slug logic must be applied in multiple places. The `AGENTS.md` recommends extending shared helpers over copying.

**Risk:** `ProductDetailPage.tsx` has a local `toProduct()` function that differs slightly from `ShopPage.tsx`'s `mapProduct()`. Fields like `galleryImageTitles` exist in one but not the other. This could cause display inconsistencies.

---

### 3.5 Order Flow

**Finding:** Checkout is a 3-step conceptual flow:

1. **Cart** (`CartPage.tsx`) — `shis-fashion-cart` in localStorage, item IDs as `{slug}-{size}-{color}`
2. **Checkout** (`CheckoutPage.tsx`) — Bangladesh address form with:
   - Division/district/upazila cascading selects
   - Phone validation: `01XXXXXXXXX` format
   - Anti-bot cooldown (2s dwell + 15s submit cooldown)
   - COD payment flow
   - Order creation via `createOrder()` in adminService
3. **Order Success** (`OrderSuccessPage.tsx`) — Confirmation recap, GA4/Meta Pixel `purchase` event

**Finding:** Cart clears ONLY after successful order creation. `clearCart()` is called after `createOrder()` resolves.

**Risk:** `OrderSuccessPage` stores order confirmation in `sessionStorage` under key `shis-fashion-last-order`. If the user refreshes the success page, the data is lost. No server-side order lookup by ID exists for customer-facing verification.

**Finding:** `normalizeBangladeshPhone()` and `formatBangladeshPhoneInput()` handle multiple input formats (8801, 01, 88 prefix). This is robust for the Bangladesh market.

**Risk:** Firestore rules validate phone format (`^01[0-9]{9}$`), but the client-side validation in `CheckoutPage.tsx` normalizes first. If a user bypasses client validation (e.g., via DevTools), the Firestore write will fail with a `permission-denied` error. The checkout page handles `permission-denied` errors gracefully.

---

### 3.6 Admin Dashboard

**Finding:** `AdminPage.tsx` is a **2,025-line single file** containing the entire admin CMS.

**Tabs/Sections:**
- Dashboard overview
- Products (CRUD + archive/restore + image upload)
- Orders (status transitions + tracking)
- Categories (CRUD + archive/restore)
- Brands (CRUD + archive/restore)
- Homepage content (section management)
- Soft launch status debug

**Finding:** Order lifecycle transitions are enforced: `new → [confirmed, cancelled]`, `confirmed → [processing, cancelled]`, etc. This matches `AGENTS.md` requirements.

**Finding:** Image uploads use Cloudinary via `uploadAssets()` in adminService, with signed-upload mode in production (`/api/cloudinary-signature`) and unsigned preset in dev.

**Risk:** `AdminPage.tsx` is a 2,025-line component. It has no internal modularization. Any change to one tab risks breaking another. This is the highest technical debt item in the project.

**Risk:** The admin page uses `localStorage` for audit logging (`recordAdminAudit`) in addition to optional Firestore `adminAuditLogs`. In production, the local-only audit trail is not centrally visible.

---

### 3.7 Firebase & Firestore Rules

**Finding:** `firestore.rules` correctly enforces:

| Collection | Public Reads | Admin Writes | Special Rules |
|-----------|-------------|-------------|--------------|
| `products` | ✅ | ✅ | — |
| `orders` | ❌ | ✅ | Validate create: name 2-100 chars, phone `^01[0-9]{9}$`, address 5-500 chars, items 1-20, total > 0, status `new` |
| `categories` | ✅ | ✅ | — |
| `brands` | ❌ | ✅ | — |
| `settings/homepage` | ✅ | ✅ | — |
| `settings/admins` | ❌ | ✅ | — |
| `admins` | ❌ | ✅ | — |
| `adminAuditLogs` | ❌ | ✅ create/read | No update/delete |

**Risk:** The `orders` collection has NO public reads — customers cannot view their own orders after checkout. This is by design (no customer accounts), but means order tracking is admin-only or WhatsApp-based.

**Risk:** Firestore rules validate `total > 0` on order creation, but don't validate that the total matches the sum of items × price. Price tampering in the client could result in orders with incorrect totals.

---

### 3.8 UI Components & Design System

**Finding:** 8 reusable UI primitives in `src/components/ui/`:

- `Button` (4 variants: primary, secondary, ghost, cta)
- `Card`, `Container`, `Loading`, `Skeleton`, `SectionTitle`

**Finding:** Design system uses CSS custom properties in `design-system.css`:
- Fonts: Manrope (body), Cormorant Garamond (display)
- Colors: Black/white luxury brand identity
- Typography: `clamp()` responsive scale
- Transitions: 180ms/220ms cubic-bezier

**Finding:** Theme system (`luxury`) is the only active theme. The infrastructure is correct.

---

### 3.9 Utilities

**Finding:** Well-structured utilities:

| Utility | Purpose | Assessment |
|---------|---------|-----------|
| `currency.ts` | BDT formatting/parsing | ✅ Correct, `parseBDT`/`formatBDT` used consistently |
| `media.ts` | Image URL normalization | ✅ Handles demo, Cloudinary, catalog URLs |
| `seo.ts` | SEO metadata, JSON-LD | ✅ Comprehensive, `applySeoMetadata()` called in layout |
| `bangladeshAddress.ts` | Divisions, districts, upazilas, delivery charges | ✅ Complete Bangladesh geography |

**Risk:** `bangladeshAddress.ts` has hardcoded `curatedUpazilasByDistrict` — this is a large static dataset that could become stale. No update mechanism exists.

---

### 3.10 Services

**Finding:** Service layer properly abstracts external integrations:

| Service | Purpose |
|---------|---------|
| `googleAnalytics.ts` | GA4 singleton with e-commerce events |
| `metaPixel.ts` | Meta Pixel singleton with e-commerce events |
| `sessionReplay.ts` | Microsoft Clarity |
| `cloudinary.ts` | Upload/delete with progress callbacks |
| `softLaunch.ts` | Percentage/invite-only soft launch evaluation |
| `incidentAlerts.ts` | Webhook relay with rate limiting |
| `errorMonitoring.ts` | Window error/unhandledrejection capture |

**Finding:** All analytics services use the singleton pattern. They're initialized in `main.tsx` before render.

**Risk:** `errorMonitoring.ts` captures all `window.error` and `unhandledrejection` events and forwards them as GA events + incident alerts. In production, this could generate high GA event volume. No sampling or deduplication is implemented.

---

### 3.11 Middleware & Soft Launch

**Finding:** `middleware.ts` (Vercel edge function) enforces soft launch at the CDN level:

- **Percentage mode**: Hash-based visitor bucketing via cookie
- **Invite-only mode**: Invite code validation + cookie setting
- **Bypass**: Admin paths, API routes, static assets, fonts
- **Production-only enforcement**: Only active when `VERCEL_ENV === 'production'`

**Finding:** Client-side soft launch gate in `MainLayout.tsx` provides a second layer of enforcement.

**Risk:** Two-layer soft launch (edge + client) is correct, but if the edge middleware is bypassed (e.g., direct IP access, CDN misconfiguration), the client gate still protects. This is good defense-in-depth.

---

### 3.12 API Routes

**Finding:** 4 Vercel serverless functions:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cloudinary-signature` | GET | Signed upload credentials (requires Firebase ID token) |
| `/api/cloudinary-destroy` | POST | Signed asset deletion |
| `/api/incident-alert` | POST | Webhook relay with rate limiting + CORS |

**Risk:** `cloudinary-signature.ts` uses `firebase-admin` to verify ID tokens against `VITE_ADMIN_EMAILS`. If `VITE_ADMIN_EMAILS` is empty or misconfigured, no one can upload. No fallback exists.

**Risk:** `incident-alert.ts` has IP-based rate limiting (20 req/min). This is per-instance in Vercel's serverless environment — rate limits reset on cold starts and are not shared across instances.

---

### 3.13 Performance

**Finding:** Vite chunk splitting is configured for `react`, `firebase`, `framer-motion` (as `motion`), and `vendor`.

**Risk:** `chunkSizeWarningLimit: 1000` (1MB). The `vendor` chunk could easily exceed this with the current dependency set (React Router, Firebase, Framer Motion, Tailwind). Should verify actual bundle sizes.

**Risk:** `AdminPage.tsx` (2,025 lines) is lazy-loaded, which is correct. However, it imports `adminService.ts` (2,491 lines) which imports Firebase. The admin bundle will be large on first load.

**Finding:** All images should go through `utils/media.ts` normalization. Cloudinary URLs get `f_auto,q_auto,c_fill,g_auto` transforms automatically.

**Risk:** `ShopPage.tsx`'s `mapProduct()` generates `slug: slugify(product.name)` from the product name. If an admin renames a product, the slug changes, breaking any existing links/bookmarks. The `AGENTS.md` recommends preserving stable slugs.

---

### 3.14 SEO

**Finding:** `applySeoMetadata()` in `MainLayout.tsx` updates title, meta description, canonical URL, OG tags, and JSON-LD on every route change.

**Finding:** `ProductDetailPage.tsx` adds product-specific JSON-LD schema via `buildProductSchema()`.

**Risk:** `buildProductSchema()` uses `product.price` (BDT display string) directly in JSON-LD. Schema.org expects numeric values. Google's rich results test may reject this.

**Risk:** The `canonical` URL is constructed from `VITE_SITE_URL + pathname`. If query parameters are important for SEO (e.g., `/shop?sub=oversized-tee`), they're stripped from the canonical URL.

---

### 3.15 Security

**Finding:** No secrets are exposed in client code. Firebase config uses public API keys (correct for client-side Firebase).

**Finding:** `AGENTS.md` prohibits exposing secrets in source code, logs, or commits.

**Risk:** `.env.local` contains `VITE_FIREBASE_*` config and `VITE_ADMIN_EMAILS`. If this file is accidentally committed, Firebase API keys are exposed (these are public by design in Firebase, but the admin email allowlist becomes visible).

**Risk:** Checkout anti-bot cooldown is client-side only (`CHECKOUT_ANTI_BOT_COOLDOWN_KEY` in localStorage). A determined attacker can bypass this with DevTools or a custom client.

**Finding:** Firestore rules enforce `^01[0-9]{9}$` phone validation on order creation.

---

### 3.16 Testing

**Finding:** No test files, test framework, or test scripts exist in the project.

**Risk:** Zero automated test coverage. The 2,025-line `AdminPage.tsx` and 2,491-line `adminService.ts` have no regression tests. Any change to these files carries high risk of undetected breakage.

---

## 4. TECHNICAL DEBT & RISK MATRIX

| Item | Severity | Effort | Impact |
|------|----------|--------|--------|
| `adminService.ts` monolith (2,491 lines) | HIGH | HIGH | Medium-term maintainability |
| `AdminPage.tsx` monolith (2,025 lines) | HIGH | HIGH | Medium-term maintainability |
| `slugify()` duplication across files | MEDIUM | LOW | Link stability |
| No lazy-load error boundary | MEDIUM | LOW | User experience |
| No test coverage | HIGH | HIGH | Regression risk |
| Hardcoded Bangladesh upazilas | LOW | MEDIUM | Data freshness |
| `buildProductSchema()` uses BDT strings | MEDIUM | LOW | SEO/rich results |
| No customer order lookup | MEDIUM | MEDIUM | Customer experience |
| Client-side only anti-bot | LOW | MEDIUM | Spam/abuse |
| No Firebase auth timeout in guard | MEDIUM | LOW | Edge case UX |
| `vendor` chunk likely >1MB | MEDIUM | LOW | Performance |
| Product slug instability on rename | MEDIUM | LOW | SEO/links |

---

## 5. STRENGTHS

1. **Clean architecture**: Single Firebase init, centralized domain layer, real-time subscriptions
2. **Defense-in-depth soft launch**: Edge middleware + client gate
3. **Mobile-first responsive design**: Proper Tailwind usage with design system
4. **Comprehensive analytics**: GA4, Meta Pixel, Clarity, incident alerts, error monitoring
5. **Proper SEO foundation**: Metadata management, JSON-LD, canonical URLs
6. **Robust checkout**: Phone validation, address cascading, anti-bot, COD flow
7. **Admin auth dual-path**: Firebase + allowlist, with dev launch mode bypass
8. **Chunk splitting**: React, Firebase, Framer Motion split into separate bundles
9. **Real-time data**: Admin edits appear live on storefront without redeploy
10. **Well-documented**: `AGENTS.md` provides comprehensive development guardrails

---

## 6. RECOMMENDATIONS (Priority Order)

### Immediate (Before Next Feature)
1. **Add lazy-load error boundaries** — Prevent routes from hanging on `<Loading />` forever
2. **Fix `buildProductSchema()`** — Use `parseBDT()` to extract numeric price for JSON-LD
3. **Add `timeout` to `AdminRouteGuard`** — Prevent indefinite loading if auth never resolves

### Short-term (Next Sprint)
4. **Extract `slugify()` to a shared utility** — Import everywhere instead of duplicating
5. **Add npm test script + basic smoke tests** — Cover `adminService` CRUD, checkout validation, auth guard
6. **Verify bundle sizes** — Run `npm run build -- --reporter=json` and check `vendor` chunk size

### Medium-term (Next Month)
7. **Modularize `adminService.ts`** — Split into `products.ts`, `orders.ts`, `categories.ts`, `brands.ts`, `auth.ts`, `homepage.ts`, `media.ts`
8. **Modularize `AdminPage.tsx`** — Extract each tab into its own component under `src/components/admin/`
9. **Implement stable product slugs** — Add a `slug` field to `AdminProduct` that admins can set, instead of deriving from name

### Long-term (Backlog)
11. **Add customer order tracking** — Allow customers to look up orders by phone/email
12. **Server-side anti-bot** — Move checkout cooldown to `/api/checkout-cooldown` with rate limiting
13. **Audit log centralization** — Ensure all `adminAuditLogs` are written to Firestore, not just localStorage
14. **Static Bangladesh data** — Move upazilas to a package or CMS-driven approach

---

## 7. FILES AUDITED (Complete Inventory)

### Configuration & Build
- `package.json` — Dependencies, scripts, metadata
- `vite.config.ts` — Plugins, chunk splitting, dev server
- `tsconfig.app.json` — Strict TS config
- `tsconfig.node.json` — Node TS config
- `eslint.config.js` — ESLint flat config
- `index.html` — HTML entry, meta tags, fonts
- `vercel.json` — SPA rewrite rules
- `middleware.ts` — Edge soft-launch gate

### Firebase & Security
- `src/firebase/firebase.ts` — Single Firebase init
- `src/firebase/adminService.ts` — Domain layer (2,491 lines)
- `firestore.rules` — Firestore security rules

### Core Application
- `src/main.tsx` — Bootstrap, providers, analytics init
- `src/App.tsx` — Null export, router-driven
- `src/router.tsx` — Route definitions, AdminRouteGuard
- `src/layouts/MainLayout.tsx` — Shell layout, SEO, soft launch

### Context
- `src/context/CartContext.tsx` — Cart state (localStorage)
- `src/context/ThemeContext.tsx` — Theme provider
- `src/context/ThemeContextValue.ts` — Theme context creation
- `src/hooks/useTheme.ts` — Theme hook

### Pages (19 files)
- `src/pages/HomePage.tsx` — 587 lines
- `src/pages/ShopPage.tsx` — 832 lines
- `src/pages/ProductDetailPage.tsx` — 568 lines
- `src/pages/CartPage.tsx` — 143 lines
- `src/pages/CheckoutPage.tsx` — 483 lines
- `src/pages/OrderSuccessPage.tsx` — 187 lines
- `src/pages/AdminPage.tsx` — 2,025 lines
- `src/pages/BrandsPage.tsx` — 146 lines
- `src/pages/BrandDetailPage.tsx` — 129 lines
- `src/pages/CollectionListingPage.tsx` — 362 lines
- `src/pages/NewArrivalsPage.tsx` — 73 lines
- `src/pages/SalePage.tsx` — 128 lines
- `src/pages/AboutPage.tsx` — 39 lines
- `src/pages/ContactPage.tsx` — 29 lines
- `src/pages/PrivacyPage.tsx` — 39 lines
- `src/pages/TermsPage.tsx` — 39 lines
- `src/pages/FounderDetailPage.tsx` — 52 lines
- `src/pages/NotFoundPage.tsx` — 22 lines

### Components
- `src/components/ui/Button.tsx` — 4 variants
- `src/components/ui/Card.tsx` — Container card
- `src/components/ui/Container.tsx` — Max-width wrapper
- `src/components/ui/Loading.tsx` — Suspense fallback
- `src/components/ui/Skeleton.tsx` — Loading placeholder
- `src/components/ui/SectionTitle.tsx` — Section heading
- `src/components/layout/Navbar.tsx` — 428 lines
- `src/components/layout/Footer.tsx` — 99 lines
- `src/components/shop/ProductCard.tsx` — Product grid card
- `src/components/home/ShopByCategorySection.tsx` — Category cards
- `src/components/admin/BrandManagement.tsx` — Admin brand tab
- `src/components/common/ScrollToTop.tsx` — Route scroll reset
- `src/components/common/PageTransition.tsx` — Framer Motion transitions
- `src/components/common/SoftLaunchGate.tsx` — Launch gate modal
- `src/components/common/MiniCartConfirmation.tsx` — Add-to-cart toast
- `src/components/HeroVideo.tsx` — Background video

### Data
- `src/data/shopData.ts` — Seed products and categories
- `src/data/categoryTaxonomy.ts` — Segment/subcategory taxonomy
- `src/data/homeCategories.ts` — Homepage category items
- `src/data/brandShowcase.ts` — Brand entries and founder profile

### Services
- `src/services/googleAnalytics.ts` — GA4 singleton
- `src/services/metaPixel.ts` — Meta Pixel singleton
- `src/services/sessionReplay.ts` — Microsoft Clarity
- `src/services/cloudinary.ts` — Upload/delete
- `src/services/softLaunch.ts` — Launch evaluation
- `src/services/incidentAlerts.ts` — Webhook relay
- `src/services/errorMonitoring.ts` — Error capture

### Utilities
- `src/utils/currency.ts` — BDT format/parse
- `src/utils/media.ts` — Image URL normalization
- `src/utils/seo.ts` — SEO metadata, JSON-LD
- `src/utils/bangladeshAddress.ts` — Bangladesh geography + delivery

### Styles
- `src/styles/design-system.css` — CSS custom properties

### API Routes
- `api/cloudinary-signature.ts` — Signed upload credentials
- `api/cloudinary-destroy.ts` — Signed asset deletion
- `api/incident-alert.ts` — Webhook relay

### Documentation
- `AGENTS.md` — AI development guide
- `README.md` — Generic Vite scaffold README
- `README-admin.md` — Admin setup checklist
- `docs/` — 28 design/execution/runbook documents

---

## 8. MANUAL TESTING CHECKLIST (Recommended)

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Homepage loads and reflects Firestore content
- [ ] Product listing filters and sort work on mobile and desktop
- [ ] Product detail → Add to cart → Cart → Checkout → Order success
- [ ] Admin login and CRUD operations (products, orders, categories, brands)
- [ ] Soft launch gate blocks unauthorized visitors
- [ ] No console errors on any route
- [ ] Lazy-loaded routes resolve correctly (no stuck Loading states)
- [ ] Cart persists across page refreshes
- [ ] SEO metadata updates on route change
- [ ] Analytics events fire on key interactions

---

*End of audit report. No code changes have been made.*
