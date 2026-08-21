# Steps 1–4 Launch Runbook

Complete in order. Steps 1–3 are **your manual actions** on Vercel/Firebase/bKash. Step 4 is **already in code** (admin payment ops).

---

## Step 1 — COD soft launch

### 1.1 Vercel production env

Copy from [`.env.example`](../.env.example) into **Vercel → Settings → Environment Variables → Production**.

Required minimum:

| Variable | Value |
|----------|--------|
| `VITE_FIREBASE_*` | Live Firebase web config |
| `FIREBASE_ADMIN_*` | Service account for `/api/create-order` |
| `VITE_SITE_URL` | `https://www.shisfashion.com` |
| `VITE_ALLOW_LOCAL_FALLBACK` | `false` |
| `VITE_LAUNCH_MODE` | `false` |
| `VITE_PREPAID_ENABLED` | `false` (enable in Step 3) |
| `VITE_ADMIN_EMAILS` | Your admin email(s) |
| `VITE_CLOUDINARY_*` + `CLOUDINARY_*` | Media uploads |

Optional but recommended: `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, `INCIDENT_ALERT_WEBHOOK_URL` (Slack/Discord for ops alerts).

### 1.2 Verify locally (after exporting env or using `.env.local`)

```bash
npm run verify:launch -- --production
```

Must pass with **zero errors** before go-live.

### 1.3 Firebase

```bash
firebase login
firebase use <your-project-id>
npm run deploy:rules
```

1. Enable **Auth → Email/Password**
2. Create admin user in Firebase Auth
3. Create Firestore doc: `admins/{uid}` → `{ "role": "admin", "active": true }`

### 1.4 Deploy & smoke test

```bash
git push origin main
```

After deploy:

- [ ] `https://www.shisfashion.com/sitemap.xml` loads
- [ ] `/shis-admin/login` loads
- [ ] Place **one COD order** on production
- [ ] Order appears in Firestore `orders` collection
- [ ] Order appears in Admin → Orders

**Step 1 done when:** One real COD order succeeds end-to-end.

---

## Step 2 — Manual wallet (Send Money + TrxID)

Keep COD live. Wallet uses merchant numbers already in code:

| Wallet | Number | Env var |
|--------|--------|---------|
| bKash | `01887848304` | `VITE_BKASH_MERCHANT_NUMBER` |
| Nagad | `01979614216` | `VITE_NAGAD_MERCHANT_NUMBER` |

### 2.1 Vercel env

```env
VITE_MOBILE_WALLET_PAYMENTS_ENABLED=true
VITE_BKASH_MERCHANT_NUMBER=01887848304
VITE_NAGAD_MERCHANT_NUMBER=01979614216
VITE_PREPAID_ENABLED=false
```

Redeploy after changing `VITE_*` vars.

### 2.2 Test bKash Send Money

1. Checkout → **bKash Send Money**
2. Send exact order total to `01887848304` from bKash app
3. Enter TrxID → Place order
4. Admin → **Verify Payment** queue (dashboard card or filter)
5. Match TrxID in bKash app → click **Confirm payment**
6. Order should become `paid` + `confirmed`

### 2.3 Test Nagad Send Money

Repeat with Nagad number `01979614216`.

**Step 2 done when:** Both wallet methods create orders and admin can confirm payment.

See also: [phase2-payments-checklist.md](./phase2-payments-checklist.md)

---

## Step 3 — bKash Online API (Tokenized Checkout)

Requires credentials from **bKash merchant portal** (not the Send Money personal number).

### 3.1 Sandbox test (preview/staging only)

```env
VITE_PREPAID_ENABLED=true
BKASH_USERNAME=<sandbox>
BKASH_PASSWORD=<sandbox>
BKASH_APP_KEY=<sandbox>
BKASH_APP_SECRET=<sandbox>
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
PREPAID_CALLBACK_URL=https://<preview-domain>/api/prepaid-callback
```

Production **blocks** sandbox URLs automatically.

### 3.2 Production go-live

```env
VITE_PREPAID_ENABLED=true
BKASH_USERNAME=<live>
BKASH_PASSWORD=<live>
BKASH_APP_KEY=<live>
BKASH_APP_SECRET=<live>
BKASH_BASE_URL=https://checkout.pay.bka.sh/v1.2.0-beta
PREPAID_CALLBACK_URL=https://www.shisfashion.com/api/prepaid-callback
```

Redeploy. Confirm:

```bash
npm run verify:launch -- --production
```

### 3.3 Test flow

1. Checkout shows **bKash (Online)** (only if `/api/prepaid-config` returns `bkashOnline: true`)
2. Place order → redirect to bKash → pay
3. Return to `/order-success?orderId=…&prepaid=1`
4. Admin: `paymentStatus: paid`, optional bKash TrxID

**Step 3 done when:** One live bKash Online payment completes end-to-end.

See also: [phase2b-bkash-api-checklist.md](./phase2b-bkash-api-checklist.md)

---

## Step 4 — Payment ops polish (in code)

Already shipped:

| Feature | Where |
|---------|--------|
| **Verify Payment** dashboard card | Admin summary → jumps to payment queue |
| **Payment queue filters** | Orders → All / Verify payment / Paid online / Unpaid COD |
| **Wallet verification banner** | Amber alert when TrxID orders waiting |
| **Payment badges** | Each order card shows method + status |
| **Confirm payment** | Sets `paid`, moves `new` → `confirmed`, ops webhook, customer notify |
| **`/api/confirm-order-payment`** | Server-side confirm with audit fields |

### 4.1 Optional: ops webhook

Set in Vercel (server):

```env
INCIDENT_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

You'll get Slack/Discord alerts for:

- New wallet orders (TrxID to verify) — from `create-order`
- Payment confirmed by admin — from `confirm-order-payment`

### 4.2 Daily admin workflow

1. Open Admin → check **Verify Payment** count
2. Open bKash/Nagad app → match TrxID + amount
3. Click **Confirm payment** → order auto-confirms
4. Process **New Orders** (COD) → mark Confirmed manually

**Step 4 done when:** You can clear the wallet queue from admin in under 1 minute per order.

---

## Quick reference

| Step | Enable flag | Needs credentials |
|------|-------------|-------------------|
| 1 COD | `VITE_PREPAID_ENABLED=false` | Firebase + Cloudinary |
| 2 Wallet | `VITE_MOBILE_WALLET_PAYMENTS_ENABLED=true` | Merchant numbers only |
| 3 bKash API | `VITE_PREPAID_ENABLED=true` | bKash Tokenized Checkout API |
| 4 Ops | (always on) | Optional `INCIDENT_ALERT_WEBHOOK_URL` |

## Go / No-Go

**GO** after Step 1 minimum (COD). Add Step 2 before promoting wallet payments. Add Step 3 only with live bKash API credentials.

**NO-GO** if checkout 500, orders missing in Firestore, or admin cannot sign in.
