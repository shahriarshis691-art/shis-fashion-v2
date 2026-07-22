# SHIS Re-Design Step 1: Brand Direction + UX Blueprint

Date: 2026-07-23
Priority: Mobile-first
Reference Direction: Aarong-inspired minimal commerce experience

## 1) Brand Direction Lock

### Core Visual Direction (Locked)
- Background: Pure white or near-white surfaces only.
- Typography: Black-first text hierarchy with subtle grayscale support text.
- Product presentation: Cardless product grid/listing (no heavy tiles, no boxed cards).
- Storytelling: Image-first page rhythm with editorial spacing and minimal UI chrome.

### Brand Personality
- Quiet premium
- Cultural-modern
- Trustworthy and practical for mobile shopping
- Clear, non-flashy, product-focused

### Interaction Tone
- Fewer UI effects, more content clarity
- Fast tap targets, low cognitive load
- Clear section labels and intentional whitespace

## 2) IA Lock

### Primary Navigation (Mobile and Desktop)
- Women
- Men
- Kids
- Sale
- New Arrivals

### Core Commerce Flow (Locked)
- Category
- Listing
- Details
- Bag
- Checkout

## 3) Final Sitemap (v1 Locked)

```mermaid
flowchart TD
  A[/] --> B[Women]
  A --> C[Men]
  A --> D[Kids]
  A --> E[Sale]
  A --> F[New Arrivals]

  B --> B1[Category]
  C --> C1[Category]
  D --> D1[Category]
  E --> E1[Listing]
  F --> F1[Listing]

  B1 --> L[Listing]
  C1 --> L
  D1 --> L
  L --> P[Product Details]
  P --> G[Bag]
  G --> H[Checkout]
  H --> I[Order Success]
```

###+ Root
- /

###+ Main nav destinations
- /women
- /men
- /kids
- /sale
- /new-arrivals

###+ Category-level routes
- /women/:categorySlug
- /men/:categorySlug
- /kids/:categorySlug

###+ Product listing states
- /women/:categorySlug?sort=&size=&color=&price=
- /men/:categorySlug?sort=&size=&color=&price=
- /kids/:categorySlug?sort=&size=&color=&price=
- /sale?sort=&size=&color=&price=
- /new-arrivals?sort=&size=&color=&price=

###+ Product details
- /shop/:categorySlug/:productSlug

###+ Bag + Checkout
- /cart
- /checkout
- /order-success

###+ Utility pages (existing)
- /brands
- /about
- /contact
- /privacy
- /terms

## 4) Wireframe Notes (Mobile-First)

### A) Home / Entry
- Header:
  - Left: brand mark
  - Right: search, bag count, menu
- Hero:
  - Full-width image/video first
  - 1 primary CTA only (Shop Now)
  - Optional secondary text line, no clutter
- Quick links row:
  - Women, Men, Kids, Sale, New Arrivals as horizontal chips
- Story band:
  - Editorial image + short copy block
- Product highlight strips:
  - New Arrivals strip
  - Sale strip
  - Each item image-dominant and cardless
- Sticky mobile bottom action:
  - Bag shortcut + contextual CTA (optional)

### B) Category Page
- Top row:
  - Category title + product count
  - Filter + sort actions
- Listing mode:
  - 2-column mobile image-first grid
  - Cardless: no full bordered container around each product
  - Product text under image: name, price, quick stock state
- Infinite/Load more:
  - Progressive loading with preserved scroll position

### C) Product Details Page
- Gallery first:
  - Swipeable image stack
  - Zoom-capable image
- Key purchase block:
  - Product name, price, size, color, quantity
  - Add to Bag sticky action visible in first viewport
- Trust blocks:
  - Delivery, return/exchange, support
- Related products strip:
  - Same category / similar style

### D) Bag
- Line items:
  - Thumb image + variant + quantity controls
- Summary:
  - Subtotal, shipping hint, total
- Actions:
  - Continue shopping
  - Proceed to checkout (primary)

### E) Checkout
- Step order:
  - Contact
  - Delivery address
  - Shipping method
  - Payment method
  - Review + place order
- Mobile rules:
  - Single-column only
  - Sticky order summary CTA area
  - Inline validation and clear field labels

## 5) Design Ruleset (Execution Rules)

### Layout + Spacing
- Mobile-first breakpoints from 320px and up.
- Use consistent vertical rhythm (8px base scale).
- Keep section gutters narrow on mobile for image emphasis.

### Typography
- Black-first hierarchy for headings/body.
- Serif display for major hero/section titles.
- Sans body for product info and controls.
- Tight heading line-height; relaxed body line-height.

### Color System
- Primary background: white/off-white.
- Primary text: black/near-black.
- Accent: restrained earthy tone for CTA emphasis only.
- Borders: subtle, low-contrast neutrals.

### Product Presentation
- No heavy card containers around products.
- Image occupies visual priority over text.
- Product metadata kept concise (name, price, status).

### Components
- Buttons:
  - Primary: solid high-contrast
  - Secondary: outlined/light surface
- Chips/filters:
  - Rounded, compact, clearly active/inactive
- Inputs:
  - Large tap-friendly height
  - Clear focus ring and error states

### Motion
- Minimal motion only where it adds orientation:
  - Page fade/slide on route change
  - Subtle image reveal
- Avoid decorative motion that delays shopping actions.

### Accessibility + Performance
- Minimum tap target: 44x44.
- Contrast compliant for text and controls.
- LCP target: hero visual optimized and prioritized.
- Lazy-load below-the-fold media.

## 6) Success Metrics Definition

### KPI 1: Mobile CTR
- Definition: Percentage of mobile sessions that tap a primary commerce CTA.
- Formula:
  - Mobile CTR = (Mobile CTA clicks / Mobile sessions) * 100
- Primary CTA set:
  - Shop now
  - Category quick links
  - Product open from listing

### KPI 2: Add-to-Bag Rate
- Definition: Percentage of PDP visits that trigger Add to Bag.
- Formula:
  - Add-to-Bag Rate = (Add-to-bag events / PDP sessions) * 100

### KPI 3: Checkout Completion
- Definition: Percentage of checkout starts that reach order success.
- Formula:
  - Checkout Completion = (Order success sessions / Checkout start sessions) * 100

### Measurement Windows
- Baseline window: 14 days before redesign launch
- Evaluation window: 14 days after redesign launch
- Segment always by device: mobile first, desktop secondary

## 7) Implementation Guardrails For Next Steps
- Do not reintroduce visually heavy product cards.
- Do not exceed 2 major CTAs in first viewport on mobile.
- Preserve flow integrity: Category -> Listing -> Details -> Bag -> Checkout.
- Any new section must support the three KPIs above.

## 8) Approval Checkpoint
Step 1 is ready for approval if:
- Brand direction remains white/black, image-first, cardless.
- IA exactly follows Women/Men/Kids/Sale/New Arrivals and locked commerce flow.
- Metrics are instrumentable using current analytics events and route tracking.
