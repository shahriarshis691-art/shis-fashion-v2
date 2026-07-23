# Step 4 - Taxonomy Alignment Implementation (In Progress)

Goal: Align category behavior across admin input, static datasets, and listing filters while keeping current backend, API, auth, DB schema, and theme unchanged.

## Scope Guard

- No backend logic change
- No API change
- No DB schema change
- No authentication change
- No visual redesign

## Work Started

1. Admin category canonicalization started and applied
- Product save now normalizes category input to canonical taxonomy subcategory slug.
- Legacy alias values are still accepted in admin input and mapped during save.

2. Taxonomy category option source started and applied
- Central helper provides recommended category chips for admin product form.
- Admin can still type manually for compatibility.

3. Static data alignment started and applied
- shop data helpers now resolve legacy and canonical slug equivalence.
- Home category links now point to taxonomy-compatible segment/subcategory routes.

4. Legacy route compatibility hardening started and applied
- Shop listing fallback logic now maps legacy segment slugs and legacy subcategory slugs through taxonomy matching.

## Validation So Far

- Lint passed after each implementation batch.
- No route removals were made.
- Dev server boot check passed locally via Vite (`http://localhost:4173/`).
- In-tool browser verification is currently blocked by localhost network domain policy in this coding session.

## Remaining Checks Before Marking Complete

1. Manual verification pass
- Open men, women, kids segment routes.
- Open legacy route shapes and confirm expected product results.
- Verify subcategory query behavior for mapped legacy slugs.

2. Admin to shop flow check
- Create and edit products from admin with category aliases and canonical slugs.
- Confirm listing visibility and filtering behavior in shop.

## Current Blocker

- Browser automation in this session cannot open localhost URLs because of environment network policy.
- Completion of manual route and admin smoke checks needs either:
	- shared browser page from user, or
	- user-side manual verification using this checklist.

## Acceptance Checklist

- [x] Canonical + alias mapping used in runtime filters
- [x] Admin save path writes canonical category slug
- [x] Static data access remains backward compatible
- [x] Home category links aligned to taxonomy-aware routes
- [ ] Manual route verification completed
- [ ] Admin create/edit smoke verification completed
