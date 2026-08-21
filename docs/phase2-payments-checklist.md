# Phase 2 — Mobile Wallet Payments (bKash + Nagad)

Manual **Send Money** checkout for Bangladesh wallets. Customers pay to your merchant numbers and submit the TrxID at checkout.

## Merchant numbers (configured)

| Wallet | Number | Env var |
|--------|--------|---------|
| bKash | `01887848304` | `VITE_BKASH_MERCHANT_NUMBER` |
| Nagad | `01979614216` | `VITE_NAGAD_MERCHANT_NUMBER` |

Defaults are baked into the app; override in Vercel if numbers change.

## Vercel environment

```env
VITE_MOBILE_WALLET_PAYMENTS_ENABLED=true
VITE_BKASH_MERCHANT_NUMBER=01887848304
VITE_NAGAD_MERCHANT_NUMBER=01979614216
VITE_PREPAID_ENABLED=false
```

Keep `VITE_PREPAID_ENABLED=false` unless bKash Tokenized Checkout API credentials are configured — see [phase2b-bkash-api-checklist.md](./phase2b-bkash-api-checklist.md).

## Customer flow

1. Checkout → choose **bKash Send Money** or **Nagad Send Money**
2. Send exact order total to the shown merchant number
3. Enter **TrxID** from the wallet app
4. Place order → success page (payment `pending_verification`)
5. Admin verifies TrxID in bKash/Nagad app → confirms order in dashboard

## Admin verification

1. Open **Admin → Orders**
2. Find orders with `paymentStatus: pending_verification`
3. Match **TrxID** and amount in bKash (`01887848304`) or Nagad (`01979614216`)
4. Mark order **Confirmed** after payment matches

Ops webhook (if configured) sends a Slack-style alert with order ID, method, TrxID, and amount.

## Stock & security

- Inventory is **reserved immediately** when the order is placed (same as COD)
- Duplicate TrxIDs are rejected server-side
- Server recalculates price from Firestore (client total is not trusted)

## API prepaid (optional — Phase 2b)

For automated bKash checkout redirect (requires merchant API keys):

```env
VITE_PREPAID_ENABLED=true
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_BASE_URL=https://checkout.pay.bka.sh/v1.2.0-beta
PREPAID_CALLBACK_URL=https://www.shisfashion.com/api/prepaid-callback
```

Sandbox URLs are **blocked in production** automatically.

## Test checklist

- [ ] bKash Send Money order with valid TrxID → Firestore order with `pending_verification`
- [ ] Nagad Send Money order with valid TrxID
- [ ] Duplicate TrxID rejected with clear error
- [ ] Admin dashboard shows TrxID
- [ ] COD flow still works unchanged
- [ ] Meta Pixel / GA4 `Purchase` fires on success page

## Manual test (staging/production)

Use a small real Send Money payment (৳10–50 test product) and verify TrxID in admin before enabling on live catalog.
