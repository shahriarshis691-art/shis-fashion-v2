# Step 1 - User Flow Lock (Execution Baseline)

Date: 2026-07-24
Status: Locked for implementation
Owner: Storefront + Admin

## 1) Primary Goal

Each section or subcategory click must open only exact related product listing.
From listing, user can select a product card and navigate to product details.
No cross-category product bleed is allowed.

## 2) Locked Customer Journeys

### Journey A: Top Navigation to Listing
1. User opens storefront home page.
2. User clicks one top section: Women or Men or Kids or Sale or New Arrivals.
3. System opens related listing page with section context.
4. Listing shows only products that match the section filter.

### Journey B: Section Submenu to Exact Subcategory Listing
1. User opens Women or Men submenu.
2. User clicks one subcategory item (example: Women > Tunic, Men > Shirts).
3. System opens listing with section + subcategory filter pre-applied.
4. Listing shows only matched products for that exact filter.

### Journey C: Listing to Product Detail
1. User clicks a product card from filtered listing.
2. System opens product details page for that selected product.
3. Back navigation returns user to the same filtered listing state.

## 3) Locked Route Contract

### Section Listing
- /shop
- /women
- /men
- /kids
- /sale
- /new-arrivals

### Exact Subcategory Listing (query-based)
- /women?sub=<subcategory>
- /men?sub=<subcategory>
- /kids?sub=<subcategory>

### Product Details
- /shop/:category/:productSlug

## 4) Locked Filtering Rules

1. Section filter is mandatory when section path is used.
2. Subcategory filter is additive, not replacing section context.
3. Product appears only if:
- product matches section alias map, and
- product matches selected subcategory alias map.
4. If no products match, show empty state message. Do not inject other category products.

## 5) Taxonomy Lock for Exact Matching

### Women
- kurti
- tops
- shirts
- denim
- saree
- tunic
- accessories

### Men
- shirts
- polos
- panjabi
- oversized-tee
- t-shirts
- denim
- pants
- jackets
- accessories

### Kids
- kids

Legacy values must resolve through alias mapping to the canonical slugs above.

## 6) Navigation and State Lock

1. Listing sort/filter UI may change order, but cannot change section scope silently.
2. URL must always reflect current section and subcategory context.
3. Refresh on listing page must preserve same listing result from URL.
4. Browser back must preserve filtered listing context after detail page.

## 7) Admin Editability Lock (Easy Edit Model)

Each major section must have independent edit controls.

### Men
- Edit label
- Edit route link
- Add or replace cover image
- Add or remove gallery images
- Save only Men section

### Women
- Same controls as Men

### Kids
- Same controls as Men

### Western, Sale, New Arrivals
- Same controls as Men

## 8) Acceptance Criteria (Must Pass)

1. Clicking each section opens only exact related listing products.
2. Clicking each subcategory opens only exact subcategory products.
3. Listing to product details works for all sections.
4. No unrelated products appear in any filtered listing.
5. URL, refresh, and back behavior remain consistent.
6. Mobile and desktop behavior are functionally identical.

## 9) Out of Scope for Step 1

1. Visual redesign.
2. SEO content rewrite.
3. Checkout logic changes.

## 10) Ready Signal for Step 2

Step 2 can start after product, design, and admin owners confirm this lock without changes.
