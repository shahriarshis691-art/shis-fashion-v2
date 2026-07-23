# Step 5 - Listing Query Engine Strict

Date: 2026-07-24
Status: Started
Depends on:
- execution-step4-exact-listing-hardening.md

## Goal

Make listing query behavior strict and deterministic so each route/query resolves
into one canonical listing context before products are filtered.

## Implemented in this start slice

1. Segment query normalization now accepts legacy values:
- womens -> women
- mens -> men
- kid -> kids

2. Conflicting segment query cleanup:
- If path already defines segment (/women, /men, /kids), query segment is removed.
- If /shop uses invalid segment query, segment query is removed.
- If /shop uses legacy segment query, it is canonicalized in URL.

3. Subcategory strictness remains active from Step 4:
- Legacy sub values canonicalize to taxonomy slug.
- Invalid sub for active segment is removed.
- Legacy /shop/:slug redirects to canonical segment/sub route where possible.

## Strict engine behavior summary

1. Resolve segment from path first.
2. If path has no segment, resolve from canonical query segment.
3. Resolve subcategory via taxonomy canonicalizer.
4. Apply segment filter first, then subcategory filter.
5. Normalize URL to canonical state with replace navigation.

## Remaining for Step 5 completion

1. Add route smoke script/checklist for strict query cases.
2. Add QA assertions for no cross-category bleed.
3. Add admin validation guard so invalid section links cannot be saved.

## Acceptance targets

1. Listing URL always normalizes to canonical segment/sub values.
2. Cross-category product bleed does not occur for strict routes.
3. Empty state appears for no-match routes instead of fallback mixing.
4. Listing to product detail flow remains unchanged and stable.
