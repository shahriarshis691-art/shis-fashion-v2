# Step 4 - Exact Listing Hardening

Date: 2026-07-24
Status: In Progress
Depends on:
- execution-step1-user-flow-lock.md
- execution-step2-data-schema-mapping-lock.md
- execution-step3-implementation-checklist.md

## Goal

Enforce exact section and subcategory listing behavior for all supported route shapes,
including legacy query/slug values, while preserving backward compatibility.

## Started in this slice

1. Shop listing now canonicalizes query subcategory values before filtering.
2. Legacy query values (example: western-outfits) normalize to canonical sub (tunic).
3. Segment pages now auto-normalize URL query state to canonical sub slug using replace navigation.
4. Invalid sub query on segment pages is removed from URL instead of silently mixing result states.

## Why this matters

1. Prevents label/link showing one intent while filters run on another value.
2. Keeps URL-refresh-back behavior deterministic.
3. Strengthens exact listing guarantee from section click to product selection.

## Remaining for Step 4

1. Add save-time validation for section links in admin category section editor.
2. Add section image requirement validation for enabled sections.
3. Add lightweight route smoke checklist for:
- /women?sub=tunic
- /women?sub=western-outfits
- /men?sub=mens-shirt
- /shop/western
4. Confirm no cross-category bleed for all submenu routes.

## Acceptance targets

1. Section/subcategory URLs always resolve to canonical filter state.
2. Listing shows only matching products for section + subcategory.
3. Clicking product card still opens correct product detail page.
4. Refresh/back retains exact listing context.
