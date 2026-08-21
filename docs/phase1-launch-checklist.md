# Phase 1 Launch Checklist (COD Soft Launch)

Complete these steps before opening the storefront to real customers with **Cash on Delivery**.

## A. Code & CI (local / repo)

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run verify:launch -- --production` passes **after** Vercel env is configured (or run against exported env)

## B. Vercel production environment

Copy keys from [`.env.example`](../.env.example) into **Vercel → Project → Settings → Environment Variables (Production)**.

Required:

| Variable | Value |
|----------|--------|
| `VITE_FIREBASE_*` | Live Firebase web app config |
| `FIREBASE_ADMIN_*` | Firebase service account (order API) |
| `VITE_SITE_URL` | `https://www.shisfashion.com` |
| `VITE_ALLOW_LOCAL_FALLBACK` | `false` |
| `VITE_LAUNCH_MODE` | `false` |
| `VITE_PREPAID_ENABLED` | `false` |
| `VITE_ADMIN_EMAILS` | Comma-separated admin emails |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `VITE_CLOUDINARY_SIGNED_UPLOAD` | `true` |
| `CLOUDINARY_*` | Server signing credentials |

Recommended before ads:

| Variable | Purpose |
|----------|---------|
| `VITE_GA_MEASUREMENT_ID` | GA4 |
| `VITE_META_PIXEL_ID` | Meta Pixel |

## C. Firebase

1. Enable **Authentication → Email/Password**.
2. Enable **Firestore** (production mode).
3. Create admin user in Firebase Auth.
4. Create Firestore doc `admins/{uid}` with `{ "role": "admin", "active": true }`.
5. Deploy security rules:

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
npm run deploy:rules
```

## D. Deploy

```bash
git push origin main
```

Or trigger the GitHub Action / Vercel deploy for production.

Verify after deploy:

- [ ] `https://www.shisfashion.com/robots.txt`
- [ ] `https://www.shisfashion.com/sitemap.xml`
- [ ] `/shis-admin/login` loads (Firebase auth only on production domain)

## E. One real COD test order

1. Open production site in a private browser window.
2. Add a product → Cart → Checkout.
3. Use a real Bangladesh phone format: `01XXXXXXXXX`.
4. Place order (Cash on Delivery).
5. Confirm in **Firebase Console → Firestore → `orders`**.
6. Confirm order appears in **Admin dashboard → Orders**.

## F. Campaign QA (if running ads)

Follow [campaign-day-qa-checklist.md](./campaign-day-qa-checklist.md) for Meta + GA4 funnel verification.

## Go / No-Go

**GO** when A–E are checked and one COD order succeeds end-to-end.

**NO-GO** if checkout returns 500, orders missing in Firestore, or admin cannot sign in.

## Phase 2 (later)

- Enable `VITE_PREPAID_ENABLED` only after live bKash/SSLCommerz URLs are verified.
- Fix prepaid stock reservation before high prepaid volume.
