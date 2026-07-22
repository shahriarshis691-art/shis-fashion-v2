# SHIS Re-Design Step 4: Listing Experience (PLP)

Date: 2026-07-23
Status: Implemented

## Delivered
- Cardless PLP grid with edge-to-edge product imagery and minimal metadata (name + price only).
- Mobile filter/sort bottom-sheet UX with:
  - Sort: Popular, New, Price low-high, Price high-low
  - Filters: In stock only, New arrivals only
- Separate category listing pages via dedicated routes:
  - /women
  - /men
  - /kids
- Legacy compatibility maintained for existing /shop/:slug category URLs.

## Updated Files
- src/pages/ShopPage.tsx
- src/components/shop/ProductCard.tsx
- src/router.tsx
- src/components/layout/Navbar.tsx
- src/pages/HomePage.tsx

## UX Notes
- Mobile-first PLP control model prioritizes thumb reach and low-friction filtering.
- Desktop keeps inline sorting while mobile uses bottom sheet.
- Category navigation is now explicit and segment-first.
