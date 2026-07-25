import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { useCart } from '../context/CartContext'
import { parseBDT } from '../utils/currency'
import { getManagedImageEntries, getProductImage, isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { subscribeToHomepageContent, subscribeToProducts, type AdminProduct, type FeaturedCollectionPage, type HomepageContent } from '../firebase/adminService'
import { metaPixel } from '../services/metaPixel'
import { googleAnalytics } from '../services/googleAnalytics'
import { applySeoMetadata } from '../utils/seo'

interface ListingProduct {
  id: string
  slug: string
  name: string
  price: string
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
    sizes: product.sizes,
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
    images: [
      'https://images.unsplash.com/photo-1516822003754-cca485356ecb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1200&q=80',
    ],
    relatedCategorySlugs: ['denim', 'mens-shirt', 'western-outfits'],
  },
  {
    slug: 'summer',
    title: 'Summer Collection',
    subtitle: 'Breathable premium edits',
    description: 'Lightweight silhouettes designed for warm days and evening plans.',
    href: '/collections/summer',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342452485-86ff0a5a2f6f?auto=format&fit=crop&w=1200&q=80',
    ],
    relatedCategorySlugs: ['unisex-tee', 'womens-dresses', 'oversized-tee'],
  },
  {
    slug: 'everyday-wear',
    title: 'Everyday Wear',
    subtitle: 'Daily go-to luxury',
    description: 'Reliable daily pieces balancing comfort, polish, and movement.',
    href: '/collections/everyday-wear',
    images: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    ],
    relatedCategorySlugs: ['oversized-tee', 'couples', 'kids'],
  },
]

const fallbackHomepageContent: Pick<HomepageContent, 'featuredCollectionPages'> = {
  featuredCollectionPages: fallbackCollections,
}

export default function CollectionListingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart } = useCart()
  const [homepageContent, setHomepageContent] = useState(fallbackHomepageContent)
  const [products, setProducts] = useState<ListingProduct[]>([])
  const [ready, setReady] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const hasTrackedAddToCartRef = useRef(false)
  const hasTrackedBuyNowRef = useRef(false)

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
    const filtered = relatedCategories.length
      ? products.filter((item) => relatedCategories.includes(item.category.trim().toLowerCase()))
      : products

    return filtered.length ? filtered : products
  }, [activeCollection.relatedCategorySlugs, products])

  const featuredProducts = useMemo(() => collectionProducts.slice(0, 8), [collectionProducts])

  const selectedProduct = useMemo(() => {
    if (selectedProductId) {
      return featuredProducts.find((item) => item.id === selectedProductId) ?? featuredProducts[0]
    }
    return featuredProducts[0]
  }, [featuredProducts, selectedProductId])

  const lastTrackedCollectionProductIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedProduct) {
      return
    }

    if (lastTrackedCollectionProductIdRef.current === selectedProduct.id) {
      return
    }

    lastTrackedCollectionProductIdRef.current = selectedProduct.id

    metaPixel.viewContent({
        content_name: activeCollection.title,
        content_ids: [selectedProduct.id],
        content_type: 'product',
        value: parseBDT(selectedProduct.price),
        currency: 'BDT',
      })

      googleAnalytics.viewItem({
        item_id: selectedProduct.id,
        item_name: selectedProduct.name,
        item_category: selectedProduct.category,
        price: parseBDT(selectedProduct.price),
        quantity: 1,
      }, 'BDT')

    applySeoMetadata(location.pathname, {
      title: `${activeCollection.title} | SHIS Fashion Bangladesh`,
      description: `${activeCollection.description} Discover premium fashion collections from SHIS Fashion Bangladesh.`,
    })
  }, [activeCollection.description, activeCollection.title, location.pathname, selectedProduct])

  const collectionImages = activeCollection.images.map((image) => normalizeCatalogImageUrl(image, 1000, 1200))

  if (!ready) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="rounded-[1.8rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 py-10 text-center text-sm text-[var(--color-muted)]">
            Loading collection...
          </div>
        </Container>
      </section>
    )
  }

  if (!featuredProducts.length || !selectedProduct) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Collection unavailable</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">No products available yet.</h1>
            <div className="mt-8 flex justify-center">
              <Button to="/shop">Browse shop</Button>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Featured collection</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">{activeCollection.title}</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">{activeCollection.subtitle}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">{activeCollection.description}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {collectionImages.map((image, index) => (
            <div key={`${activeCollection.slug}-${index}`} className="overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="aspect-[4/5]">
                <img
                  src={image}
                  alt={`${activeCollection.title} look ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 639px) 50vw, (max-width: 1023px) 25vw, 18vw"
                  className={`h-full w-full object-cover ${isDemoImageUrl(image) ? 'shis-media-tone' : ''}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Select product</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {featuredProducts.slice(0, 6).map((product) => {
                const cardImage = normalizeCatalogImageUrl(product.image, 640, 800)
                const selected = selectedProduct.id === product.id

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={`overflow-hidden rounded-[1rem] border text-left transition ${selected ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}
                  >
                    <div className="aspect-[4/5] bg-[var(--color-bg)]">
                      <img
                        src={cardImage}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 20vw"
                        className={`h-full w-full object-cover ${isDemoImageUrl(cardImage) ? 'shis-media-tone' : ''}`}
                      />
                    </div>
                    <div className="px-2.5 py-2.5">
                      <p className="line-clamp-1 text-xs font-semibold text-[var(--color-text)]">{product.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[var(--color-accent)]">{product.price}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Selected</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--color-text)]">{selectedProduct.name}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{selectedProduct.description}</p>
            <p className="mt-3 text-lg font-semibold text-[var(--color-text)]">{selectedProduct.price}</p>
            <div className="mt-4 flex flex-col gap-3">
              <Button
                onClick={() => {
                  if (hasTrackedAddToCartRef.current) {
                    return
                  }

                  hasTrackedAddToCartRef.current = true
                  addToCart(selectedProduct, {
                    size: selectedProduct.sizes[0] ?? 'M',
                    color: 'Default',
                    quantity: 1,
                  })
                  metaPixel.addToCart({
                    content_name: selectedProduct.name,
                    content_ids: [selectedProduct.id],
                    content_type: 'product',
                    value: parseBDT(selectedProduct.price),
                    currency: 'BDT',
                  })
                  googleAnalytics.addToBag({
                    item_id: selectedProduct.id,
                    item_name: selectedProduct.name,
                    item_category: selectedProduct.category,
                    price: parseBDT(selectedProduct.price),
                    quantity: 1,
                  }, 'BDT')
                }}
                variant="cta"
                className="min-h-[3.25rem] justify-center px-5 text-[1rem] font-semibold"
                disabled={selectedProduct.stock <= 0}
              >
                Add to Bag
              </Button>
              <Button
                onClick={() => navigate(`/shop/${selectedProduct.category}/${selectedProduct.slug}`)}
                variant="secondary"
                className="justify-center"
              >
                View details
              </Button>
              <Button
                onClick={() => {
                  if (hasTrackedBuyNowRef.current) {
                    return
                  }

                  hasTrackedBuyNowRef.current = true
                  addToCart(selectedProduct, {
                    size: selectedProduct.sizes[0] ?? 'M',
                    color: 'Default',
                    quantity: 1,
                  })
                  metaPixel.initiateCheckout({
                    value: parseBDT(selectedProduct.price),
                    currency: 'BDT',
                    content_type: 'product',
                    content_ids: [selectedProduct.id],
                  })
                  googleAnalytics.beginCheckout({
                    value: parseBDT(selectedProduct.price),
                    currency: 'BDT',
                    items: [
                      {
                        item_id: selectedProduct.id,
                        item_name: selectedProduct.name,
                        item_category: selectedProduct.category,
                        price: parseBDT(selectedProduct.price),
                        quantity: 1,
                      },
                    ],
                  })
                  navigate('/checkout')
                }}
                variant="secondary"
                className="justify-center"
                disabled={selectedProduct.stock <= 0}
              >
                Buy now
              </Button>
            </div>
          </div>
        </div>

          <div className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">More from this collection</h2>
            <p className="text-sm text-[var(--color-muted)]">{featuredProducts.length} items</p>
          </div>
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-4 min-[420px]:grid-cols-3 sm:gap-x-2.5 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-3.5 lg:gap-y-5 tight-mobile-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  category: product.category,
                  image: product.image,
                  description: product.description,
                  galleryImages: product.galleryImages,
                  stock: product.stock,
                }}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
