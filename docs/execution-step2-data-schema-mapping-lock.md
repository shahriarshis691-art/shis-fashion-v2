# Step 2 - Data Schema and Mapping Lock

Date: 2026-07-24
Status: Locked for implementation
Depends on: execution-step1-user-flow-lock.md (approved)

## 1) Objective

Create a key-based category content model so label, link, and image stay matched.
Remove index-based coupling that causes image-category mismatch.
Guarantee exact listing behavior with canonical + legacy alias mapping.

## 2) Canonical Section Keys (Locked)

- women
- men
- kids
- western
- sale
- new-arrivals

These keys are immutable identifiers in admin and storefront bindings.
Display labels can change, but keys cannot.

## 3) Canonical Product Taxonomy (Locked)

### Women subcategories
- kurti
- tops
- shirts
- denim
- saree
- tunic
- accessories

### Men subcategories
- shirts
- polos
- panjabi
- oversized-tee
- t-shirts
- denim
- pants
- jackets
- accessories

### Kids subcategories
- kids

## 4) Legacy Alias Mapping (Locked)

### Women aliases
- tops <- womens-dresses
- shirts <- womens-shirt
- tunic <- western, western-outfits
- accessories <- gift

### Men aliases
- shirts <- mens-shirt
- oversized-tee <- unisex-tee
- t-shirts <- unisex-tee
- accessories <- gift, couples

### Kids aliases
- kids <- kid, kids

Rule:
All product category values must resolve through canonical mapping before filtering.

## 5) Firestore Content Model (Locked)

## Collection
- homepageContent/{docId}

## Field: categorySections
Type: object map keyed by section key.

Example shape:
{
  "women": {
    "key": "women",
    "label": "Women",
    "href": "/women",
    "enabled": true,
    "order": 10,
    "coverImage": "https://...",
    "images": ["https://..."],
    "updatedAt": "serverTimestamp"
  },
  "men": {
    "key": "men",
    "label": "Men",
    "href": "/men",
    "enabled": true,
    "order": 20,
    "coverImage": "https://...",
    "images": ["https://..."],
    "updatedAt": "serverTimestamp"
  }
}

Notes:
- key inside each section must match the parent map key.
- coverImage is the default storefront tile image.
- images is optional gallery for future section banner/carousel use.

## 6) Admin DTO Contract (Locked)

Section DTO fields:
- key: string
- label: string
- href: string
- enabled: boolean
- order: number
- coverImage: string
- images: string[]
- updatedAt: timestamp or null

Validation:
- key must be one of locked section keys.
- label cannot be empty.
- href must start with / and route must exist.
- coverImage should be non-empty for enabled sections.
- images URLs must be unique within the same section.

## 7) Storefront Binding Rules (Locked)

1. Category strip and section cards must read from categorySections by key.
2. No index-based merges between hardcoded labels and image arrays.
3. If section is disabled, hide from storefront.
4. If coverImage missing, show fallback image but keep correct label/key binding.
5. Sort visible sections by order ascending.

## 8) Exact Listing Filter Contract (Locked)

Given section key + optional subcategory:
1. Resolve product category through alias map.
2. Match section scope first.
3. If subcategory exists, apply section + subcategory both.
4. If no results, show empty state.
5. Never backfill with unrelated products.

## 9) Migration Plan (Locked)

### Source
- Existing homepage category arrays and homeCategoryItems fallback data.

### Target
- homepageContent.categorySections key-based map.

### Migration steps
1. Build one-time mapper from current arrays to section map.
2. Populate missing sections with defaults from taxonomy and existing links.
3. Preserve existing valid links and image URLs where possible.
4. Add western section explicitly if absent.
5. Keep old fields during transition for one release.
6. Switch storefront read priority to categorySections.
7. Remove legacy array dependence after validation.

## 10) Backward Compatibility (Locked)

- Existing routes remain valid.
- Legacy category slug values remain valid through alias resolver.
- Product schema remains unchanged (no immediate category field migration required).

## 11) Acceptance Criteria (Must Pass)

1. Label-image mismatch cannot occur from data model structure.
2. Men/Women/Kids/Western/Sale/New Arrivals each have independent editable state.
3. Section updates in admin reflect only that section in storefront.
4. Exact listing rules pass for all submenu clicks.
5. Refresh and back preserve section and subcategory listing state.

## 12) Ready Signal for Step 3

Step 3 can start after this document is approved with no structural changes.
Step 3 scope:
- Admin UI: section-wise edit panels
- Service layer: categorySections read/write helpers
- Storefront: key-based section rendering and strict filter usage
