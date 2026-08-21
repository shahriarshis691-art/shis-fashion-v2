Admin panel setup
=================

Quick steps to enable full admin features (uploads, Firebase Auth/Firestore):

1. Create a copy of `.env.example` as `.env.local` in the project root and fill Firebase + Cloudinary values.

2. Cloudinary uploads require:
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET` (unsigned upload preset)

Production hardening (recommended):
- Set `VITE_CLOUDINARY_SIGNED_UPLOAD=true`.
- Add server-side env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Add Firebase Admin env vars for signed media routes: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`.
- Use deployed API routes `/api/cloudinary-signature` and `/api/cloudinary-destroy` for signed upload/delete.

3. Install dependencies and run dev server:

```bash
npm install
npm run dev
```

4. Admin routes:
- Login: `/shis-admin/login`
- Dashboard: `/shis-admin/dashboard`

Demo credentials (localhost / `npm run dev` only):
- Email: `admin@shisfashion.com`
- Password: `luxury123`

Production (`shisfashion.com`) uses Firebase Authentication only. After sign-in the app checks `admins/{uid}` for `role: "admin"` (or `owner` / ops roles) and `active: true`.

If an allow-listed email signs in before `admins/{uid}` exists, the dashboard is view-only. Product and order writes stay blocked until that document is created.

Admin auth is verified in the browser with the Firebase SDK. Do not add extra Vercel functions for login.

Troubleshooting:
- If uploads fail, verify Cloudinary cloud name and upload preset values.
- If auth/data fails, verify all `VITE_FIREBASE_*` values.

Production Launch Checklist
===========================

Use this before running paid traffic.

Primary campaign-day runbook:
- See `docs/campaign-day-qa-checklist.md` for the final go/no-go sequence (Meta + GA4 + checkout verification).
- See `docs/phase1-launch-checklist.md` for Phase 1 COD soft-launch steps (env, rules deploy, test order).
- See `docs/steps-1-4-launch-runbook.md` for the full Step 1–4 launch sequence.
- See `docs/phase2-payments-checklist.md` for bKash/Nagad Send Money (01887848304 / 01979614216).
- See `docs/phase2b-bkash-api-checklist.md` for bKash Tokenized Checkout (API redirect).

1. Environment variables
- Copy `.env.example` values into your production environment.
- Set all `VITE_FIREBASE_*` values from the live Firebase project.
- Set `VITE_SITE_URL=https://shisfashion.com`.
- Keep `VITE_ALLOW_LOCAL_FALLBACK=false` in production.
- Keep `VITE_LAUNCH_MODE=false` in production.
- Set `VITE_ADMIN_EMAILS` to the final admin email list only.
- Set `VITE_GA_MEASUREMENT_ID` to the live Google Analytics 4 Measurement ID.
- Set `VITE_META_PIXEL_ID` to the live Meta Pixel ID.

Optional (fail closed if unset; COD and WhatsApp still work):
- `VITE_PREPAID_ENABLED=true` to show bKash on checkout.
- Server: `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, optional `BKASH_BASE_URL`, `PREPAID_CALLBACK_URL`.
- Or SSLCOMMERZ: `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`.
- Email: `RESEND_API_KEY` or `SENDGRID_API_KEY`, optional `ORDER_NOTIFY_FROM_EMAIL`.
- SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, or `SMS_WEBHOOK_URL`.
- Rate limits: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Upstash Redis REST). Without these, API limits fall back to in-memory per isolate.
- SSLCommerz IPN: optional `SSLCOMMERZ_IPN_URL` (defaults to `{VITE_SITE_URL}/api/sslcommerz-ipn`).

2. Firebase project checks
- Firebase Authentication must be enabled for Email/Password sign-in.
- Firestore must be enabled in production mode.
- The live admin user must exist in Firebase Auth.
- Create `admins/{uid}` in Firestore with `{ "role": "admin", "active": true }` for full write access.
- Firestore security rules must allow the required admin reads/writes. Guest checkout writes go through `/api/create-order`.
- Place one real test order and confirm it appears in Firestore and the admin dashboard.

3. Admin checks
- Visit `/shis-admin/login` and confirm only authorized admin emails can sign in.
- Confirm product create, update, image upload, and homepage edits save correctly.
- Confirm orders can be seen, updated, and deleted from the dashboard.

4. Storefront checks
- Home category cards should open filtered category pages.
- Product card click should open the product details page.
- Add to cart, cart update, checkout, and order success flow should complete on mobile and desktop.
- Test at least one full order from storefront to admin panel visibility.

5. Deployment checks
- Deploy the latest build.
- Confirm `robots.txt` loads.
- Confirm `sitemap.xml` loads.
- Confirm the custom domain serves the latest version, not only the `vercel.app` domain.

Meta Pixel Live Test Checklist
==============================

Run these checks on the live domain after deployment.

Note:
- For full launch validation (including GA4 and decision rules), follow `docs/campaign-day-qa-checklist.md`.

1. Browser/devtools quick check
- Open the live site and verify `https://connect.facebook.net/en_US/fbevents.js` loads successfully.
- Verify there are no console errors related to `fbq` or Meta Pixel.

2. Meta Events Manager test
- In Meta Events Manager, open the Test Events tool for the live pixel.
- Visit the live homepage and confirm `PageView` arrives.
- Open a product details page and confirm `ViewContent` arrives.
- Use search from the navbar and confirm `Search` arrives.
- Click Add to Cart and confirm `AddToCart` arrives.
- Click Buy Now / go to checkout and confirm `InitiateCheckout` arrives.
- Complete one test order and confirm `Purchase` arrives on the order success page.

3. Data validation
- Confirm currency is `BDT`.
- Confirm product name and content IDs are present in product events.
- Confirm purchase value matches the order grand total.

4. Go-live pass criteria
- All six events arrive in Meta Events Manager without errors.
- No duplicate `PageView` events appear on a single page load.
- Purchase fires only after successful order completion.
