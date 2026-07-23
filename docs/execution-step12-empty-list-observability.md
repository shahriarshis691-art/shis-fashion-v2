# Step 12 - Empty Listing Observability

Date: 2026-07-24
Status: Started
Depends on:
- execution-step11-query-normalization-observability.md

## Goal

Detect and quantify zero-result listing states across strict segment/subcategory routes so taxonomy or filter regressions can be triaged quickly.

## Implemented in this slice

1. Added analytics event `listing_empty_state` in shop listing page.
2. Event fires only when listing has zero visible products.
3. Added dedupe guard so unchanged empty state does not repeatedly emit.
4. Event payload includes:
- segment
- subcategory
- sort
- in_stock_only
- new_only
- path
- search

## Why this matters

1. Helps distinguish real no-inventory cases from mapping or query issues.
2. Gives launch-week visibility into problematic routes and filters.
3. Complements query normalization telemetry from Step 11.

## Acceptance targets

1. Empty listing state emits exactly once per stable route/filter state.
2. Non-empty listing state does not emit this event.
3. Existing item-list and funnel analytics remain unchanged.
