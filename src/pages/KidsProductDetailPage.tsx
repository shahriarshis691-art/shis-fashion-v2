import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import AarongProductCard from '../components/shop/AarongProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import MobilePdpStickyBar from '../components/shop/MobilePdpStickyBar'
import { useCart, writeBuyNowCheckout, type CartItem } from '../context/CartContext'
import {
  getKidsProductBySlug,
  KIDS_COLOR_LABELS,
  KIDS_PRODUCT_CARE,
  KIDS_PRODUCT_FABRIC,
  KIDS_TRUST_BADGES,
  kidsOversizedTeeProducts,
  type KidsOversizedTeeProduct,
} from '../data/kidsOversizedTeeCollection'
import { DELIVERY_RETURN_BULLETS, STORE_POLICY } from '../data/storePolicy'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { usePdpActionGate } from '../hooks/usePdpActionGate'
import { googleAnalytics } from '../services/googleAnalytics'
import { metaPixel } from '../services/metaPixel'
import { getCatalogContentId } from '../utils/catalogIdentity'
import { parseBDT } from '../utils/currency'
import { applyNotFoundSeo, applySeoMetadata, buildProductSchema } from '../utils/seo'

const KidsSizeGuideModal = lazy(() => import('../components/kids/KidsSizeGuideModal'))
const InstantCheckoutSheet = lazy(() => import('../components/shop/InstantCheckoutSheet'))
const prefetchKidsProductDetail = () => import('./KidsProductDetailPage')
const SITE_URL = 'https://www.shisfashion.com'

function getStockLabel(stock: number) {
  if (stock <= 0) {
    return 'Out of stock'
  }
  if (stock <= 5) {
    return `Only ${stock} left`
  }
  return 'In stock'
}

function formatDisplayPrice(price: string) {
  const amount = parseBDT(price)
  return `Tk ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function KidsProductDetailPage() {
  const { productSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  const product = useMemo(() => getKidsProductBySlug(productSlug ?? ''), [productSlug])

  const colorFromQuery = searchParams.get('color')?.trim() ?? ''
  const initialColor =
    product?.colors?.find((color) => color.toLowerCase() === colorFromQuery.toLowerCase())
    ?? product?.colors?.[0]
    ?? 'Default'

  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [didAddToBag, setDidAddToBag] = useState(false)
  const [instantCheckoutOpen, setInstantCheckoutOpen] = useState(false)
  const [instantCheckoutItems, setInstantCheckoutItems] = useState<CartItem[]>([])
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [activeProductId, setActiveProductId] = useState(product?.id)

  if (product && product.id !== activeProductId) {
    setActiveProductId(product.id)
    setSelectedSize('')
    setSelectedColor(initialColor)
    setQuantity(1)
    setActiveImageIndex(0)
    setIsZoomOpen(false)
    setDidAddToBag(false)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [product?.id])

  useEffect(() => {
    if (!product) {
      applyNotFoundSeo(`/kids/${productSlug ?? ''}`)
      return
    }

    const path = `/kids/${product.slug}`
    const image = product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`

    applySeoMetadata(path, {
      title: `${product.name} | Kids | SHIS Fashion Bangladesh`,
      description: product.description || 'Premium kids oversized tee from SHIS Fashion Bangladesh.',
      canonicalPath: path,
      ogImage: image,
      keywords: `kids oversized tee, ${product.name}, SHIS Fashion kids`,
      schema: [
        buildProductSchema(
          {
            name: product.name,
            description: product.description || 'Premium kids oversized tee from SHIS Fashion.',
            slug: product.slug,
            category: product.category,
            image,
            price: product.price,
            comparePrice: product.comparePrice,
            brand: product.brand,
            stock: product.stock ?? 0,
          },
          path,
        ),
      ],
    })

    metaPixel.trackViewContent({
      content_name: product.name,
      content_ids: [getCatalogContentId(product)],
      content_type: 'product',
      value: parseBDT(product.price),
      currency: 'BDT',
    })

    googleAnalytics.viewItem({
      item_id: getCatalogContentId(product),
      item_name: product.name,
      item_category: product.category,
      price: parseBDT(product.price),
      quantity: 1,
      brand: product.brand,
    }, 'BDT')
  }, [product, productSlug])

  useEffect(() => {
    if (!sizeGuideOpen && !isZoomOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sizeGuideOpen, isZoomOpen])

  const gallery = product?.galleryImages?.length ? product.galleryImages : product ? [product.image] : []
  const activeImage = gallery[activeImageIndex] ?? product?.image ?? '/og-image.svg'
  const sizes = product?.sizes ?? []
  const colors = product?.colors ?? []
  const availableStock = product?.stock ?? 0
  const isSizeSelected = Boolean(selectedSize && sizes.includes(selectedSize))
  const hasColorOptions = colors.length > 0
  const isColorSelected = !hasColorOptions || Boolean(selectedColor && colors.includes(selectedColor))
  const safeSize = isSizeSelected ? selectedSize : sizes[0] ?? '8-9Y'
  const safeColor = isColorSelected ? selectedColor : colors[0] ?? 'Default'
  const maxQuantity = availableStock > 0 ? Math.min(availableStock, 10) : 1
  const effectiveQuantity = Math.max(1, Math.min(quantity, maxQuantity))
  const stockLabel = getStockLabel(availableStock)
  const wished = product ? isInWishlist(String(product.id)) : false
  const { actionError, shakeToken, clearActionError, requireReadyToPurchase } = usePdpActionGate({
    isSizeSelected,
    isColorSelected,
    availableStock,
  })

  const relatedProducts = useMemo(() => {
    if (!product) {
      return []
    }

    return kidsOversizedTeeProducts
      .filter((item) => item.id !== product.id)
      .slice(0, 4)
  }, [product])

  const setPreviousImage = () => {
    setActiveImageIndex((current) => (current - 1 + gallery.length) % gallery.length)
  }

  const setNextImage = () => {
    setActiveImageIndex((current) => (current + 1) % gallery.length)
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
    window.setTimeout(() => setDidAddToBag(false), 1500)
  }

  const handleBuyNow = () => {
    if (!requireReadyToPurchase() || !product) {
      return
    }

    const line: CartItem = {
      ...product,
      id: `${product.slug}-${safeSize}-${safeColor}`,
      size: safeSize,
      color: safeColor,
      quantity: effectiveQuantity,
      stock: availableStock,
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

  if (!product) {
    return (
      <section className="bg-white px-4 py-16 md:px-8">
        <Container>
          <p className="text-[12px] font-normal tracking-wide text-neutral-400">Product unavailable</p>
          <h1 className="mt-2 text-2xl text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
            Kids style not found
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-600">
            This kids oversized tee is no longer available or the link is incorrect.
          </p>
          <Button to="/kids" className="mt-6">
            Back to Kids Collection
          </Button>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white pb-28 md:pb-16">
      <nav aria-label="Breadcrumb" className="px-4 py-3 sm:px-8">
        <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 text-[12px] font-normal tracking-wide text-neutral-400">
          <li>
            <Link to="/" className="transition-colors hover:text-neutral-700">
              Home
            </Link>
          </li>
          <li aria-hidden className="text-neutral-300">
            /
          </li>
          <li>
            <Link to="/kids" className="transition-colors hover:text-neutral-700">
              Kids
            </Link>
          </li>
          <li aria-hidden className="text-neutral-300">
            /
          </li>
          <li className="max-w-[14rem] truncate text-neutral-500 sm:max-w-none">{product.name}</li>
        </ol>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-2">
        {/* Gallery — edge-to-edge on mobile */}
        <div>
          <div
            className="relative aspect-[3/4] w-full overflow-hidden bg-[#f7f7f8]"
            onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStartX == null || gallery.length < 2) {
                setTouchStartX(null)
                return
              }
              const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX
              if (delta > 45) {
                setPreviousImage()
              } else if (delta < -45) {
                setNextImage()
              }
              setTouchStartX(null)
            }}
          >
            <button
              type="button"
              className="absolute inset-0 z-[1]"
              onClick={() => setIsZoomOpen(true)}
              aria-label={`Zoom ${product.name}`}
            >
              <img
                src={activeImage}
                alt={product.name}
                width={960}
                height={1280}
                sizes="(max-width: 1023px) 100vw, 50vw"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out hover:scale-[1.02]"
                onError={(event) => {
                  event.currentTarget.src = '/og-image.svg'
                }}
              />
            </button>

            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={setPreviousImage}
                  className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 bg-white/80 px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-800 backdrop-blur-sm md:block"
                  aria-label="Previous image"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={setNextImage}
                  className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 bg-white/80 px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-800 backdrop-blur-sm md:block"
                  aria-label="Next image"
                >
                  Next
                </button>
              </>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:px-8 lg:px-0">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden bg-[#f7f7f8] ring-1 transition-shadow ${
                    activeImageIndex === index ? 'ring-neutral-900' : 'ring-transparent'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Product info */}
        <div className="px-4 pt-6 sm:px-8 lg:px-0 lg:pt-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">{product.genderCategory}</p>
          <h1
            className="mt-2 text-[1.65rem] font-normal leading-tight tracking-tight text-neutral-900 md:text-3xl"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            {product.name}
          </h1>

          <div className="mt-3 flex min-h-[2rem] items-baseline gap-3 md:mt-4">
            <p className="text-xl font-medium tracking-tight text-neutral-900 tabular-nums md:text-2xl">
              {formatDisplayPrice(product.price)}
            </p>
            {product.originalPrice ? (
              <p className="text-sm text-neutral-400 line-through tabular-nums">
                {formatDisplayPrice(product.originalPrice)}
              </p>
            ) : null}
          </div>
          <p className={`mt-1.5 text-sm ${availableStock <= 0 ? 'text-red-600' : 'text-neutral-500'}`}>
            {stockLabel}
            {isSizeSelected && availableStock > 0 && availableStock <= 5 ? ` · ${availableStock} remaining` : ''}
          </p>

          <div className="mt-4 md:mt-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Size</p>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="text-[11px] font-medium tracking-wide text-neutral-700 underline underline-offset-4"
              >
                Size Guide
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 md:mt-3">
              {sizes.map((size) => {
                const active = selectedSize === size
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3.75rem] rounded-full px-4 py-2.5 text-[12px] font-medium tracking-wide transition-colors duration-300 ${
                      active
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            {!isSizeSelected ? (
              <p className="mt-2 text-xs text-neutral-400">Select a size to continue.</p>
            ) : null}
          </div>

          {hasColorOptions ? (
            <div className="mt-4 md:mt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Color</p>
              <div className="mt-2 flex flex-wrap gap-2 md:mt-3">
                {product.colorHexes.map((hex) => {
                  const label = KIDS_COLOR_LABELS[hex] ?? hex
                  const selected = selectedColor === label
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSelectedColor(label)}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-medium tracking-wide transition-colors ${
                        selected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      }`}
                      aria-pressed={selected}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: hex }}
                      />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-4 md:mt-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Quantity</p>
            <div className="mt-2 inline-flex items-center rounded-full bg-neutral-100 md:mt-3">
              <button
                type="button"
                className="px-4 py-2.5 text-sm text-neutral-700"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums text-neutral-900">
                {effectiveQuantity}
              </span>
              <button
                type="button"
                className="px-4 py-2.5 text-sm text-neutral-700"
                onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-5 hidden gap-3 md:flex">
            <button
              type="button"
              onClick={handleAddToBag}
              className="flex-1 rounded-sm border border-neutral-900 bg-white px-4 py-3.5 text-sm font-semibold tracking-wider text-neutral-900 uppercase transition-colors hover:bg-neutral-50"
            >
              {didAddToBag ? 'Added' : 'Add to Cart'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 rounded-sm bg-neutral-950 px-4 py-3.5 text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-neutral-800"
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={() => handleToggleWishlist(product)}
              className={`flex h-[3.25rem] w-12 items-center justify-center border transition-colors ${
                wished ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-700'
              }`}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
          {actionError ? (
            <p className="mt-2 hidden text-sm text-red-600 md:block" role="alert">
              {actionError}
            </p>
          ) : null}

          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {KIDS_TRUST_BADGES.map((item) => (
              <div
                key={item}
                className="bg-[#f7f7f8] px-2.5 py-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-600"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Container className="mt-10 sm:mt-14">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Product Details</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-700">{product.description}</p>
            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Fabric</p>
            <p className="mt-1.5 text-sm leading-7 text-neutral-700">{KIDS_PRODUCT_FABRIC}</p>
          </div>

          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Care & Delivery</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
              {KIDS_PRODUCT_CARE.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <ul className="mt-5 space-y-2 border-t border-neutral-100 pt-5 text-sm leading-6 text-neutral-700">
              {DELIVERY_RETURN_BULLETS.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>{STORE_POLICY.phoneConfirm}</li>
            </ul>
          </div>
        </div>

        {relatedProducts.length ? (
          <div className="mt-12 sm:mt-16">
            <div className="flex items-end justify-between gap-2 border-b border-neutral-100 pb-3">
              <h2 className="text-lg text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
                More Kids Styles
              </h2>
              <Link
                to="/kids"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-900"
              >
                View all
              </Link>
            </div>
            <ProductListingGrid className="mt-6">
              {relatedProducts.map((item, index) => (
                <AarongProductCard
                  key={item.id}
                  product={item}
                  href={`/kids/${item.slug}`}
                  prefetchModule={prefetchKidsProductDetail}
                  priority={index < 4}
                  isInWishlist={isInWishlist(String(item.id))}
                  onToggleWishlist={(itemProduct) => handleToggleWishlist(itemProduct as KidsOversizedTeeProduct)}
                />
              ))}
            </ProductListingGrid>
          </div>
        ) : null}
      </Container>

      <MobilePdpStickyBar
        didAddToBag={didAddToBag}
        actionError={actionError}
        shakeToken={shakeToken}
        onAddToBag={handleAddToBag}
        onBuyNow={handleBuyNow}
        buyNowLabel="Order Now"
      />

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
                className="border border-white/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden bg-black/25">
              <img
                src={activeImage}
                alt={`${product.name} zoom`}
                className="h-full w-full object-contain"
                loading="eager"
                decoding="async"
              />
              {gallery.length > 1 ? (
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

      {sizeGuideOpen ? (
        <Suspense fallback={null}>
          <KidsSizeGuideModal onClose={() => setSizeGuideOpen(false)} />
        </Suspense>
      ) : null}
    </section>
  )
}
