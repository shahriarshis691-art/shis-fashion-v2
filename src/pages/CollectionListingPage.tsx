import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { getManagedImageEntries, getProductImage, isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { normalizeSizes } from '../utils/sizes'
import { subscribeToHomepageContent, subscribeToProducts, type AdminProduct, type FeaturedCollectionPage, type HomepageContent } from '../firebase/adminService'
import { googleAnalytics } from '../services/googleAnalytics'
import { applySeoMetadata } from '../utils/seo'

interface ListingProduct {
  id: string
  slug: string
  name: string
  price: string
  comparePrice?: string
  brand?: string
  description: string
  category: string
  image: string
  galleryImages: string[]
  sizes: string[]
  stock: number
}

function toListingProduct(product: AdminProduct): ListingProduct {
  const media = getManagedImageEntries(product, 3)
  const primaryImage = getProductImage(product)
  const base = mapAdminProductToShopProduct(product, {
    image: primaryImage || media[0]?.url || '',
    galleryImages: media.map((entry) => entry.url).filter(Boolean),
  })

  return {
    ...base,
    id: String(base.id),
    brand: product.brand,
    sizes: normalizeSizes(product.sizes),
    galleryImages: base.galleryImages ?? [],
    stock: base.stock ?? 0,
  }
}

const fallbackCollections: FeaturedCollectionPage[] = [
  {
    slug: 'winter',
    title: 'Winter Collection',
    subtitle: 'Layer-ready staples',
    description: 'Cold-season essentials with premium texture and clean tailoring.',
    href: '/collections/winter',
    images: ['/og-image.svg', '/og-image.svg', '/og-image.svg', '/og-image.svg'],
    relatedCategorySlugs: ['denim', 'mens-shirt', 'western-outfits'],
  },
  {
    slug: 'summer',
    title: 'Summer Collection',
    subtitle: 'Breathable premium edits',
    description: 'Lightweight silhouettes designed for warm days and evening plans.',
    href: '/collections/summer',
    images: ['/og-image.svg', '/og-image.svg', '/og-image.svg', '/og-image.svg'],
    relatedCategorySlugs: ['unisex-tee', 'womens-dresses', 'oversized-tee'],
  },
  {
    slug: 'everyday-wear',
    title: 'Everyday Wear',
    subtitle: 'Daily go-to luxury',
    description: 'Reliable daily pieces balancing comfort, polish, and movement.',
    href: '/collections/everyday-wear',
    images: ['/og-image.svg', '/og-image.svg', '/og-image.svg', '/og-image.svg'],
    relatedCategorySlugs: ['oversized-tee', 'couples', 'kids'],
  },
]

const fallbackHomepageContent: Pick<HomepageContent, 'featuredCollectionPages'> = {
  featuredCollectionPages: fallbackCollections,
}

export default function CollectionListingPage() {
  const { slug } = useParams()
  const location = useLocation()
  const [homepageContent, setHomepageContent] = useState(fallbackHomepageContent)
  const [products, setProducts] = useState<ListingProduct[]>([])
  const [ready, setReady] = useState(false)
  const lastTrackedCollectionRef = useRef('')
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  useEffect(() => {
    const unsubscribeHomepage = subscribeToHomepageContent((nextContent) => {
      setHomepageContent({ featuredCollectionPages: nextContent.featuredCollectionPages })
    })

    const unsubscribeProducts = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(toListingProduct))
      setReady(true)
    })

    return () => {
      unsubscribeHomepage()
      unsubscribeProducts()
    }
  }, [])

  const activeCollection = useMemo(() => {
    const collectionSlug = (slug ?? '').trim().toLowerCase()
    return homepageContent.featuredCollectionPages.find((entry) => entry.slug === collectionSlug)
      ?? fallbackCollections.find((entry) => entry.slug === collectionSlug)
      ?? fallbackCollections[0]
  }, [homepageContent.featuredCollectionPages, slug])

  const collectionProducts = useMemo(() => {
    const relatedCategories = activeCollection.relatedCategorySlugs.map((item) => item.trim().toLowerCase())
    return relatedCategories.length
      ? products.filter((item) => relatedCategories.includes(item.category.trim().toLowerCase()))
      : []
  }, [activeCollection.relatedCategorySlugs, products])

  const collectionImages = useMemo(
    () => activeCollection.images
      .map((image) => image.trim())
      .filter((image) => image && !/og-image\.svg/i.test(image))
      .map((image) => normalizeCatalogImageUrl(image, 960, 1200)),
    [activeCollection.images],
  )

  useEffect(() => {
    applySeoMetadata(location.pathname, {
      title: `${activeCollection.title} | SHIS Fashion Bangladesh`,
      description: `${activeCollection.description} Discover premium fashion collections from SHIS Fashion Bangladesh.`,
    })
  }, [activeCollection.description, activeCollection.title, location.pathname])

  useEffect(() => {
    if (!ready) {
      return
    }

    const trackingKey = `${activeCollection.slug}|${collectionProducts.length}|${location.pathname}`
    if (lastTrackedCollectionRef.current === trackingKey) {
      return
    }

    lastTrackedCollectionRef.current = trackingKey
    googleAnalytics.trackEvent('listing_view', {
      segment: 'collection',
      subcategory: activeCollection.slug,
      result_count: collectionProducts.length,
      path: location.pathname,
    })
  }, [activeCollection.slug, collectionProducts.length, location.pathname, ready])

  if (!ready) {
    return (
      <section className="bg-white pb-24 pt-6 lg:pb-20 lg:pt-10">
        <Container>
          <p className="text-sm text-black/55">Loading collection...</p>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white pb-24 pt-6 lg:pb-20 lg:pt-10">
      <Container>
        <header>
          <p className="text-caption uppercase tracking-[0.14em] text-black/55">Featured collection</p>
          <h1 className="mt-1 text-h1 text-black">{activeCollection.title}</h1>
          {activeCollection.subtitle ? (
            <p className="mt-2 text-caption font-semibold uppercase tracking-[0.14em] text-black/55">{activeCollection.subtitle}</p>
          ) : null}
          <p className="mt-3 max-w-2xl text-body text-black/72">{activeCollection.description}</p>
        </header>

        {collectionImages.length ? (
          <div className="mt-8 grid grid-cols-2 items-start gap-x-1.5 gap-y-4 sm:grid-cols-4 sm:gap-x-2.5 sm:gap-y-5">
            {collectionImages.map((image, index) => (
              <div key={`${activeCollection.slug}-look-${index}`} className="min-w-0 aspect-[4/5] overflow-hidden bg-black/5">
                <img
                  src={image}
                  alt={`${activeCollection.title} look ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 639px) 50vw, 25vw"
                  className={`h-full w-full object-cover object-center ${isDemoImageUrl(image) ? 'shis-media-tone' : ''}`}
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-h2 text-black">The collection</h2>
            <p className="text-caption uppercase tracking-[0.12em] text-black/55">{collectionProducts.length} items</p>
          </div>

          {collectionProducts.length ? (
            <ProductListingGrid>
              {collectionProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onToggleWishlist={handleToggleWishlist}
                  isInWishlist={isInWishlist(String(product.id))}
                />
              ))}
            </ProductListingGrid>
          ) : (
            <div className="border-t border-black/10 pt-8 text-center">
              <p className="text-caption uppercase tracking-[0.14em] text-black/55">Collection unavailable</p>
              <h2 className="mt-3 text-h2 text-black">No products available yet.</h2>
              <div className="mt-6 flex justify-center">
                <Button to="/shop">Browse shop</Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
