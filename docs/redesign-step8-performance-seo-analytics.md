# Redesign Step 8 - Performance, SEO, and Analytics

## Goal

Launch-ready technical quality for mobile performance, per-page SEO/schema, and conversion funnel analytics.

## Implemented Scope

### 1. Mobile performance tuning

- Added network warm-up hints in [index.html](index.html):
  - preconnect + dns-prefetch for:
    - Google Tag Manager
    - Meta Pixel CDN
    - Cloudinary media host
- Tightened responsive image hints:
  - Added sizes attributes on key mobile images in:
    - [src/pages/HomePage.tsx](src/pages/HomePage.tsx)
    - [src/pages/ProductDetailPage.tsx](src/pages/ProductDetailPage.tsx)
    - [src/pages/CollectionListingPage.tsx](src/pages/CollectionListingPage.tsx)
    - [src/pages/CartPage.tsx](src/pages/CartPage.tsx)
    - [src/pages/OrderSuccessPage.tsx](src/pages/OrderSuccessPage.tsx)
- Preserved lazy loading and async decoding for non-LCP images.

### 2. Schema and metadata per page

Updated [src/utils/seo.ts](src/utils/seo.ts):

- Added WebPage schema for every route in base schema output.
- Added metadata coverage for key segment routes:
  - /women
  - /men
  - /kids
  - /new-arrivals (canonicalized to /shop/new-arrivals)
- Added noindex,nofollow for admin surfaces:
  - /admin
  - /shis-admin/*
- Added breadcrumb support for segment routes and new-arrivals alias.
- Kept product schema generation and dynamic PDP metadata behavior.

### 3. Funnel analytics events

Expanded GA4 tracking in [src/services/googleAnalytics.ts](src/services/googleAnalytics.ts):

- search
- view_item
- add_to_cart
- begin_checkout
- purchase

Wired GA4 and Meta Pixel together across funnel actions:

- Search:
  - [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx)
- View item:
  - [src/pages/ProductDetailPage.tsx](src/pages/ProductDetailPage.tsx)
  - [src/pages/CollectionListingPage.tsx](src/pages/CollectionListingPage.tsx)
- Add to bag:
  - [src/pages/ProductDetailPage.tsx](src/pages/ProductDetailPage.tsx)
  - [src/pages/CollectionListingPage.tsx](src/pages/CollectionListingPage.tsx)
- Begin checkout:
  - PDP Buy Now
  - Collection Buy Now
  - Cart checkout CTAs
  - Checkout page direct entry safety tracking
- Purchase:
  - [src/pages/OrderSuccessPage.tsx](src/pages/OrderSuccessPage.tsx)
  - Added duplicate guard ref to avoid double-fire in strict/dev behavior.

## Image Optimization Rules

Use these rules for all new storefront image work:

1. Always normalize catalog image URLs through media helpers:
   - normalizeCatalogImageUrl(url, width, height)
2. LCP/hero images:
   - loading="eager"
   - fetchpriority="high"
   - decoding="async"
   - sizes="100vw" (or exact responsive intent)
3. Non-critical images:
   - loading="lazy"
   - decoding="async"
   - provide sizes to match layout breakpoints
4. Keep explicit aspect ratios in layout containers to prevent CLS.
5. Keep fallback placeholders on image error handlers.
6. Prefer Cloudinary auto format and quality via existing transformation helpers.

## Validation

- Run lint: npm run lint
- Run production build: npm run build
- Verify no errors before release

## Launch-readiness checklist

- Funnel events visible in GA4 DebugView and Meta test events
- Canonical, OG, Twitter, robots, and JSON-LD present on critical routes
- Admin routes excluded from indexing
- Mobile LCP image path uses eager/high priority with proper sizes
- Product/listing/cart/order-success images carry lazy+sizes where applicable
