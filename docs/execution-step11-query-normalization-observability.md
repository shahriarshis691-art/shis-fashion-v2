# Step 11 - Query Normalization Observability

Date: 2026-07-24
Status: Started
Depends on:
- execution-step5-listing-query-engine-strict.md
- execution-step10-soft-launch-telemetry.md

## Goal

Make strict listing URL corrections observable in analytics so route issues can be detected quickly during stabilization.

## Implemented in this slice

1. Added event: `listing_query_normalized` in shop listing canonicalization flow.
2. Event fires only when URL is rewritten with replace navigation.
3. Event payload includes:
- reason
- from_path
- from_search
- to_path
- to_search
- segment
- subcategory

## Normalization reasons tracked

1. legacy-segment-route
2. legacy-subcategory-route
3. segment-query-canonicalization
4. invalid-sub-for-segment
5. legacy-sub-to-canonical-sub
6. mixed-query-canonicalization

## Why this matters

1. Detects how often users hit legacy or malformed listing URLs.
2. Helps prioritize redirects and link-cleanup tasks.
3. Improves confidence in strict listing engine behavior post-launch.

## Acceptance targets

1. Every canonical rewrite path emits one normalization event.
2. No event emitted when URL is already canonical.
3. Existing listing behavior and navigation remain unchanged.
