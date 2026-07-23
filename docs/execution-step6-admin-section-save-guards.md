# Step 6 - Admin Section Save Guards

Date: 2026-07-24
Status: Started
Depends on:
- execution-step3-implementation-checklist.md
- execution-step5-listing-query-engine-strict.md

## Goal

Prevent invalid section configurations from being published by enforcing
route and image rules at save time in admin.

## Implemented in this slice

1. Added save-time route validators for each section key:
- women: /women or /women?sub=<slug>
- men: /men or /men?sub=<slug>
- kids: /kids or /kids?sub=<slug>
- western: /women?sub=tunic
- sale: /sale
- new-arrivals: /shop/new-arrivals or /new-arrivals

2. Added required image guard:
- If a section is enabled, cover image must be present.

3. Save behavior:
- On validation failure, save is blocked.
- Error message is shown via admin message + toast.

## Why this matters

1. Prevents broken category routes from being pushed live.
2. Prevents enabled sections from showing missing image tiles.
3. Keeps section click -> exact listing flow stable.

## Remaining for Step 6 completion

1. Add inline helper text in section editor for allowed route format.
2. Add route smoke checklist execution notes.
3. Verify admin validation with manual checks in shared browser.

## Acceptance targets

1. Invalid section route cannot be saved.
2. Enabled section without cover image cannot be saved.
3. Valid section changes save and reflect on storefront.
