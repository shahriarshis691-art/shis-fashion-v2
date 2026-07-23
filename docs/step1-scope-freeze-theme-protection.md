# Step 1 - Scope Freeze (Theme Protection)

Purpose: Preserve the currently approved visual theme exactly while adding new navigation/category features.

## Baseline Snapshot

- Baseline commit: 96287d5b8a06b674b522f1dd10af3e5e2c6dde1b
- Branch: main
- Working tree at snapshot: clean

## Theme-Critical Files (Protected)

The following files are considered visual-theme protected and must keep approved look-and-feel:

- src/components/layout/Navbar.tsx
- src/pages/HomePage.tsx
- src/components/layout/Footer.tsx
- src/components/shop/ProductCard.tsx
- src/pages/ShopPage.tsx
- src/pages/ShopCategoryPage.tsx
- src/styles/design-system.css
- src/index.css

## Freeze Rules

1. Do not change global typography scale or font family tokens unless explicitly approved.
2. Do not change core color tokens or brand contrast values.
3. Do not change default spacing rhythm, section paddings, or card/button visual language.
4. Do not remove or alter existing animations that define the approved theme identity.
5. Keep navbar approved visual state (height, padding, icon sizing, transparency, border/shadow behavior).

## Allowed in Future Steps

1. Add category hierarchy data/mapping logic.
2. Add route-level behavior for Category -> Subcategory -> Listing flow.
3. Add submenu/accordion behaviors while preserving existing visual appearance.
4. Add filter/query wiring improvements without redesigning visual style.

## Non-Negotiable Constraints

- No backend logic change
- No database schema change
- No API change
- No authentication change
- No CRUD flow change
- No routing breakage

## Step 1 Acceptance Checklist

- [x] Baseline commit recorded
- [x] Protected visual files listed
- [x] Scope boundaries documented
- [x] Functional constraints documented

## Next Step (Step 2)

Create finalized category/subcategory taxonomy and slug mapping table without visual redesign.
