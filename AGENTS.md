# SHIS Fashion AI Development Guide

This document is the **permanent AI development guide** for the SHIS Fashion project. All coding agents, assistants, and automated tools must treat this file as the **highest-priority project instruction** unless explicitly overridden by the developer.

---

## Project Overview

SHIS Fashion is a **production-ready, mobile-first e-commerce storefront** for a premium Bangladesh fashion brand. The application combines a customer-facing shop, checkout flow, and an integrated admin CMS.

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4 |
| Routing | React Router 7 (lazy-loaded pages, Suspense) |
| Authentication | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore (real-time subscriptions) |
| Media | Cloudinary (primary); Firebase Storage compatible where applicable |
| Serverless API | Vercel functions in `api/` |
| Deployment | Vercel (SPA + edge middleware) |
| Animation | Framer Motion |
| Analytics | Google Analytics 4, Meta Pixel, Microsoft Clarity |

### What This Project Does

- **Storefront:** Homepage, category/segment listings, product detail, cart, checkout, order confirmation
- **Admin CMS:** Product, order, category, brand, and homepage content management
- **Live updates:** Storefront pages subscribe to Firestore via `adminService` so admin edits appear without redeploy
- **Local fallback:** Development mode can persist admin data in `localStorage` when Firebase is not configured
- **Soft launch:** Edge middleware + client gate for percentage rollout or invite-only access during launch

### Runbook

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 4173)
npm run lint         # ESLint
npm run build        # TypeScript check + production build
npm run preview      # Preview production build
```

Always run **lint** and **build** after non-trivial changes.

### Key Entry Points

| Path | Purpose |
|------|---------|
| `src/main.tsx` | App bootstrap, providers, analytics init |
| `src/router.tsx` | All routes + `AdminRouteGuard` |
| `src/layouts/MainLayout.tsx` | Shell: Navbar, Footer, SEO, soft-launch gate |
| `src/firebase/firebase.ts` | **Single** Firebase initialization |
| `src/firebase/adminService.ts` | Domain layer: CRUD, subscriptions, auth |
| `src/context/CartContext.tsx` | Cart state (`localStorage`) |
| `src/pages/AdminPage.tsx` | Admin dashboard (~2,000 lines) |
| `api/cloudinary-signature.ts` | Signed upload credentials |
| `api/cloudinary-destroy.ts` | Signed asset deletion |
| `api/incident-alert.ts` | Client incident webhook relay |
| `middleware.ts` | Vercel edge soft-launch gate |

### Admin Routes (Do Not Change Without Approval)

- `/shis-admin/login` — Admin login
- `/shis-admin/dashboard` — Admin dashboard (auth-guarded)
- `/admin` — Alternate dashboard entry (auth-guarded)

### Related Documentation

- [README-admin.md](README-admin.md) — Admin setup and production launch checklist
- [docs/](docs/) — Redesign blueprints, execution steps, and operational runbooks

---

## Core Principles

The AI must **NEVER** violate these rules.

### Architecture

- Never create duplicate Firebase initialization. Use only `src/firebase/firebase.ts`.
- Never replace existing architecture unless explicitly requested.
- Always extend existing functionality instead of rewriting.
- Reuse existing folders and modules whenever possible.
- Avoid duplicate business logic.
- Storefront data flows through `adminService` subscription helpers — do not bypass this pattern.
- Cart uses `localStorage` with item IDs formatted as `productSlug-size-color`.
- Pricing is stored as **BDT display strings**; numeric conversion only via `parseBDT` / `formatBDT`.
- Product and homepage images must use helpers in `src/utils/media.ts` — no ad hoc URL parsing.
- `VITE_LAUNCH_MODE` is a **development-only** temporary auth bypass; never enable in production unless explicitly requested.

### Code Quality

- Always use TypeScript strict patterns (`noUnusedLocals`, `noUnusedParameters`, strict typing).
- Never use `any` unless absolutely unavoidable; prefer explicit interfaces and generics.
- Write clean, modular, reusable code.
- Follow the existing project structure (see [Folder Reference](#folder-reference) below).
- Keep components small and maintainable.
- Avoid unnecessary dependencies — justify any new package before adding.
- Avoid synchronous state-setting inside effects that trigger `react-hooks/set-state-in-effect` warnings.
- Match surrounding naming, import style, and abstraction level in every file you touch.

### UI & Design

- Maintain the **premium black & white luxury brand identity**.
- Mobile-first responsive design is mandatory.
- Desktop version must also remain elegant.
- Use the existing design system in `src/styles/design-system.css`.
- Reuse existing UI components in `src/components/ui/`.
- Never introduce inconsistent styling, colors, or typography.
- Preserve spacing, typography, and visual hierarchy defined by CSS custom properties.
- Themes (`luxury`) are controlled via `ThemeContext` — do not hardcode theme colors.
- Fonts: **Manrope** (body), **Cormorant Garamond** (display).

### Components

- Always reuse existing components before creating new ones.
- Never duplicate component logic.
- Keep components composable.
- Extract reusable logic into shared components under `src/components/common/` or `src/components/ui/`.
- Page-level components live in `src/pages/`; route-specific sections live in `src/components/home/`, `src/components/shop/`, etc.

### Firebase Rules

- Never initialize Firebase twice.
- Never change Firebase configuration or env var names without explicit approval.
- Never expose secrets (API keys, private keys, webhook URLs) in client code or commits.
- Use existing Firebase services exported from `src/firebase/firebase.ts` (`auth`, `db`).
- Preserve Firestore data structure and collection names:
  - `products`, `orders`, `categories`, `brands`
  - `settings/homepage`, `adminAuditLogs`, `admins`
- Preserve Cloudinary folder conventions used by the admin upload flow.
- Never break Authentication or `AdminRouteGuard` behavior.
- Respect `firestore.rules` — public reads on products/categories/homepage; validated order creates; admin-only writes elsewhere.
- Do not modify Firestore schema (fields, collection names) without explicit approval.

### Admin Panel

- Never break the Admin Panel (`src/pages/AdminPage.tsx`).
- Never change Admin APIs (`api/cloudinary-*`, `adminService` exports) without approval.
- Preserve existing CRUD behavior for products, orders, categories, brands, and homepage content.
- Keep dashboard stable — test login, create, update, archive, restore, and upload flows after changes.
- Protect admin-only functionality behind `AdminRouteGuard` and Firebase auth checks.
- Preserve order lifecycle transitions: `new → confirmed → processing → shipped → delivered` (or `cancelled`).

### Performance

- Optimize bundle size — Vite already splits `react`, `firebase`, and `framer-motion` into separate chunks; do not regress this.
- Lazy-load large pages (all routes already use `lazy()` in `router.tsx` — maintain this pattern).
- Prevent unnecessary re-renders; use `useMemo` / `useCallback` where appropriate, not everywhere.
- Reuse utilities in `src/utils/` and services in `src/services/`.
- Avoid duplicated code across pages (e.g., product mapping, slugify logic).
- Verify storefront routes do not get stuck on `<Loading />` after import changes.

### SEO

- Preserve metadata managed by `src/utils/seo.ts`.
- Do not remove or bypass `applySeoMetadata()` calls in layout or pages.
- Maintain semantic HTML (`main`, `nav`, `section`, heading hierarchy).
- Keep accessibility in mind: labels, alt text, focus states, ARIA where needed.
- Use proper heading hierarchy (one `h1` per page, logical `h2`/`h3` nesting).
- Preserve canonical URLs, Open Graph tags, and JSON-LD product schema on PDPs.

### Security

- Never expose secrets in source code, logs, or commit messages.
- Validate user input on checkout and admin forms (phone format, required fields, stock limits).
- Keep Firebase security rules compatible with any data writes you introduce.
- Never remove authentication protection from admin routes.
- Production API routes (`api/cloudinary-*`) require Firebase ID token verification — do not bypass.
- Preserve checkout anti-bot cooldowns and order field validation.

### Git Rules

- Make the smallest possible changes.
- Modify only necessary files.
- Never rewrite unrelated code.
- Never rename files without reason.
- Never delete code unless requested.
- Do not create commits unless explicitly asked by the developer.

---

## Before Coding

Always:

1. **Analyze** the complete codebase relevant to the task.
2. **Understand** existing architecture, data flow, and conventions.
3. **Identify** reusable code (components, utils, services, adminService helpers).
4. **Explain** the implementation plan before writing code.
5. **Wait for approval** before major refactoring, schema changes, or new dependencies.

---

## Before Creating New Files

Always check whether:

- A similar file already exists
- A reusable component exists in `src/components/`
- A utility already exists in `src/utils/`
- A service already exists in `src/services/`
- A data module already exists in `src/data/`
- An `adminService` subscription or CRUD helper already covers the need

**Never create duplicates.**

---

## Before Suggesting Code

Mentally verify:

- [ ] `npm run build` should succeed
- [ ] TypeScript should compile with no errors
- [ ] No new lint issues (`npm run lint`)
- [ ] No broken imports
- [ ] No circular dependencies
- [ ] Cart `localStorage` persistence still works if checkout/cart touched
- [ ] Admin auth guard still works if auth/routing touched
- [ ] Lazy-loaded routes still resolve if imports changed

---

## After Every Task

Provide:

### Summary
Brief description of what was done and why.

### Files Changed
List every modified, added, or deleted file.

### Why Each File Changed
One-line rationale per file.

### Potential Risks
Regressions, edge cases, or areas needing human verification.

### Manual Testing Checklist
Concrete steps the developer should run, for example:

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Homepage loads and reflects Firestore content
- [ ] Product listing filters and sort work on mobile and desktop
- [ ] Product detail → Add to cart → Cart → Checkout → Order success
- [ ] Admin login and CRUD operations (if admin touched)
- [ ] No console errors on affected routes

---

## Never Do These

- Never duplicate Firebase initialization.
- Never duplicate utilities, services, or components.
- Never break routing (`src/router.tsx`).
- Never break checkout or cart persistence.
- Never break authentication or admin route guards.
- Never break product pages or listing query logic.
- Never break the admin panel.
- Never change environment variable names or add secrets to the repo.
- Never modify Firestore schema without approval.
- Never remove existing features without explicit request.
- Never change public API route contracts without approval.
- Never enable launch mode or local fallback in production unless explicitly requested.
- Never commit `.env`, credentials, or private keys.

---

## Development Workflow

For every request, follow these phases:

| Phase | Action |
|-------|--------|
| **1. Analyze** | Read relevant files, trace data flow, identify dependencies |
| **2. Plan** | Propose minimal diff, list files to touch, note risks |
| **3. Wait for approval** | Pause before major refactors, schema changes, or new deps |
| **4. Implement** | Make focused changes following all rules above |
| **5. Self review** | Re-read diff, check imports, types, and edge cases |
| **6. List changed files** | Report every file touched with rationale |
| **7. Provide testing checklist** | Give concrete manual verification steps |

---

## Folder Reference

```
SHIS-FASHION2/
├── api/                    # Vercel serverless functions
├── docs/                   # Design docs, execution steps, runbooks
├── public/                 # Static assets (robots.txt, sitemap.xml, logos)
├── src/
│   ├── main.tsx            # Entry point
│   ├── router.tsx          # Routes + AdminRouteGuard
│   ├── layouts/            # MainLayout shell
│   ├── pages/              # Route-level page components
│   ├── components/
│   │   ├── ui/             # Button, Card, Container, Loading, Skeleton, etc.
│   │   ├── layout/         # Navbar, Footer
│   │   ├── shop/           # ProductCard
│   │   ├── home/           # Homepage sections
│   │   ├── admin/          # BrandManagement
│   │   └── common/         # ScrollToTop, PageTransition, SoftLaunchGate, etc.
│   ├── context/            # CartContext, ThemeContext
│   ├── firebase/           # firebase.ts, adminService.ts
│   ├── data/               # shopData, categoryTaxonomy, homeCategories, brandShowcase
│   ├── services/           # cloudinary, analytics, softLaunch, errorMonitoring
│   ├── utils/              # currency, media, seo, bangladeshAddress
│   ├── hooks/              # useTheme
│   ├── styles/             # design-system.css
│   └── assets/             # Logos and static imports
├── firestore.rules         # Firestore security rules
├── middleware.ts           # Edge soft-launch middleware
├── vercel.json             # SPA deployment config
└── vite.config.ts          # Build config + chunk splitting
```

---

## Data & Integration Conventions

### Firestore Collections

| Collection | Storefront | Admin |
|------------|------------|-------|
| `products` | Read (live subscription) | CRUD + archive |
| `orders` | Create (checkout) | Read/update/archive |
| `categories` | Read | CRUD + archive |
| `brands` | Read | CRUD + archive |
| `settings/homepage` | Read (live subscription) | Update |
| `adminAuditLogs` | — | Create (admin actions) |

### Cart & Checkout

- Storage key: `shis-fashion-cart`
- Item ID format: `{productSlug}-{size}-{color}`
- Checkout writes to Firestore `orders` with Bangladesh phone validation (`01XXXXXXXXX`)
- Order confirmation stored in `sessionStorage` for the success page

### Media Uploads

- Client uploads via `src/services/cloudinary.ts`
- Unsigned preset (dev) or signed upload via `/api/cloudinary-signature` (production)
- Deletion via `/api/cloudinary-destroy`
- Always normalize display URLs through `src/utils/media.ts`

### Category Taxonomy

- Segments: `women`, `men`, `kids`, `all`
- Subcategories and slug aliases defined in `src/data/categoryTaxonomy.ts`
- Listing logic lives in `ShopPage.tsx` — extend taxonomy there, do not fork filtering logic

### Analytics Events

- GA4 and Meta Pixel initialized in `main.tsx`
- Page views tracked in `MainLayout` on route change
- E-commerce events (ViewContent, AddToCart, Purchase) tracked in relevant pages
- Do not remove or rename tracked events without approval

---

## High-Value Pitfalls

These issues have caused regressions before — avoid them:

1. **Effect-driven setState loops** — Do not synchronously set state inside effects that depend on that state.
2. **Cart clear on redirect** — If checkout flow changes, verify cart clears only after successful order, not before.
3. **Stuck Loading state** — Broken lazy imports or missing default exports leave routes on the Suspense fallback forever.
4. **Local fallback in production** — `VITE_ALLOW_LOCAL_FALLBACK` must be `false` in production; never rely on localStorage for live data in prod.
5. **Launch mode in production** — `VITE_LAUNCH_MODE` bypasses Firebase auth; dev-only unless explicitly overridden.
6. **Firestore rules mismatch** — New collections or write patterns must align with `firestore.rules` or writes will fail silently/forbidden.
7. **BDT string corruption** — Never do arithmetic on price strings directly; always use `parseBDT` / `formatBDT`.
8. **Duplicate slugify/mapProduct logic** — Several pages map `AdminProduct → ShopProduct`; prefer extending shared helpers over copying.

---

## Environment Variables (Reference Only)

Never commit values. Never rename without approval. Key variables:

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase client config |
| `VITE_ADMIN_EMAILS` | Comma-separated admin allowlist |
| `VITE_CLOUDINARY_*` | Cloudinary upload config |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 |
| `VITE_META_PIXEL_ID` | Meta Pixel |
| `VITE_CLARITY_PROJECT_ID` | Microsoft Clarity |
| `VITE_SITE_URL` | Canonical site URL |
| `VITE_LAUNCH_MODE` | Dev-only auth bypass |
| `VITE_ALLOW_LOCAL_FALLBACK` | Dev localStorage fallback |
| `VITE_SOFT_LAUNCH_*` | Client soft-launch gate |
| `SOFT_LAUNCH_*` | Edge middleware soft-launch |
| `FIREBASE_ADMIN_*` | Server-side Firebase Admin SDK |
| `CLOUDINARY_*` | Server-side Cloudinary signing |
| `INCIDENT_ALERT_WEBHOOK_URL` | Incident alert destination |

See [README-admin.md](README-admin.md) for the full production launch checklist.

---

## Priority Order

When instructions conflict, follow this order:

1. **Explicit developer override** in the current conversation
2. **This AGENTS.md**
3. **User rules** in the IDE/agent settings
4. **General best practices**

When in doubt, **ask before changing** architecture, schema, auth, checkout, or admin behavior.
