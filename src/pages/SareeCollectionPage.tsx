import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { mergeSareeCatalog, type SareeProduct } from '../data/sareeCollection'
import { subscribeToProducts } from '../firebase/adminService'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'

const prefetchSareeProductDetail = () => import('./SareeProductDetailPage')
const SITE_URL = 'https://www.shisfashion.com'

const SAREE_LISTING_HERO = {
  jpg: '/hero/kids/hero-soft-cotton-saree.jpg',
  webp: '/hero/kids/hero-soft-cotton-saree.jpg.webp',
  width: 1086,
  height: 1448,
  alt: 'Tat Soft Cotton Saree - SHIS Fashion',
} as const

type SortOption = 'featured' | 'price-low' | 'price-high'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export default function SareeCollectionPage() {
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()
  const [products, setProducts] = useState<SareeProduct[]>(() => mergeSareeCatalog([]))
  const [sortBy, setSortBy] = useState<SortOption>('featured')

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(mergeSareeCatalog(nextProducts.map((product) => mapAdminProductToShopProduct(product))))
    })

    return unsubscribe
  }, [])

  const visibleProducts = useMemo(() => {
    const sorted = [...products]

    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
      return sorted
    }

    if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
      return sorted
    }

    sorted.sort(
      (left, right) =>
        Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
        (right.stock ?? 0) - (left.stock ?? 0),
    )
    return sorted
  }, [products, sortBy])

  useEffect(() => {
    applySeoMetadata('/sarees', {
      title: "Women's Sarees | SHIS Fashion Bangladesh",
      description:
        "Shop the SHIS Fashion women's saree collection — refined weaves, fluid drapes, and premium everyday luxury with fast delivery and cash on delivery.",
      canonicalPath: '/sarees',
      keywords: 'Saree Bangladesh, SHIS saree, women saree collection, premium saree Dhaka',
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'SHIS Fashion Saree Collection',
          numberOfItems: products.length,
          itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/sarees/${product.slug}`,
            name: product.name,
          })),
        },
        ...products.map((product) =>
          buildProductSchema(
            {
              name: product.name,
              description: product.description,
              slug: product.slug,
              category: product.category,
              image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
              price: product.price,
              brand: product.brand,
              stock: product.stock ?? 0,
            },
            `/sarees/${product.slug}`,
          ),
        ),
      ],
    })
  }, [products])

  return (
    <section className="bg-white pb-24">
      {/* Portrait campaign poster — framed per breakpoint; no CTA overlay */}
      <div className="saree-listing-hero md:aspect-auto md:h-[65vh] md:max-h-none md:min-h-0 md:w-full md:max-w-full lg:h-[75vh] lg:max-h-[700px]">
        <img
          src={SAREE_LISTING_HERO.jpg}
          alt=""
          aria-hidden
          width={SAREE_LISTING_HERO.width}
          height={SAREE_LISTING_HERO.height}
          className="saree-listing-hero__bleed"
          loading="eager"
          decoding="async"
        />
        <picture>
          <source srcSet={SAREE_LISTING_HERO.webp} type="image/webp" sizes="100vw" />
          <img
            src={SAREE_LISTING_HERO.jpg}
            alt={SAREE_LISTING_HERO.alt}
            width={SAREE_LISTING_HERO.width}
            height={SAREE_LISTING_HERO.height}
            sizes="100vw"
            className="saree-listing-hero__image md:object-cover md:object-[center_20%]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={(event) => {
              const image = event.currentTarget
              const src = image.src
              if (src.includes('hero-soft-cotton-saree.jpg') && !src.endsWith('.webp')) {
                image.src = SAREE_LISTING_HERO.webp
                return
              }
              image.src = '/og-image.svg'
            }}
          />
        </picture>
      </div>

      <div className="mx-auto w-full max-w-7xl px-3 pt-6 md:px-6 lg:pt-10">
        <nav aria-label="Breadcrumb" className="text-[12px] font-normal tracking-wide text-neutral-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-neutral-700">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li>
              <Link to="/women" className="hover:text-neutral-700">
                Women
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li className="text-neutral-500">Sarees</li>
          </ol>
        </nav>

        <header className="mt-8 sm:mt-10">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Saree Collection</h1>
            <span className="text-xs font-normal text-neutral-400">
              {visibleProducts.length} Product{visibleProducts.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Refined weaves and fluid drapes for celebrations, evenings, and considered everyday elegance.
          </p>
        </header>

        <div className="mt-8 flex items-center justify-end border-b border-neutral-100 pb-3 sm:mt-10">
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="appearance-none bg-transparent pr-5 text-xs font-medium text-neutral-700 outline-none hover:text-neutral-900"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%737373' stroke-width='1.5'%3E%3Cpath d='m3 4.5 3 3 3-3'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.15rem center',
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div id="saree-grid">
          <ProductListingGrid className="mt-8">
            {visibleProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/sarees/${product.slug}`}
                prefetchModule={prefetchSareeProductDetail}
                priority={index < 4}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist(String(product.id))}
              />
            ))}
          </ProductListingGrid>
        </div>
      </div>
    </section>
  )
}
