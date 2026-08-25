import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { sareeCollectionProducts } from '../data/sareeCollection'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'

const prefetchSareeProductDetail = () => import('./SareeProductDetailPage')
const SITE_URL = 'https://www.shisfashion.com'

type SortOption = 'featured' | 'price-low' | 'price-high'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export default function SareeCollectionPage() {
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()
  const [sortBy, setSortBy] = useState<SortOption>('featured')

  const visibleProducts = useMemo(() => {
    const sorted = [...sareeCollectionProducts]

    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
      return sorted
    }

    if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
      return sorted
    }

    return sorted
  }, [sortBy])

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
          numberOfItems: sareeCollectionProducts.length,
          itemListElement: sareeCollectionProducts.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/sarees/${product.slug}`,
            name: product.name,
          })),
        },
        ...sareeCollectionProducts.map((product) =>
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
  }, [])

  return (
    <section className="bg-white px-3 pb-24 pt-6 sm:px-4 lg:px-8 lg:pb-20 lg:pt-10">
      <Container>
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

        <header className="mt-5 max-w-3xl border-b border-neutral-100 pb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Women&apos;s Edit</p>
          <h1
            className="mt-1 text-xl font-normal uppercase tracking-[0.14em] text-neutral-900 sm:text-2xl md:text-3xl"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            Saree Collection
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            Refined weaves and fluid drapes for celebrations, evenings, and considered everyday elegance.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            {visibleProducts.length} styles
          </p>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="border border-neutral-200 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-900 outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ProductListingGrid className="mt-6" id="saree-collection">
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
      </Container>
    </section>
  )
}
