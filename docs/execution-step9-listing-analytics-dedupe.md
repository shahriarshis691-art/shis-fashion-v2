# Step 9 - Listing Analytics Dedupe

Date: 2026-07-24
Status: Started
Depends on:
- execution-step8-listing-analytics-hardening.md

## Goal

Prevent repeated `view_item_list` analytics spam for unchanged listing states while preserving meaningful impression tracking.

## Implemented in this slice

1. Added in-page dedupe state for listing impression events.
2. Dedupe key now uses:
- canonical list id (`segment:subcategory`)
- first 12 visible product ids
3. If listing state key is unchanged, GA4 `view_item_list` is skipped.
4. When listing becomes empty, dedupe state resets.

## Why this matters

1. Reduces noisy repeated list impression events.
2. Keeps analytics cleaner for section/subcategory performance analysis.
3. Preserves event emission when list context actually changes.

## Acceptance targets

1. Same canonical listing state does not repeatedly emit `view_item_list`.
2. Changing section, subcategory, or visible products emits a new event.
3. Existing checkout and purchase analytics behavior remains unchanged.
