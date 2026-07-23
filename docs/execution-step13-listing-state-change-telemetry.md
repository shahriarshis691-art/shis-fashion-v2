# Step 13 - Listing State Change Telemetry

Date: 2026-07-24
Status: Started
Depends on:
- execution-step12-empty-list-observability.md

## Goal

Track meaningful listing-state transitions so navigation and filter behavior can be analyzed during stabilization.

## Implemented in this slice

1. Added analytics event `listing_state_changed` in shop listing page.
2. Event tracks canonical state dimensions:
- segment
- subcategory
- sort
- in_stock_only
- new_only
- path
- search
3. Added dedupe guard by snapshot key.
4. Initial render state is skipped to reduce startup noise.

## Why this matters

1. Shows how users move between listing states after strict route normalization.
2. Helps identify sticky filters or confusing subcategory flows.
3. Complements Step 11 and Step 12 telemetry for better diagnosis.

## Acceptance targets

1. State-change event fires only when listing state actually changes.
2. No duplicate spam for unchanged state.
3. Initial listing load does not emit this event.
