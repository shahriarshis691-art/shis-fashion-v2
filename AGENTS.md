# SHIS FASHION2 Agent Guide

This file helps coding agents contribute quickly and safely in this repository.

## Scope

- Frontend: React 19 + TypeScript + Vite 8 + Tailwind 4
- Backend-style routes: Vercel serverless functions in api/
- Data/auth: Firebase Auth + Firestore with local fallback patterns in admin service

## Runbook

1. Install dependencies: npm install
2. Start dev server: npm run dev
3. Lint: npm run lint
4. Production build: npm run build
5. Preview build: npm run preview

Always run lint and build after non-trivial changes.

## Important Paths

- Routing: src/router.tsx
- App shell/layout: src/layouts/MainLayout.tsx
- Storefront pages: src/pages/
- Admin surface: src/pages/AdminPage.tsx
- Firebase bootstrap: src/firebase/firebase.ts
- Admin domain logic and subscriptions: src/firebase/adminService.ts
- Cart state: src/context/CartContext.tsx
- Shared media helpers: src/utils/media.ts
- Currency helpers: src/utils/currency.ts
- Cloudinary helpers: src/services/cloudinary.ts
- Vercel API routes: api/cloudinary-signature.ts, api/cloudinary-destroy.ts

## Architecture Notes

- Router uses lazy-loaded pages with Suspense fallback; auth-gated admin routes are protected by AdminRouteGuard in src/router.tsx.
- Storefront pages subscribe to admin-managed Firestore content via adminService so admin updates appear live.
- Admin authentication supports a temporary launch mode in development; production should rely on Firebase auth.
- Cart is localStorage-backed and uses a composed item id format: productSlug-size-color.

## Conventions To Preserve

- Use auth/db imports from src/firebase/firebase.ts. Do not initialize Firebase in multiple places.
- Keep pricing as BDT display strings in content models, and convert only through parseBDT/formatBDT helpers.
- For product/homepage images, use media normalization helpers instead of ad hoc URL parsing.
- Prefer existing subscription helper patterns in adminService when adding new Firestore-backed data.
- Keep admin route behavior aligned with current paths:
  - /shis-admin/login
  - /shis-admin/dashboard
  - /admin

## High-Value Pitfalls

- Avoid synchronous state-setting patterns inside effects that trigger react-hooks/set-state-in-effect warnings.
- If checkout/cart behavior is changed, ensure localStorage persistence and clear behavior remain consistent on redirects.
- Launch mode must remain development-only unless explicitly requested otherwise.
- When adjusting heavy page imports, verify storefront routes still show promptly and do not get stuck on Loading.

## Existing Documentation

- Admin setup and launch checklist: [README-admin.md](README-admin.md)
- Project root README template: [README.md](README.md)

Prefer linking to these docs in PR notes or follow-up instructions instead of duplicating long checklists here.
