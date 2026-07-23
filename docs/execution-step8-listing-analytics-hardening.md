# Step 8 - Listing Analytics Hardening

Date: 2026-07-24
Status: Started
Depends on:
- redesign-step8-performance-seo-analytics.md
- execution-step5-listing-query-engine-strict.md

## Goal

Improve analytics visibility for listing routes so section/subcategory performance can be measured after strict query normalization.

## Implemented in this slice

1. Added GA4 `view_item_list` support in analytics service.
2. Added listing impression tracking in shop listing page.
3. Listing event payload now includes canonical list context:
- item_list_id: `<segment>:<subcategory>`
- item_list_name: active listing heading
- items: up to first 12 visible products with id, name, category, and price

## Why this matters

1. Confirms strict route logic is observable in analytics.
2. Makes section/subcategory listing quality measurable.
3. Helps detect route-mapping regressions via funnel breakdown.

## Remaining for Step 8 completion

1. Add optional dedupe guard per canonical route state if event volume is too high.
2. Validate events in GA4 DebugView for women/men/kids/western routes.
3. Add a short QA checklist for analytics verification after admin section edits.

## Acceptance targets

1. Shop listing pages emit `view_item_list` with canonical route context.
2. Event payload maps to the visible product set.
3. Existing `view_item`, `add_to_cart`, `begin_checkout`, and `purchase` events stay unchanged.
