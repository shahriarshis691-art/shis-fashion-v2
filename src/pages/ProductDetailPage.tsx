import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import PdpAccordion from '../components/shop/PdpAccordion'
import PdpActionButtons from '../components/shop/PdpActionButtons'
import PdpGalleryNav from '../components/shop/PdpGalleryNav'
import PdpCssCropGallery, {
  HALF_SHIRT_CROP_VIEWS,
  getHalfShirtCropView,
  halfShirtCropImageClass,
} from '../components/shop/PdpCssCropGallery'
import PdpQuantityStepper from '../components/shop/PdpQuantityStepper'
import PdpShareButton from '../components/shop/PdpShareButton'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { usePdpActionGate } from '../hooks/usePdpActionGate'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import { useCart, writeBuyNowCheckout, type CartItem } from '../context/CartContext'
import { subscribeToApprovedProductReviews, subscribeToProducts, type AdminProduct, type ProductReview } from '../firebase/adminService'
import { getManagedImageEntries, getProductImage, isDemoImageUrl, catalogImageAttrs } from '../utils/media'
import { formatTkPrice, parseBDT } from '../utils/currency'
import { normalizeSizes, STANDARD_SIZE_GUIDE } from '../utils/sizes'
import { metaPixel } from '../services/metaPixel'
import { googleAnalytics } from '../services/googleAnalytics'
import { applyNotFoundSeo, applySeoMetadata, buildProductSchema } from '../utils/seo'
import { DELIVERY_RETURN_BULLETS } from '../data/storePolicy'
import { getProductSlug } from '../utils/productIdentity'
import { getCatalogContentId } from '../utils/catalogIdentity'
import { getProductStockTotal, getVariantStock, type ProductVariantStock } from '../utils/variantStock'
import { halfShirtCollectionProducts } from '../data/halfShirtCollection'
import { oversizedTeeCollectionProducts } from '../data/oversizedTeeCollection'
import { westernOutfitsCollectionProducts } from '../data/westernOutfitsCollection'
import type { ShopProduct } from '../data/shopData'

const InstantCheckoutSheet = lazy(() => import('../components/shop/InstantCheckoutSheet'))

function toProduct(product: AdminProduct) {
  const imageEntries = getManagedImageEntries(product, 1)
  const primaryImage = getProductImage(product)

  return {
    id: product.id,
    slug: getProductSlug(product),
    name: product.name,
    price: product.price,
    comparePrice: product.comparePrice,
    brand: product.brand,
    category: product.category,
    image: primaryImage || imageEntries[0]?.url || '',
    description: product.description,
    galleryImages: imageEntries.map((entry) => entry.url).filter(Boolean),
    galleryImageTitles: imageEntries.map((entry) => entry.title),
    sizes: normalizeSizes(product.sizes),
    colors: Array.isArray(product.colors) ? product.colors.map((color) => color.trim()).filter(Boolean) : [],
    variants: product.variants ?? [] as ProductVariantStock[],
    stock: getProductStockTotal(product),
    featured: product.featured,
    newArrival: product.newArrival,
  }
}

function getPlaceholderDataUri() {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"%3E%3Crect width="800" height="800" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="34" fill="%23777777"%3EImage unavailable%3C/text%3E%3C/svg%3E'
}

function getStockLabel(stock: number) {
  if (stock <= 0) {
    return 'Out of stock'
  }

  if (stock <= 5) {
    return 'Low stock'
  }

  return 'In stock'
}

function buildHighlights(description: string, sizes: string[], stock: number) {
  const snippets = description
    .split(/[.!?]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 2)

  const sizeLine = sizes.length ? `Available sizes: ${sizes.join(', ')}.` : 'Standard sizing available.'
  const stockLine = stock <= 0 ? 'Temporarily unavailable for dispatch.' : stock <= 5 ? 'Limited stock remaining.' : 'Ready for quick nationwide dispatch.'

  return [...snippets, sizeLine, stockLine].slice(0, 4)
}

function fromCatalogProduct(product: ShopProduct) {
  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    price: product.price,
    comparePrice: product.comparePrice,
    brand: product.brand,
    category: product.category,
    image: product.image,
    description: product.description,
    galleryImages: product.galleryImages?.filter(Boolean) ?? (product.image ? [product.image] : []),
    galleryImageTitles: (product.galleryImages?.length ? product.galleryImages : product.image ? [product.image] : []).map(() => product.name),
    sizes: product.sizes ?? [],
    colors: product.colors ?? [],
    variants: product.variants ?? [] as ProductVariantStock[],
    stock: product.stock ?? 0,
    featured: Boolean(product.featured),
    newArrival: Boolean(product.newArrival),
  }
}

export default function ProductDetailPage() {
  const { productSlug } = useParams()
  const decodedSlug = decodeURIComponent(productSlug ?? '')
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()
  const { addToRecentlyViewed } = useRecentlyViewed()

  const [products, setProducts] = useState<ReturnType<typeof toProduct>[]>(() =>
    [...halfShirtCollectionProducts, ...oversizedTeeCollectionProducts, ...westernOutfitsCollectionProducts].map(fromCatalogProduct),
  )
  const [ready, setReady] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [didAddToBag, setDidAddToBag] = useState(false)
  const [instantCheckoutOpen, setInstantCheckoutOpen] = useState(false)
  const [instantCheckoutItems, setInstantCheckoutItems] = useState<CartItem[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const lastTrackedProductIdRef = useRef<string | null>(null)
  const hasTrackedRecentlyViewedRef = useRef(false)

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      const live = nextProducts.map(toProduct)
      const taken = new Set(live.map((entry) => entry.slug))
      const local = [...halfShirtCollectionProducts, ...oversizedTeeCollectionProducts, ...westernOutfitsCollectionProducts]
        .filter((entry) => !taken.has(entry.slug))
        .map(fromCatalogProduct)
      setProducts([...live, ...local])
      setReady(true)
    })

    return unsubscribe
  }, [])

  const product = products.find((entry) =>
    entry.slug === decodedSlug || String(entry.id) === decodedSlug,
  )

  useEffect(() => {
    if (!product?.id) {
      return () => undefined
    }

    return subscribeToApprovedProductReviews(String(product.id), setReviews)
  }, [product?.id])

  const fallbackImages = product?.image ? [product.image] : []
  const sourceImages = product?.galleryImages?.length ? product.galleryImages : fallbackImages
  const galleryImages = sourceImages.filter(Boolean)
  const resolvedGalleryImages = galleryImages.length ? galleryImages : [getPlaceholderDataUri()]
  const isHalfShirtPdp = Boolean(product && /half-shirt/i.test(product.category))
  const galleryCount = isHalfShirtPdp ? HALF_SHIRT_CROP_VIEWS.length : resolvedGalleryImages.length
  const safeGalleryIndex = Math.min(activeImageIndex, Math.max(galleryCount - 1, 0))

  const activeImage = resolvedGalleryImages[Math.min(activeImageIndex, resolvedGalleryImages.length - 1)] ?? resolvedGalleryImages[0]
  const halfShirtHeroSrc = product?.image || activeImage
  const heroImage = catalogImageAttrs(
    isHalfShirtPdp ? halfShirtHeroSrc : activeImage,
    1400,
    1700,
    '(max-width: 639px) 100vw, (max-width: 1279px) 58vw, 50vw',
    [640, 960, 1400],
  )
  const zoomImage = catalogImageAttrs(isHalfShirtPdp ? halfShirtHeroSrc : activeImage, 1600, 2000, '100vw', [960, 1400, 1600])

  const relatedProducts = (() => {
    if (!product) {
      return []
    }

    const currentPrice = parseBDT(product.price)
    const sameCategory = products.filter((entry) => entry.id !== product.id && entry.category === product.category)
    const otherCategory = products.filter((entry) => entry.id !== product.id && entry.category !== product.category)

    const scored = (entry: ReturnType<typeof toProduct>) => {
      const price = parseBDT(entry.price)
      const priceDiff = Math.abs(price - currentPrice)
      const categoryMatch = entry.category === product.category ? 1 : 0
      return { entry, score: categoryMatch * 1000 - priceDiff }
    }

    const ranked = [...sameCategory, ...otherCategory]
      .map(scored)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.entry)

    return ranked.slice(0, 4)
  })()

  useEffect(() => {
    if (!ready || product) {
      return
    }

    applyNotFoundSeo(location.pathname)
  }, [location.pathname, product, ready])

  useEffect(() => {
    if (!product) {
      return
    }

    if (lastTrackedProductIdRef.current === product.id) {
      return
    }

    lastTrackedProductIdRef.current = product.id

    metaPixel.trackViewContent({
      content_name: product.name,
      content_ids: [getCatalogContentId(product)],
      content_type: 'product',
      value: parseBDT(product.price),
      currency: 'BDT',
      brand: product.brand,
    })

    googleAnalytics.viewItem({
      item_id: getCatalogContentId(product),
      item_name: product.name,
      item_category: product.category,
      price: parseBDT(product.price),
      quantity: 1,
      brand: product.brand,
    }, 'BDT')

    applySeoMetadata(location.pathname, {
      title: `${product.name} | SHIS Fashion Bangladesh`,
      description: `${product.description} Shop now with fast dispatch and cash on delivery in Bangladesh.`,
      canonicalPath: location.pathname,
      schema: [
        buildProductSchema(
          {
            name: product.name,
            description: product.description,
            slug: product.slug,
            category: product.category,
            image: product.image,
            price: product.price,
            stock: product.stock,
            brand: product.brand,
          },
          location.pathname,
        ),
      ],
    })
  }, [location.pathname, product, ready])

  useEffect(() => {
    setActiveImageIndex(0)
  }, [decodedSlug])

  useEffect(() => {
    if (!isZoomOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsZoomOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isZoomOpen])

  useEffect(() => {
    if (!product || hasTrackedRecentlyViewedRef.current) {
      return
    }

    addToRecentlyViewed(product)
    hasTrackedRecentlyViewedRef.current = true

    googleAnalytics.trackEvent('product_viewed', {
      item_id: String(product.id),
      item_name: product.name,
      item_category: product.category,
      value: parseBDT(product.price),
      currency: 'BDT',
      brand: product.brand,
    })
  }, [product, ready, addToRecentlyViewed])

  const handleRelatedProductClick = (relatedProduct: ReturnType<typeof toProduct>) => {
    googleAnalytics.trackEvent('related_product_click', {
      item_id: String(relatedProduct.id),
      item_name: relatedProduct.name,
      item_category: relatedProduct.category,
      value: parseBDT(relatedProduct.price),
      currency: 'BDT',
      brand: relatedProduct.brand,
    })
  }

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.removeAttribute('srcset')
    event.currentTarget.src = getPlaceholderDataUri()
  }

  const setPreviousImage = () => {
    setActiveImageIndex((current) => (current <= 0 ? galleryCount - 1 : current - 1))
  }

  const setNextImage = () => {
    setActiveImageIndex((current) => (current >= galleryCount - 1 ? 0 : current + 1))
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) {
      return
    }

    const delta = event.changedTouches[0].clientX - touchStartX
    if (delta > 45) {
      setPreviousImage()
    } else if (delta < -45) {
      setNextImage()
    }

    setTouchStartX(null)
  }

  const resolvedSize = selectedSize && product?.sizes.includes(selectedSize)
    ? selectedSize
    : product?.sizes.length === 1
      ? product.sizes[0]
      : ''
  const resolvedColor = selectedColor && product?.colors.includes(selectedColor)
    ? selectedColor
    : product?.colors.length === 1
      ? product.colors[0]
      : ''
  const safeSize = resolvedSize || product?.sizes[0] || 'M'
  const isSizeSelected = Boolean(resolvedSize)
  const hasColorOptions = Boolean(product?.colors.length)
  const safeColor = resolvedColor || 'Default'
  const isColorSelected = !hasColorOptions || Boolean(resolvedColor)
  const availableStock = product
    ? Math.max(0, getVariantStock(product, safeSize, safeColor))
    : 0
  const maxQuantity = availableStock > 0 ? Math.min(availableStock, 10) : 1
  const effectiveQuantity = Math.max(1, Math.min(quantity, maxQuantity))
  const stockLabel = getStockLabel(availableStock)
  const { actionError, shakeToken, clearActionError, requireReadyToPurchase } = usePdpActionGate({
    isSizeSelected,
    isColorSelected,
    availableStock,
  })

  const buildCheckoutLine = (): CartItem | null => {
    if (!product) {
      return null
    }

    return {
      ...product,
      id: `${product.slug}-${safeSize}-${safeColor}`,
      size: safeSize,
      color: safeColor,
      quantity: effectiveQuantity,
      stock: availableStock,
    }
  }

  const handleAddToBag = () => {
    if (!requireReadyToPurchase() || !product) {
      return
    }

    addToCart(product, { size: safeSize, color: safeColor, quantity: effectiveQuantity })
    metaPixel.trackAddToCart({
      content_name: product.name,
      content_ids: [getCatalogContentId(product)],
      content_type: 'product',
      value: parseBDT(product.price) * effectiveQuantity,
      currency: 'BDT',
      brand: product.brand,
    })

    googleAnalytics.addToBag({
      item_id: getCatalogContentId(product),
      item_name: product.name,
      item_category: product.category,
      price: parseBDT(product.price),
      quantity: effectiveQuantity,
      brand: product.brand,
    }, 'BDT')

    clearActionError()
    setDidAddToBag(true)
    setTimeout(() => setDidAddToBag(false), 1500)
  }

  const handleBuyNow = () => {
    if (!requireReadyToPurchase() || !product) {
      return
    }

    const line = buildCheckoutLine()
    if (!line) {
      return
    }

    writeBuyNowCheckout([line])
    clearActionError()

    const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
    if (isMobileViewport) {
      setInstantCheckoutItems([line])
      setInstantCheckoutOpen(true)
      return
    }

    googleAnalytics.beginCheckout({
      value: parseBDT(product.price) * effectiveQuantity,
      currency: 'BDT',
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category,
          price: parseBDT(product.price),
          quantity: effectiveQuantity,
          brand: product.brand,
        },
      ],
    })
    navigate('/checkout')
  }

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product) {
      return
    }

    setReviewSubmitting(true)
    setReviewMessage('')
    try {
      const response = await fetch('/api/create-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productSlug: product.slug,
          authorName: reviewName.trim(),
          rating: reviewRating,
          body: reviewBody.trim(),
        }),
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) {
        setReviewMessage(payload.error || 'Unable to submit this review right now.')
        return
      }

      setReviewName('')
      setReviewBody('')
      setReviewRating(5)
      setReviewMessage('Thank you. Your review is pending approval.')
    } catch {
      setReviewMessage('Unable to submit this review right now.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (!ready && !product) {
    return (
      <section className="bg-white px-3.5 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="py-14 text-center text-sm text-black/55">Loading product details...</div>
        </Container>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="bg-white px-3.5 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="border border-black/15 px-6 py-12 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">Product unavailable</p>
            <h1 className="mt-3 text-h2 text-black">This product is no longer available</h1>
            <p className="mt-3 text-sm leading-7 text-black/70">Return to the listing and continue browsing current products.</p>
            <div className="mt-6 flex justify-center">
              <Button to="/shop" variant="cta">Back to shop</Button>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  const highlights = buildHighlights(product.description, product.sizes, availableStock)

  const optionChipClass = (active: boolean) =>
    `inline-flex min-h-10 min-w-10 items-center justify-center border px-3 text-xs tracking-[0.08em] ${
      active ? 'border-black bg-black text-white' : 'border-gray-200 text-neutral-900'
    }`

  return (
    <section className="bg-white pb-16">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-2">
        <div>
          {isHalfShirtPdp ? (
            <PdpCssCropGallery
              src={heroImage.src || halfShirtHeroSrc}
              srcSet={heroImage.srcSet}
              sizes={heroImage.sizes}
              name={product.name}
              activeIndex={safeGalleryIndex}
              onSelect={setActiveImageIndex}
              onPrev={setPreviousImage}
              onNext={setNextImage}
              onZoom={() => setIsZoomOpen(true)}
              onError={handleImageError}
              onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
              onTouchEnd={handleTouchEnd}
            />
          ) : (
          <div
            className="relative aspect-[3/4] w-full bg-[#f7f7f8]"
            onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute inset-0">
              <img
                src={heroImage.src || activeImage}
                srcSet={heroImage.srcSet}
                sizes={heroImage.sizes}
                alt={product.galleryImageTitles?.[activeImageIndex] || product.name}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width="1200"
                height="1600"
                onError={handleImageError}
                onClick={() => setIsZoomOpen(true)}
                className={`pdp-main-image gpu-media h-full w-full cursor-zoom-in object-contain object-[center_top] md:object-cover ${isDemoImageUrl(activeImage) ? 'shis-media-tone' : ''}`}
              />
            </div>
            <PdpGalleryNav
              count={resolvedGalleryImages.length}
              index={Math.min(activeImageIndex, resolvedGalleryImages.length - 1)}
              onPrev={setPreviousImage}
              onNext={setNextImage}
              onSelect={setActiveImageIndex}
            />
          </div>
          )}
        </div>

        <div className="px-4 pt-5 sm:px-6 lg:px-0 lg:pt-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[15px] font-medium leading-snug tracking-[0.06em] text-neutral-900 sm:text-lg">
              {product.name}
            </h1>
            <PdpShareButton title={product.name} />
          </div>

          <p className="mt-2 text-base font-bold tabular-nums text-neutral-900">
            {formatTkPrice(product.price)}
          </p>
          {product.comparePrice ? (
            <p className="mt-0.5 text-sm text-neutral-400 line-through tabular-nums">{formatTkPrice(product.comparePrice)}</p>
          ) : null}
          <p className={`mt-1 text-xs ${availableStock <= 0 ? 'text-red-600' : 'text-neutral-500'}`}>
            {stockLabel}
            {isSizeSelected && isColorSelected && availableStock > 0 && availableStock <= 5 ? ` · ${availableStock} left` : ''}
          </p>

          {product.sizes.length ? (
            <div className="mt-5">
              <p className="text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedSize(option)}
                    className={optionChipClass(resolvedSize === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {!isSizeSelected ? (
                <p className="mt-2 text-xs text-neutral-500">Select a size to continue.</p>
              ) : null}
            </div>
          ) : null}

          {hasColorOptions ? (
            <div className="mt-4">
              <p className="text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Color</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedColor(option)}
                    className={optionChipClass(resolvedColor === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {!isColorSelected ? (
                <p className="mt-2 text-xs text-neutral-500">Select a color to continue.</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            <PdpQuantityStepper
              value={effectiveQuantity}
              max={maxQuantity}
              onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
              onIncrease={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            />
          </div>

          <div className="mt-6 border-t border-gray-200">
            <PdpAccordion title="Product Code">
              <p className="font-medium tracking-[0.08em] text-neutral-900 uppercase">{product.id}</p>
            </PdpAccordion>
            <PdpAccordion title="Product Description">
              <p>{product.description || 'Premium SHIS Fashion piece designed for everyday wear.'}</p>
              <ul className="mt-3 space-y-1.5">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <ul className="mt-3 space-y-1.5">
                {DELIVERY_RETURN_BULLETS.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </PdpAccordion>
            <PdpAccordion title="Reviews / Size Guide">
              <div id="size-guide-details" className="overflow-x-auto">
                <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Size Guide</p>
                <table className="w-full min-w-[240px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] tracking-[0.12em] text-neutral-500 uppercase">
                      <th className="py-2 font-medium">Size</th>
                      <th className="py-2 font-medium">Chest</th>
                      <th className="py-2 font-medium">Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STANDARD_SIZE_GUIDE.map((row) => (
                      <tr key={row.size} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-neutral-900">{row.size}</td>
                        <td className="py-2">{row.chest}</td>
                        <td className="py-2">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 border-t border-gray-200 pt-4">
                <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Reviews</p>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <article key={review.id}>
                      <p className="text-sm font-medium text-neutral-900">{review.authorName} · {'★'.repeat(review.rating)}</p>
                      <p className="mt-1 text-sm">{review.body}</p>
                    </article>
                  ))}
                  {!reviews.length ? <p>No reviews yet. Be the first to share a fit note.</p> : null}
                </div>
                <form className="mt-4 space-y-2" onSubmit={handleSubmitReview}>
                  <input
                    required
                    value={reviewName}
                    onChange={(event) => setReviewName(event.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 text-sm outline-none"
                    placeholder="Your name"
                    maxLength={60}
                  />
                  <select
                    value={reviewRating}
                    onChange={(event) => setReviewRating(Number(event.target.value))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm outline-none"
                    aria-label="Rating"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>
                    ))}
                  </select>
                  <textarea
                    required
                    minLength={10}
                    maxLength={800}
                    value={reviewBody}
                    onChange={(event) => setReviewBody(event.target.value)}
                    className="min-h-20 w-full border border-gray-200 px-3 py-2 text-sm outline-none"
                    placeholder="How was the fit and fabric?"
                  />
                  <button type="submit" disabled={reviewSubmitting} className="h-10 w-full bg-black text-xs font-semibold tracking-[0.14em] text-white uppercase disabled:bg-black/35">
                    {reviewSubmitting ? 'Sending…' : 'Submit review'}
                  </button>
                  {reviewMessage ? <p className="text-sm">{reviewMessage}</p> : null}
                </form>
              </div>
            </PdpAccordion>
          </div>

          <Link
            to="/contact"
            className="mt-4 inline-block text-[12px] font-medium tracking-[0.16em] text-neutral-900 uppercase underline underline-offset-4"
          >
            FIND IN STORE
          </Link>

          <PdpActionButtons
            didAddToBag={didAddToBag}
            actionError={actionError}
            shakeToken={shakeToken}
            onAddToBag={handleAddToBag}
            onBuyNow={handleBuyNow}
          />
        </div>
      </div>

      {relatedProducts.length ? (
        <Container className="mt-12">
          <h2 className="border-b border-gray-200 pb-3 text-[13px] font-medium tracking-[0.16em] text-neutral-900 uppercase">
            Similar Products
          </h2>
          <ProductListingGrid className="mt-5">
            {relatedProducts.map((item, index) => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  price: item.price,
                  category: item.category,
                  image: item.image,
                  description: item.description,
                  galleryImages: item.galleryImages,
                  stock: item.stock,
                  featured: item.featured,
                  newArrival: item.newArrival,
                }}
                priority={index < 4}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist(String(item.id))}
                onProductClick={() => handleRelatedProductClick(item)}
              />
            ))}
          </ProductListingGrid>
        </Container>
      ) : null}

      {instantCheckoutOpen ? (
        <Suspense fallback={null}>
          <InstantCheckoutSheet
            open={instantCheckoutOpen}
            onClose={() => setInstantCheckoutOpen(false)}
            items={instantCheckoutItems}
          />
        </Suspense>
      ) : null}

      {isZoomOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/90 px-3 py-6" onClick={() => setIsZoomOpen(false)}>
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-white/75">Zoom View</p>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="ui-interactive border border-white/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden bg-black/25">
              <img
                src={zoomImage.src || (isHalfShirtPdp ? halfShirtHeroSrc : activeImage)}
                srcSet={zoomImage.srcSet}
                sizes={zoomImage.sizes}
                alt={`${product.name} zoom image${isHalfShirtPdp ? ` — ${getHalfShirtCropView(safeGalleryIndex).label}` : ''}`}
                loading="eager"
                decoding="async"
                onError={handleImageError}
                className={`h-full w-full ${
                  isHalfShirtPdp
                    ? `object-cover transition-transform duration-500 ease-out ${halfShirtCropImageClass(safeGalleryIndex)}`
                    : `object-contain ${isDemoImageUrl(activeImage) ? 'shis-media-tone' : ''}`
                }`}
              />

              {galleryCount > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={setPreviousImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 border border-white/35 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={setNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 border border-white/35 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white"
                  >
                    Next
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
