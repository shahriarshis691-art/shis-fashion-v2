# Firestore Permission Fix for Checkout Orders

If checkout shows `Missing or insufficient permissions`, your Firestore rules are blocking public order creation.

## What was added in code

- Checkout now shows a clear fallback support message when Firestore returns `permission-denied`.
- Rules template added: [firestore.rules](../firestore.rules)

## Required action (one-time)

You must deploy Firestore rules to your Firebase project.

## Recommended rules behavior

- Public users: can `create` documents in `orders` only.
- Signed-in admin users: can read/update/delete orders.
- Storefront collections (`products`, `categories`, `settings/homepage`) are readable publicly.

## Deploy steps

1. Install Firebase CLI if needed:
   - `npm i -g firebase-tools`
2. Login:
   - `firebase login`
3. Initialize firestore config if not already done:
   - `firebase init firestore`
4. Replace generated rules with [firestore.rules](../firestore.rules)
5. Deploy rules:
   - `firebase deploy --only firestore:rules`

## Verify

1. Open checkout and place a test order.
2. Confirm no permission error is shown.
3. Check Firestore `orders` collection for the new document.

## Important

- Without deploying rules, frontend code alone cannot bypass Firestore security.
- Keep rules minimal and review with your production security needs.
