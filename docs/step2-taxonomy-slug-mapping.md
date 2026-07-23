# Step 2 - Taxonomy and Slug Mapping (Non-Breaking)

Goal: Introduce the new navigation/category hierarchy without breaking existing routes, product data, filters, search, or admin CRUD behavior.

## 1) Target Navigation Taxonomy

### Men
- shirts
- polos
- panjabi
- oversized-tee
- t-shirts
- denim
- pants
- jackets
- accessories

### Women
- kurti
- tops
- shirts
- denim
- saree
- tunic
- accessories

### Kids
- kids

### Global top-level links
- new-arrivals
- featured
- sale
- contact

## 2) Current Category Slugs Observed

From codebase/product seeds:
- oversized-tee
- unisex-tee
- denim
- mens-shirt
- womens-dresses
- western-outfits
- couples
- gift
- kids

Also observed in home category links:
- mens
- womens
- couples
- kids
- western
- denim

## 3) Non-Breaking Canonical Mapping

Use canonical subcategory slugs for the new IA while keeping legacy slugs compatible.

### Men canonical + legacy aliases
- shirts: aliases -> mens-shirt
- polos: aliases -> (none yet)
- panjabi: aliases -> (none yet)
- oversized-tee: aliases -> oversized-tee, unisex-tee
- t-shirts: aliases -> unisex-tee
- denim: aliases -> denim
- pants: aliases -> (none yet)
- jackets: aliases -> (none yet)
- accessories: aliases -> gift, couples

### Women canonical + legacy aliases
- kurti: aliases -> (none yet)
- tops: aliases -> womens-dresses
- shirts: aliases -> (none yet)
- denim: aliases -> denim
- saree: aliases -> (none yet)
- tunic: aliases -> western-outfits
- accessories: aliases -> gift

### Kids canonical + legacy aliases
- kids: aliases -> kids

## 4) Route Strategy (No Break)

Do not remove current routes. Add canonical query/segment handling while preserving old routes:

- Keep existing working routes:
  - /shop
  - /women
  - /men
  - /kids
  - /shop/:slug
  - /shop/:category/:productSlug
  - /collections/:slug

- Add compatibility behavior in listing logic:
  - Treat legacy category values through alias maps.
  - If both canonical and legacy are present, canonical display wins.

## 5) Data Handling Rules

1. Product `category` field remains unchanged (no schema change).
2. Resolve display grouping through runtime mapping layer only.
3. Admin CRUD keeps writing/reading `category` as-is until a later controlled migration (optional).
4. Search/filter logic uses both canonical + alias matching.

## 6) Labeling Rules

To avoid overlap confusion:
- Men Shirts = formal/casual shirts mapped from mens-shirt
- Men T-Shirts = mapped from unisex-tee where relevant
- Women Tops = mapped from womens-dresses initially (transitional)

## 7) Step 2 Acceptance Checklist

- [x] Target taxonomy locked
- [x] Existing slugs inventoried
- [x] Canonical-to-legacy alias map defined
- [x] Non-breaking route strategy defined
- [x] No backend/API/schema changes required

## 8) Step 3 Ready Inputs

Step 3 can now implement:
1. In-memory taxonomy map constants
2. Navbar/menu data source upgrade
3. Category -> Subcategory -> Listing selection logic with alias-aware filtering
4. No theme redesign and no business logic removal
