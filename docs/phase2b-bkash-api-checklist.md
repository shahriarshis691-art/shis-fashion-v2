# Phase 2B — bKash Tokenized Checkout (API)

Automated bKash redirect checkout. Manual Send Money + TrxID (Phase 2A) can stay enabled at the same time.

## What ships in code

| Piece | Role |
|-------|------|
| `api/_prepaidProvider.ts` | Grant token, create checkout, execute payment |
| `api/prepaid-callback.ts` | bKash return URL — execute payment, mark paid, restore stock on cancel/fail |
| `api/prepaid-config.ts` | GET — tells checkout if server credentials are live |
| `api/order-confirmation.ts` | POST `{ orderId }` — success page fallback after bKash redirect |
| Checkout | Shows **bKash (Online)** only when `VITE_PREPAID_ENABLED=true` **and** server is configured |
| Admin | **Confirm payment** for manual wallet orders (`pending_verification`) |

## Vercel environment

### Client (build-time)

```env
VITE_PREPAID_ENABLED=true
VITE_MOBILE_WALLET_PAYMENTS_ENABLED=true
```

Keep manual wallet numbers as in Phase 2A:

```env
VITE_BKASH_MERCHANT_NUMBER=01887848304
VITE_NAGAD_MERCHANT_NUMBER=01979614216
```

### Server (runtime — from bKash merchant portal)

```env
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_BASE_URL=https://checkout.pay.bka.sh/v1.2.0-beta
PREPAID_CALLBACK_URL=https://www.shisfashion.com/api/prepaid-callback
```

**Important:** Production refuses sandbox URLs (`tokenized.sandbox.bka.sh`). Use the live base URL from bKash.

Optional SSLCommerz (same provider module, lower priority if bKash vars are set):

```env
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_BASE_URL=
SSLCOMMERZ_VALIDATION_URL=
```

## Enable checklist

1. Obtain bKash Tokenized Checkout credentials (sandbox first, then live).
2. Set all `BKASH_*` vars in Vercel **Production** (server env, not `VITE_`).
3. Set `PREPAID_CALLBACK_URL` to your production domain + `/api/prepaid-callback`.
4. Set `VITE_PREPAID_ENABLED=true` and redeploy.
5. Run `npm run verify:launch -- --production` — must pass prepaid checks.
6. Deploy Firestore indexes if not already: `firebase deploy --only firestore:indexes`.

## Sandbox test flow

1. Use sandbox credentials and `BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta`.
2. `VITE_PREPAID_ENABLED=true` in preview/dev only (production build blocks sandbox).
3. Place a test order → **bKash (Online)** → complete sandbox payment.
4. Confirm redirect to `/order-success?orderId=…&prepaid=1`.
5. Admin order: `paymentStatus: paid`, optional `paymentTransactionId` from bKash.
6. Cancel/fail path: stock restored, order `cancelled`, checkout shows prepaid error banner.

## Go-live test (production)

1. Switch to live `BKASH_*` and live `BKASH_BASE_URL`.
2. One real small-value order end-to-end.
3. Confirm Meta/GA **Purchase** event on success page.
4. Confirm ops webhook / customer notify if configured.

## Payment method labels

| Checkout option | Stored `paymentMethod` | Flow |
|-----------------|------------------------|------|
| bKash Send Money | `bKash Send Money` | Manual TrxID, admin confirms |
| bKash (Online) | `bKash` | API redirect, auto `paid` |
| Nagad Send Money | `Nagad Send Money` | Manual TrxID |
| COD | `Cash on Delivery` | Pay on delivery |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| bKash (Online) hidden | `VITE_PREPAID_ENABLED`, `/api/prepaid-config` returns `bkashOnline: true` |
| 502 on place order | Server logs — token/create failed; credentials or base URL |
| Return to checkout `prepaid=failed` | Execute step failed; stock restored |
| Success page empty | `order-confirmation` API; order must exist and be recent (48h) |
| Sandbox in production | `getConfiguredPrepaidProvider()` returns null — fix `BKASH_BASE_URL` |

## Related docs

- [phase2-payments-checklist.md](./phase2-payments-checklist.md) — manual wallet
- [phase1-launch-checklist.md](./phase1-launch-checklist.md) — COD launch gate
