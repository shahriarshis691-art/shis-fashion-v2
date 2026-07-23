# Step 3 - Implementation Checklist

Date: 2026-07-24
Status: In Progress
Depends on:
- execution-step1-user-flow-lock.md
- execution-step2-data-schema-mapping-lock.md

## Completed in this slice

1. Added key-based homepage section schema support in service layer.
2. Added normalization and backfill pipeline for categorySections.
3. Kept legacy shopByCategories compatibility during transition.
4. Switched homepage category strip rendering to key-based categorySections.
5. Added admin-side section-wise editor foundation:
- independent section label edit
- independent section route edit
- independent section order edit
- independent section image edit and upload
- section visibility toggle

## In Progress

1. Strict validation for section href and required cover image on enabled sections.
2. Section gallery images manager (multi-image controls per section).
3. Full migration of legacy shopByCategories admin panel and cleanup.

## Next implementation order

1. Add section-level validation helper in admin save flow.
2. Add gallery image slot controls per section (add/remove/select cover).
3. Enforce exact listing filter assertions for section + subcategory routes.
4. Add QA checks for URL-refresh-back consistency.
5. Remove dependency on index-based shopByCategories in admin UI.

## Acceptance checks for this phase

1. Category label-image-link mismatch does not occur from structure.
2. Men/Women/Kids/Western/Sale/New Arrivals can be edited independently.
3. Section save reflects correctly on homepage strip.
4. Section click opens expected listing context.
5. Product card click still navigates to product detail page.
