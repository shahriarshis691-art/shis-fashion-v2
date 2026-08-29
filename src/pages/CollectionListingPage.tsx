import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { getManagedImageEntries, getProductImage, isDemoImageUrl } from '../utils/media'
import LuxuryImage from '../components/common/LuxuryImage'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { filterListingProducts } from '../utils/listingProducts'
import { normalizeSizes } from '../utils/sizes'
import { subscribeToHomepageContent, subscribeToProducts, type AdminProduct, type FeaturedCollectionPage, type HomepageContent } from '../firebase/adminService'
import { featuredCollectionCovers } from '../data/featuredCollectionCovers'
import { googleAnalytics } from '../services/googleAnalytics'
import { applyNotFoundSeo, applySeoMetadata } from '../utils/seo'
import NotFoundPage from './NotFoundPage'

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
    images: [featuredCollectionCovers.winter, '/og-image.svg', '/og-image.svg', '/og-image.svg'],
      relatedCategorySlugs: ['denim', 'mens-shirt', 'western-outfits'],
    },
    {
      slug: 'summer',
      title: 'Summer Collection',
      subtitle: 'Breathable premium edits',
      description: 'Lightweight silhouettes designed for warm days and evening plans.',
      href: '/collections/summer',
      images: [featuredCollectionCovers.summer, '/og-image.svg', '/og-image.svg', '/og-image.svg'],
      relatedCategorySlugs: ['unisex-tee', 'womens-dresses', 'oversized-tee'],
    },
    {
      slug: 'everyday-wear',
      title: 'Everyday Wear',
      subtitle: 'Daily go-to luxury',
      description: 'Reliable daily pieces balancing comfort, polish, and movement.',
      href: '/collections/everyday-wear',
      images: [featuredCollectionCovers['everyday-wear'], '/og-image.svg', '/og-image.svg', '/og-image.svg'],
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
      ?? null
  }, [homepageContent.featuredCollectionPages, slug])

  const collectionProducts = useMemo(() => {
    const relatedCategories = (activeCollection?.relatedCategorySlugs ?? []).map((item) => item.trim().toLowerCase())
    const matched = relatedCategories.length
      ? products.filter((item) => relatedCategories.includes(item.category.trim().toLowerCase()))
      : []
    return filterListingProducts(matched)
  }, [activeCollection?.relatedCategorySlugs, products])

  const collectionImages = useMemo(
    () => (activeCollection?.images ?? [])
      .map((image) => image.trim())
      .filter((image) => image && !/og-image\.svg/i.test(image)),
    [activeCollection?.images],
  )

  useEffect(() => {
    if (!ready) {
      return
    }

    if (!activeCollection) {
      applyNotFoundSeo(location.pathname)
      return
    }

    applySeoMetadata(location.pathname, {
      title: `${activeCollection.title} | SHIS Fashion Bangladesh`,
      description: `${activeCollection.description} Discover premium fashion collections from SHIS Fashion Bangladesh.`,
      canonicalPath: location.pathname,
    })
  }, [activeCollection, location.pathname, ready])

  useEffect(() => {
    if (!ready || !activeCollection) {
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
  }, [activeCollection, collectionProducts.length, location.pathname, ready])

  if (!ready) {
    return (
      <section className="bg-white pb-24 pt-6 lg:pb-20 lg:pt-10">
        <Container>
          <p className="text-sm text-black/55">Loading collection...</p>
        </Container>
      </section>
    )
  }

  if (!activeCollection) {
    return <NotFoundPage />
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
          <div className="product-grid mt-8 grid grid-cols-2 items-start gap-x-2.5 gap-y-6 px-2 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-8 sm:px-4">
            {collectionImages.map((image, index) => (
              <LuxuryImage
                key={`${activeCollection.slug}-look-${index}`}
                src={image}
                alt={`${activeCollection.title} look ${index + 1}`}
                width={960}
                height={1440}
                sizes="(max-width: 639px) 50vw, 25vw"
                widths={[320, 480, 768, 960]}
                className="min-w-0 bg-[#f8f8f8]"
                aspectClassName="aspect-[2/3] sm:aspect-[3/4]"
                objectFit="cover"
                preserveFullSubject
                objectPosition="center top"
                hover
                imgClassName={isDemoImageUrl(image) ? 'shis-media-tone' : ''}
              />
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
              {collectionProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
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
                <Button to="/shop" variant="cta">Browse shop</Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
