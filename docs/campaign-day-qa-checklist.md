# Campaign Day QA Checklist (Meta + GA4)

Date: 2026-07-27
Audience: Launch operator, marketer, and one engineer
Goal: Confirm conversion tracking and checkout flow are healthy before ad spend starts.

## 1. Preflight (5 minutes)

1. Confirm latest deploy is live on production domain.
2. Confirm environment values are set in production:
- VITE_META_PIXEL_ID
- VITE_GA_MEASUREMENT_ID
- VITE_LAUNCH_MODE=false
- VITE_ALLOW_LOCAL_FALLBACK=false
3. Confirm soft launch mode is intentional:
- VITE_SOFT_LAUNCH_MODE and SOFT_LAUNCH_MODE are set as planned
- If running full public launch, both should be off
4. Open tools before testing:
- Meta Events Manager -> Test Events
- GA4 -> DebugView (or Realtime as fallback)
5. Use one fresh browser session (incognito/private) for test flow.

## 2. Required Shopper Flow (10 minutes)

Run this exact path on production:

1. Homepage load
2. Search for a product from navbar
3. Open one product detail page
4. Select size and quantity
5. Click Add to Bag
6. Open cart and click Checkout
7. Fill checkout form with valid Bangladesh phone format: 01XXXXXXXXX
8. Place order
9. Land on order success page

## 3. Event Expectations (must pass)

Meta Test Events must show:

1. PageView
2. Search
3. ViewContent
4. AddToCart
5. InitiateCheckout
6. Purchase

GA4 DebugView must show:

1. page_view
2. search
3. view_item
4. add_to_cart
5. begin_checkout
6. purchase

## 4. Payload Spot Checks (must pass)

1. Currency is BDT for commerce events.
2. Purchase value is greater than 0.
3. Product IDs are present in ViewContent/AddToCart/InitiateCheckout/Purchase.
4. Transaction ID exists on GA4 purchase.
5. Purchase fires once per completed order.

## 5. Storefront Behavior Checks (must pass)

1. Add to Bag can be clicked multiple times on:
- Product detail page
- Collection listing page
2. Cart checkout button routes to checkout without error.
3. Checkout submit does not fail for valid required fields.
4. Order success page shows order recap.

## 6. SEO and Crawl Safety Checks (must pass)

1. robots.txt is reachable and includes:
- Disallow: /admin
- Disallow: /shis-admin
2. Admin URLs should not be publicly indexed.
3. Canonical URL exists on main storefront routes.

## 7. Go / No-Go Rules

GO only if all are true:

1. All six Meta funnel events appear in Test Events during one full purchase journey.
2. All six GA4 funnel events appear in DebugView/Realtime.
3. Purchase event arrives with correct value and no duplicates.
4. Checkout and order success flow completes without console/runtime errors.

NO-GO if any are true:

1. Missing Purchase or InitiateCheckout in Meta.
2. Missing begin_checkout or purchase in GA4.
3. Checkout completes but no conversion events are recorded.
4. Add to Bag is blocked after first click on a page.

## 8. If No-Go, Immediate Actions

1. Pause Meta campaigns.
2. Capture timestamps and test browser used.
3. Record exact failed step and missing event.
4. Verify production env vars and redeploy if needed.
5. Re-run this checklist from a new private session.

## 9. Post-Launch Monitoring (first 60 minutes)

1. Check Meta events every 10 minutes for:
- InitiateCheckout frequency
- Purchase frequency
2. Check GA4 Realtime for sustained funnel flow.
3. Check order creation volume in admin panel.
4. If conversions drop to zero while traffic continues, pause ads and investigate immediately.

## 10. Evidence Log Template

Copy this section into launch notes:

- Date/time window:
- Tester name:
- Environment/deployment URL:
- Meta events seen:
- GA4 events seen:
- Purchase value and transaction ID verified:
- Result: GO or NO-GO
- Notes/issues:
