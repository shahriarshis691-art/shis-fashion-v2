# Step 7 - Route Smoke Runbook

Date: 2026-07-24
Status: Started
Depends on:
- execution-step5-listing-query-engine-strict.md
- execution-step6-admin-section-save-guards.md

## Goal

Create a fast QA runbook to verify exact section/subcategory listing behavior
before and after admin section updates.

## Added in this slice

1. Admin category section manager now has a Preview button per section.
2. Preview opens the section route in a new tab for quick smoke checks.
3. Invalid preview links are blocked with an in-admin error message.

## Smoke checklist

1. Open admin homepage manager.
2. In Category sections manager, click Preview for each section:
- women
- men
- kids
- western
- sale
- new-arrivals
3. Confirm listing page opens and product grid is visible.
4. Confirm section/subcategory tabs align with route intent.
5. Click one product card from each listing and verify detail page opens.
6. Use browser back and confirm the same listing context is preserved.

## Legacy and strict route checks

1. /women?sub=western-outfits should normalize to canonical tuned route state.
2. /men?sub=mens-shirt should normalize to canonical shirts route state.
3. /shop/western should redirect to women route with tunic subcontext.
4. Invalid segment query (example: /women?segment=men) should be cleaned.

## Completion criteria for Step 7

1. All section preview routes open correctly.
2. No cross-category product bleed in any checked route.
3. Listing to detail navigation works from each section check.
4. Back navigation retains listing context.
