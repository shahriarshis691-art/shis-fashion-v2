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
- Use deployed API routes `/api/cloudinary-signature` and `/api/cloudinary-destroy` for signed upload/delete.

3. Install dependencies and run dev server:

```bash
npm install
npm run dev
```

4. Admin routes:
- Login: `/shis-admin/login`
- Dashboard: `/shis-admin/dashboard`

Demo credentials (works when Firebase is not configured):
- Email: `admin@shisfashion.com`
- Password: `luxury123`

Troubleshooting:
- If uploads fail, verify Cloudinary cloud name and upload preset values.
- If auth/data fails, verify all `VITE_FIREBASE_*` values.

Production Launch Checklist
===========================

Use this before running paid traffic.

1. Environment variables
- Copy `.env.example` values into your production environment.
- Set all `VITE_FIREBASE_*` values from the live Firebase project.
- Set `VITE_SITE_URL=https://shisfashion.com`.
- Keep `VITE_ALLOW_LOCAL_FALLBACK=false` in production.
- Keep `VITE_LAUNCH_MODE=false` in production.
- Set `VITE_ADMIN_EMAILS` to the final admin email list only.
- Set `VITE_GA_MEASUREMENT_ID` to the live Google Analytics 4 Measurement ID.
- Set `VITE_META_PIXEL_ID` to the live Meta Pixel ID.

2. Firebase project checks
- Firebase Authentication must be enabled for Email/Password sign-in.
- Firestore must be enabled in production mode.
- The live admin user must exist in Firebase Auth.
- Firestore security rules must allow the required admin reads/writes and storefront order writes.
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
